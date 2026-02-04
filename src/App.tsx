import { useState, useEffect } from 'react';
import { type Note } from './core/notes';
import { generateScale, type Scale, type ScaleType } from './core/scales';
import { detectChord, type ChordResult } from './core/chords';
import { Fretboard } from './components/Fretboard';
import { Piano } from './components/Piano';

function App() {
  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [detectedChord, setDetectedChord] = useState<ChordResult | null>(null);
  const [targetScale, setTargetScale] = useState<Scale | undefined>();
  const [scaleFamily, setScaleFamily] = useState<'Diatonic' | 'Pentatonic'>('Diatonic');
  const [selectedScaleType, setSelectedScaleType] = useState<ScaleType>('Major');

  // Logic: Chord Detection & Scale Mapping
  useEffect(() => {
    if (activeNotes.length > 0) {
      // 1. Detect Chord
      const chord = detectChord(activeNotes);
      setDetectedChord(chord);

      // 2. Map Scale
      // Logic: If chord found, use its root. Else use first active note.
      const root = chord ? chord.root : activeNotes[0].name;

      // Auto-suggest scale based on simple heuristic or user selection
      // For now, respect user's selected Type but lock Root to the Chord.
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



  const DIATONIC_SCALES: ScaleType[] = [
    'Major', 'Minor', 'Harmonic Minor', 'Melodic Minor',
    'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'
  ];

  const PENTATONIC_SCALES: ScaleType[] = [
    'Major Pentatonic', 'Minor Pentatonic'
  ];

  const AVAILABLE_SCALES = scaleFamily === 'Diatonic' ? DIATONIC_SCALES : PENTATONIC_SCALES;

  // Handle family switch to ensure valid scale type
  const handleFamilyChange = (family: 'Diatonic' | 'Pentatonic') => {
    setScaleFamily(family);
    if (family === 'Diatonic') {
      setSelectedScaleType('Major');
    } else {
      setSelectedScaleType('Major Pentatonic');
    }
  };

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
              {detectedChord ? detectedChord.name : 'Play Chords...'}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>Scale Family</label>
              <div style={{ display: 'flex', background: '#222', borderRadius: '4px', border: '1px solid #444' }}>
                <button
                  onClick={() => handleFamilyChange('Diatonic')}
                  style={{
                    padding: '5px 10px',
                    background: scaleFamily === 'Diatonic' ? '#444' : 'transparent',
                    color: scaleFamily === 'Diatonic' ? '#fff' : '#888',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '3px 0 0 3px',
                    fontSize: '0.8rem'
                  }}
                >
                  Diatonic
                </button>
                <button
                  onClick={() => handleFamilyChange('Pentatonic')}
                  style={{
                    padding: '5px 10px',
                    background: scaleFamily === 'Pentatonic' ? '#444' : 'transparent',
                    color: scaleFamily === 'Pentatonic' ? '#fff' : '#888',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '0 3px 3px 0',
                    fontSize: '0.8rem'
                  }}
                >
                  Pentatonic
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>Magic Scale</label>
              <select
                value={selectedScaleType}
                onChange={(e) => setSelectedScaleType(e.target.value as ScaleType)}
                style={{ padding: '5px 10px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444', height: '100%' }}
              >
                {AVAILABLE_SCALES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>MANUAL MODE</p>
          <p style={{ margin: 0, color: '#444', fontSize: '0.7rem' }}>Select notes on Piano to map scales</p>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', paddingBottom: '140px' }}>

        {/* Fretboard (Full Width) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '90%', maxWidth: '1200px' }}>
            <Fretboard
              scale={targetScale}
              activeNotes={activeNotes}
              root={activeNotes.length > 0 ? activeNotes[0] : undefined}
            />
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

