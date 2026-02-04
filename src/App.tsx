import { useState, useEffect } from 'react';
import { type Note, transpose, type NoteName } from './core/notes';
import { generateScale, type Scale, type ScaleType } from './core/scales';
import { detectChord, type ChordResult } from './core/chords';
import { estimateParentKey } from './core/analyzer';
import { Fretboard } from './components/Fretboard';
import { Piano } from './components/Piano';
import { ChordBuilder } from './components/ChordBuilder';

type AppMode = 'MANUAL' | 'AUTO';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('AUTO');

  const [activeNotes, setActiveNotes] = useState<Note[]>([]);
  const [detectedChord, setDetectedChord] = useState<ChordResult | null>(null);
  const [targetScale, setTargetScale] = useState<Scale | undefined>();

  // Manual Mode Scale Selection
  const [manualScaleType, setManualScaleType] = useState<ScaleType>('Major');
  const [manualRoot, setManualRoot] = useState<NoteName>('C');

  // Auto Mode (Builder) State
  const [selectedScaleType, setSelectedScaleType] = useState<ScaleType>('Major');

  const [fretCount, setFretCount] = useState<number>(24);
  const [zoom, setZoom] = useState<number>(100);

  // Track builder state to make smart decisions
  const [builderRoot, setBuilderRoot] = useState<NoteName | null>(null);
  const [builderQuality, setBuilderQuality] = useState<string | null>(null);

  // --- LOGIC ---

  // 1. Detect Chord (Runs always when activeNotes change)
  useEffect(() => {
    if (activeNotes.length > 0) {
      const chord = detectChord(activeNotes);
      setDetectedChord(chord);
    } else {
      setDetectedChord(null);
    }
  }, [activeNotes]);

  // 2. SMART MANUAL MODE ANALYZER
  useEffect(() => {
    if (appMode !== 'MANUAL') return;

    // Logic:
    // 0 notes: existing scale persistence? or clear? Let's persist.
    // 1-2 notes: Use Manual Selection (Root + ScaleType).
    // 3-4 notes: Analyze Chord -> Estimate Key -> Use that Key (Ionian/Major).
    // 5+ notes: Error (Clear Scale or Show Error).

    const noteCount = activeNotes.length;

    if (noteCount === 0) {
      // Fallback to manual selection
      setTargetScale(generateScale(manualRoot, manualScaleType));
    }
    else if (noteCount <= 2) {
      // Use Manual Selection
      setTargetScale(generateScale(manualRoot, manualScaleType));
    }
    else if (noteCount >= 3 && noteCount <= 4) {
      // SMART ANALYSIS
      const chord = detectChord(activeNotes);
      if (chord) {
        const estimatedParentRoot = estimateParentKey(chord);

        let scaleRoot = estimatedParentRoot;

        // If the user wants a MINOR flavor, we should probably give them the Relative Minor of the detected Parent Major.
        // Check if manualScaleType is minor-ish?
        const isMinorFlavor = manualScaleType.includes('Minor') || manualScaleType === 'Locrian' || manualScaleType === 'Dorian' || manualScaleType === 'Phrygian';

        if (isMinorFlavor) {
          // Map back to relative minor root?
          // Major Parent (C) -> Relative Minor (A).
          scaleRoot = transpose(estimatedParentRoot, -3);
        }

        setTargetScale(generateScale(scaleRoot, manualScaleType));
      } else {
        // 3-4 notes but no chord detected? Fallback to manual.
        setTargetScale(generateScale(manualRoot, manualScaleType));
      }
    }
    else {
      // 5+ Notes
      // "marcar que no se puede con mas de cuatro"
      console.warn("Too many notes for analysis");
      setTargetScale(undefined);
    }

  }, [activeNotes, appMode, manualRoot, manualScaleType]);


  // 3. AUTO MODE LOGIC
  // Helper to handle builder updates
  const handleBuilderUpdate = (notes: Note[], root: NoteName, quality: string) => {
    setActiveNotes(notes);
    setBuilderRoot(root);
    setBuilderQuality(quality);

    // Calculate scale immediately based on builder selection + selectedScaleType
    const smartRoot = getAutoModeSmartRoot(root, quality, selectedScaleType);
    setTargetScale(generateScale(smartRoot, selectedScaleType));
  };

  const handleAutoScaleSelect = (type: ScaleType) => {
    setSelectedScaleType(type);
    if (builderRoot && builderQuality) {
      const smartRoot = getAutoModeSmartRoot(builderRoot, builderQuality, type);
      setTargetScale(generateScale(smartRoot, type));
    }
  };

  const getAutoModeSmartRoot = (root: NoteName, quality: string, scaleType: ScaleType): NoteName => {
    // Keep existing logic: Major Chord + Minor Pent -> Relative Minor
    const isMajorQuality = quality === 'Major' || quality === 'Maj7' || quality === 'Dom7' || quality === 'Aug' || quality === 'Sus2' || quality === 'Sus4' || quality === '6' || quality === 'Maj9' || quality === '9' || quality === 'add9';

    if (scaleType === 'Minor Pentatonic' && isMajorQuality) {
      return transpose(root, -3);
    }
    return root;
  };

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

  // const PENTATONIC_SCALES: ScaleType[] = [
  //   'Major Pentatonic', 'Minor Pentatonic'
  // ];

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
            {/* Note Count Warning for Manual Mode */}
            {appMode === 'MANUAL' && activeNotes.length > 4 && (
              <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>TOO MANY NOTES (MAX 4)</span>
            )}
          </div>

          {/* MODE TOGGLE */}
          <div style={{ display: 'flex', background: '#222', borderRadius: '8px', padding: '4px', border: '1px solid #333' }}>
            <button
              onClick={() => setAppMode('MANUAL')}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600,
                background: appMode === 'MANUAL' ? '#444' : 'transparent', color: appMode === 'MANUAL' ? '#fff' : '#666'
              }}
            >
              MANUAL
            </button>
            <button
              onClick={() => setAppMode('AUTO')}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600,
                backgroundColor: appMode === 'AUTO' ? '#2563eb' : 'transparent',
                color: appMode === 'AUTO' ? '#fff' : '#666'
              }}
            >
              AUTO
            </button>
          </div>

          {/* CONTROL WIDGETS */}
          {appMode === 'AUTO' ? (
            <ChordBuilder
              onChordBuilt={handleBuilderUpdate}
              onScaleSelect={handleAutoScaleSelect}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <span style={{ fontSize: '0.7rem', color: '#888', textTransform: 'uppercase' }}>Manual Settings</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {/* Manual Root Selector */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <select
                    value={manualRoot}
                    onChange={(e) => setManualRoot(e.target.value as NoteName)}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                  >
                    {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <select
                    value={manualScaleType}
                    onChange={(e) => setManualScaleType(e.target.value as ScaleType)}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                  >
                    <optgroup label="Common">
                      <option value="Major">Major</option>
                      <option value="Minor">Minor</option>
                    </optgroup>
                    <optgroup label="Pentatonic">
                      <option value="Major Pentatonic">Major Pentatonic</option>
                      <option value="Minor Pentatonic">Minor Pentatonic</option>
                    </optgroup>
                    <optgroup label="Modes">
                      {DIATONIC_SCALES.filter(s => s !== 'Major' && s !== 'Minor').map(t => <option key={t} value={t}>{t}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px' }}>
            {/* View Controls */}
            <div style={{ display: 'flex', gap: '10px', borderLeft: '1px solid #333', paddingLeft: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>Frets</label>
                <select
                  value={fretCount}
                  onChange={(e) => setFretCount(Number(e.target.value))}
                  style={{ padding: '5px 10px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444', height: '100%' }}
                >
                  {[12, 15, 18, 21, 22, 24].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.75rem', color: '#666', textTransform: 'uppercase' }}>Size ({zoom}%)</label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="10"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  style={{ width: '100px', height: '100%', accentColor: '#444' }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>{appMode} MODE</p>
          <p style={{ margin: 0, color: '#444', fontSize: '0.7rem' }}>
            {appMode === 'AUTO' ? 'Select Chord to visualize scale' : 'Play 3-4 notes to detect scale'}
          </p>
        </div>
      </div>

      {/* CENTER STAGE */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', paddingBottom: '140px' }}>

        {/* Fretboard (Full Width) */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
          <div style={{ width: '100%', padding: '0 20px', display: 'flex', justifyContent: 'center' }}>
            <Fretboard
              scale={targetScale}
              activeNotes={activeNotes}
              root={activeNotes.length > 0 ? activeNotes[0] : undefined}
              fretCount={fretCount}
              zoom={zoom / 100}
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
