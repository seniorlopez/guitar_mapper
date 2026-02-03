import { useState, useEffect, useRef } from 'react';
import { type Note, getNoteFromMidi } from './core/notes';
import { generateScale, type Scale, type ScaleType } from './core/scales';
import { detectChord, type ChordResult } from './core/chords';
import { Fretboard } from './components/Fretboard';
import { Piano } from './components/Piano';
import { Midi } from '@tonejs/midi';

function App() {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [detectedChord, setDetectedChord] = useState<ChordResult | null>(null);
  const [targetScale, setTargetScale] = useState<Scale | undefined>();
  const [selectedScaleType, setSelectedScaleType] = useState<ScaleType>('Major');

  // MIDI File State
  const [midiData, setMidiData] = useState<Midi | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  // Playback Refs
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const scheduledEventsRef = useRef<Set<string>>(new Set()); // To avoid re-triggering same note events

  // Logic: When notes change, detect chord
  useEffect(() => {
    if (activeNotes.length > 0) {
      const chord = detectChord(activeNotes);
      setDetectedChord(chord);

      const root = chord ? chord.root : activeNotes[0].name;
      const scale = generateScale(root, selectedScaleType);
      setTargetScale(scale);
    } else {
      setDetectedChord(null);
      setTargetScale(undefined);
    }
  }, [activeNotes, selectedScaleType]);

  const toggleNote = (note: Note) => {
    setActiveNotes(prev => {
      const exists = prev.find(n => n.midi === note.midi);
      if (exists) return prev.filter(n => n.midi !== note.midi);
      return [...prev, note].sort((a, b) => a.midi - b.midi);
    });
  };

  // MIDI Access logic (Real Hardware)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.requestMIDIAccess) {
      nav.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function onMIDISuccess(midiAccess: any) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const input of midiAccess.inputs.values()) {
        input.onmidimessage = getMIDIMessage;
      }
    }

    function onMIDIFailure() {
      console.warn('Could not access your MIDI devices.');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getMIDIMessage(message: any) {
      if (isPlaying) return; // Ignore hardware if playing file? Or mix? Mix is chaotic, let's allow mix.

      const command = message.data[0];
      const midiNote = message.data[1];
      const velocity = (message.data.length > 2) ? message.data[2] : 0;
      const note = getNoteFromMidi(midiNote);
      const isNoteOn = (command === 144 && velocity > 0);
      const isNoteOff = (command === 128 || (command === 144 && velocity === 0));

      if (isNoteOn) {
        setActiveNotes(prev => {
          if (prev.find(n => n.midi === note.midi)) return prev;
          return [...prev, note].sort((a, b) => a.midi - b.midi);
        });
      } else if (isNoteOff) {
        setActiveNotes(prev => prev.filter(n => n.midi !== note.midi));
      }
    }
  }, [isPlaying]);

  // File Handling
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      setMidiData(midi);
      setIsPlaying(false);
      setPlaybackTime(0);
      setActiveNotes([]);
      console.log('MIDI Loaded:', midi.name, midi.tracks.length, 'tracks');
    }
  };

  // Playback Loop
  useEffect(() => {
    if (isPlaying && midiData) {
      startTimeRef.current = performance.now() - (playbackTime * 1000);
      scheduledEventsRef.current.clear();

      const loop = () => {
        const now = performance.now();
        const currentSeconds = (now - startTimeRef.current) / 1000;
        setPlaybackTime(currentSeconds);

        if (currentSeconds > midiData.duration) {
          setIsPlaying(false);
          setPlaybackTime(0);
          setActiveNotes([]);
          return;
        }

        // Check for notes active at this timestamp
        // Optimize: This brute force every frame is 0(N) where N is all notes. 
        // For a simple song (~1000 notes) it's fine. For large orch it's bad.
        // Better: We just find Notes where start <= now && start + duration > now.

        // Let's do a simple frame-based approach
        const active: Note[] = [];

        midiData.tracks.forEach(track => {
          track.notes.forEach(note => {
            // If current time is within note window
            if (currentSeconds >= note.time && currentSeconds < (note.time + note.duration)) {
              active.push(getNoteFromMidi(note.midi));
            }
          });
        });

        // Dedup
        const unique = active.filter((v, i, a) => a.findIndex(t => t.midi === v.midi) === i);

        // Only update state if changed (optimization)
        // Since we are creating new objects, simple ref check won't work.
        // JSON stringify for check? Or just midi IDs.
        setActiveNotes(prev => {
          const prevIds = prev.map(n => n.midi).sort().join(',');
          const newIds = unique.map(n => n.midi).sort().join(',');
          if (prevIds === newIds) return prev;
          return unique.sort((a, b) => a.midi - b.midi);
        });

        requestRef.current = requestAnimationFrame(loop);
      };

      requestRef.current = requestAnimationFrame(loop);
    } else {
      cancelAnimationFrame(requestRef.current);
      if (!isPlaying) {
        // Reset notes on stop? yes
        // setActiveNotes([]); 
      }
    }

    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, midiData]);

  const SCALE_TYPES: ScaleType[] = [
    'Major', 'Minor', 'Harmonic Minor', 'Melodic Minor',
    'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'
  ];

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#050505',
      color: '#eee',
    }}>

      {/* HEADER */}
      <div style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #222',
        background: '#111'
      }}>
        {/* Chord & Scale */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: detectedChord ? '#fff' : '#444' }}>
              {detectedChord ? detectedChord.name : 'Waiting...'}
            </h1>
            <p style={{ margin: 0, color: '#666', fontFamily: 'monospace' }}>
              {activeNotes.map(n => n.name).join(' ')}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>Magic Scale</label>
            <select
              value={selectedScaleType}
              onChange={(e) => setSelectedScaleType(e.target.value as ScaleType)}
              style={{ padding: '5px 10px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
            >
              {SCALE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#0a0a0a', padding: '10px 20px', borderRadius: '8px', border: '1px solid #222' }}>
          <div style={{ textAlign: 'right' }}>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              color: '#888',
              marginBottom: '4px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}>
              Upload MIDI
              <input type="file" accept=".mid,.midi,audio/midi" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
              {midiData ? midiData.name || 'Untitled MIDI' : 'No File'}
            </div>
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!midiData}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: 'none',
              background: isPlaying ? '#ef4444' : '#22c55e',
              color: 'white',
              fontSize: '1.2rem',
              cursor: midiData ? 'pointer' : 'not-allowed',
              opacity: midiData ? 1 : 0.3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isPlaying ? '■' : '▶'}
          </button>

          <div style={{ width: '60px', textAlign: 'center', fontFamily: 'monospace', color: '#666' }}>
            {playbackTime.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* STAGE */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: '140px'
      }}>
        <div style={{ width: '90%', maxWidth: '1400px', transform: 'scale(1.1)' }}>
          <Fretboard
            scale={targetScale}
            activeNotes={activeNotes}
            root={activeNotes.length > 0 ? activeNotes[0] : undefined}
          />
        </div>
      </div>

      {/* PIANO (Bottom) */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '140px',
        background: '#111', borderTop: '2px solid #333', zIndex: 50,
      }}>
        <div style={{ width: '100%', height: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
          <Piano activeNotes={activeNotes} onToggleNote={toggleNote} />
        </div>
      </div>

    </div>
  );
}

export default App;
