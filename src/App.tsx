import { useState, useEffect, useRef } from 'react';
import { type Note, getNoteFromMidi } from './core/notes';
import { generateScale, type Scale, type ScaleType } from './core/scales';
import { detectChord, type ChordResult } from './core/chords';
import { Fretboard } from './components/Fretboard';
import { Piano } from './components/Piano';
import { Midi } from '@tonejs/midi';
import { analyzeMidi, type ChordEvent } from './core/analyzer';
import { transcribeAudioToMidi } from './core/audioToMidi';

function App() {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [detectedChord, setDetectedChord] = useState<ChordResult | null>(null);
  const [targetScale, setTargetScale] = useState<Scale | undefined>();
  const [selectedScaleType, setSelectedScaleType] = useState<ScaleType>('Major');

  // MIDI / Audio State
  const [midiData, setMidiData] = useState<Midi | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [analysis, setAnalysis] = useState<ChordEvent[]>([]);

  // Audio Transcription State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);

  // Playback Refs
  const startTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);

  // Logic: Chord Detection
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

  // MIDI Access
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
    function onMIDIFailure() { console.warn('No MIDI Devices'); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getMIDIMessage(message: any) {
      if (isPlaying) return;
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

  // File Upload & Analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isAudio = file.type.startsWith('audio') || file.name.endsWith('.mp3') || file.name.endsWith('.wav');

    // Reset State
    setActiveNotes([]);
    setIsPlaying(false);
    setPlaybackTime(0);
    setAnalysis([]);
    setMidiData(null);

    if (isAudio) {
      try {
        setIsTranscribing(true);
        setTranscriptionProgress(0);

        // 1. Decode Audio
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        // 2. Transcribe
        const midi = await transcribeAudioToMidi(audioBuffer, (pct) => {
          setTranscriptionProgress(Math.round(pct * 100));
        });

        midi.name = file.name + " (Transcribed)";
        setMidiData(midi);

        // 3. Analyze
        const report = analyzeMidi(midi);
        setAnalysis(report);

      } catch (err) {
        console.error(err);
        alert('Error processing audio: ' + err);
      } finally {
        setIsTranscribing(false);
      }
    } else {
      // MIDI
      const arrayBuffer = await file.arrayBuffer();
      const midi = new Midi(arrayBuffer);
      setMidiData(midi);
      const report = analyzeMidi(midi);
      setAnalysis(report);
    }
  };

  // Playback Engine
  useEffect(() => {
    if (isPlaying && midiData) {
      startTimeRef.current = performance.now() - (playbackTime * 1000);

      const loop = () => {
        const now = performance.now();
        const currentSeconds = (now - startTimeRef.current) / 1000;
        setPlaybackTime(currentSeconds);

        if (currentSeconds > midiData.duration) {
          setIsPlaying(false);
          setPlaybackTime(0);
          setActiveNotes([]);
          cancelAnimationFrame(requestRef.current);
          return;
        }

        // Active Notes Logic (Brute force for safety)
        const active: Note[] = [];
        midiData.tracks.forEach(track => {
          track.notes.forEach(note => {
            if (currentSeconds >= note.time && currentSeconds < (note.time + note.duration)) {
              active.push(getNoteFromMidi(note.midi));
            }
          });
        });
        const unique = active.filter((v, i, a) => a.findIndex(t => t.midi === v.midi) === i);

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
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isPlaying, midiData]);

  const SCALE_TYPES: ScaleType[] = [
    'Major', 'Minor', 'Harmonic Minor', 'Melodic Minor',
    'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'
  ];

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505', color: '#eee' }}>

      {/* HEADER */}
      <div style={{
        padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid #222', background: '#111'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: detectedChord ? '#fff' : '#444' }}>
              {detectedChord ? detectedChord.name : 'Waiting...'}
            </h1>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: '#0a0a0a', padding: '10px 20px', borderRadius: '8px', border: '1px solid #222' }}>
          <div style={{ textAlign: 'right' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '4px', cursor: 'pointer', textDecoration: 'underline' }}>
              Upload MIDI / MP3
              <input type="file" accept=".mid,.midi,audio/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            {isTranscribing ? (
              <div style={{ fontSize: '0.8rem', color: '#d946ef', fontWeight: 'bold' }}>
                Analizando Audio... {transcriptionProgress}%
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                {midiData ? midiData.name || 'Untitled' : 'No File'}
              </div>
            )}
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            disabled={!midiData || isTranscribing}
            style={{
              width: '50px', height: '50px', borderRadius: '50%', border: 'none',
              background: isPlaying ? '#ef4444' : '#22c55e', color: 'white', fontSize: '1.2rem',
              cursor: (midiData && !isTranscribing) ? 'pointer' : 'not-allowed', opacity: (midiData && !isTranscribing) ? 1 : 0.3,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isPlaying ? '■' : '▶'}
          </button>
          <div style={{ width: '60px', textAlign: 'center', fontFamily: 'monospace', color: '#666' }}>
            {playbackTime.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* CENTER STAGE With SPLIT VIEW */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', paddingBottom: '140px' }}>

        {/* LEFT: Fretboard (75%) */}
        <div style={{ flex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #222' }}>
          <div style={{ width: '90%', maxWidth: '1200px' }}>
            <Fretboard
              scale={targetScale}
              activeNotes={activeNotes}
              root={activeNotes.length > 0 ? activeNotes[0] : undefined}
            />
          </div>
        </div>

        {/* RIGHT: Analysis Report (25%) */}
        <div style={{ width: '300px', background: '#080808', display: 'flex', flexDirection: 'column', borderLeft: '1px solid #222' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #222', background: '#111' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Chord Sheet</h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Estimated from Input</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            {analysis.length === 0 && <p style={{ color: '#444', textAlign: 'center', fontSize: '0.8rem', marginTop: '20px' }}>Load File to see chords</p>}

            {analysis.map((event, idx) => {
              const isActive = playbackTime >= event.startTime && playbackTime < event.endTime;
              const ref = useRef<HTMLDivElement>(null);

              useEffect(() => {
                if (isActive && ref.current) {
                  ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, [isActive]);

              return (
                <div key={idx} ref={ref} style={{
                  padding: '8px 12px', marginBottom: '4px', borderRadius: '4px',
                  background: isActive ? '#d946ef' : '#151515',
                  color: isActive ? 'white' : '#888',
                  borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
                  display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem',
                  transition: 'all 0.1s'
                }}>
                  <span style={{ fontWeight: 600 }}>{event.chordName}</span>
                  <span style={{ opacity: 0.5, fontFamily: 'monospace' }}>
                    {Math.floor(event.startTime / 60)}:{Math.floor(event.startTime % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* BOTTOM: PIANO */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '140px', background: '#111', borderTop: '2px solid #333', zIndex: 50 }}>
        <div style={{ width: '100%', height: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
          <Piano activeNotes={activeNotes} onToggleNote={toggleNote} />
        </div>
      </div>
    </div>
  );
}

export default App;
