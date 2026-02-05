import { useState, useEffect, useMemo } from 'react';
import { type Note, transpose, type NoteName, getNoteFromMidi } from './core/notes';
import { generateScale, type Scale, type ScaleType } from './core/scales';
import { detectChord, type ChordResult } from './core/chords';
import { estimateParentKey } from './core/analyzer';
import { Fretboard } from './components/Fretboard';
import { type InstrumentType, INSTRUMENT_TUNINGS } from './core/guitar';
import { Piano } from './components/Piano';
import { ChordBuilder } from './components/ChordBuilder';

type AppMode = 'MANUAL' | 'AUTO';

function App() {
  const [appMode, setAppMode] = useState<AppMode>('AUTO');
  const [instrument, setInstrument] = useState<InstrumentType>('GUITAR');
  // Custom Tuning State (initialized to Guitar Standard)
  const [customTuning, setCustomTuning] = useState<number[]>([...INSTRUMENT_TUNINGS['GUITAR']]);

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

  // Check for Scale Mismatch (Manual Mode)
  const isScaleMismatch = useMemo(() => {
    if (appMode !== 'MANUAL' || !targetScale || activeNotes.length === 0) return false;

    const scaleNoteSet = new Set(targetScale.notes);
    // Are there any active notes NOT in the set?
    return activeNotes.some(n => !scaleNoteSet.has(n.name));
  }, [appMode, targetScale, activeNotes]);

  // 2. SMART MANUAL MODE ANALYZER
  useEffect(() => {
    if (appMode !== 'MANUAL') return;

    const noteCount = activeNotes.length;

    if (noteCount === 0 || noteCount <= 2) {
      // Fallback to manual selection
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
      console.warn("Too many notes for analysis");
      setTargetScale(undefined);
    }

  }, [activeNotes, appMode, manualRoot, manualScaleType]);


  // 3. AUTO MODE LOGIC
  const getAutoModeSmartRoot = (root: NoteName, quality: string, scaleType: ScaleType): NoteName => {
    // Keep existing logic: Major Chord + Minor Pent -> Relative Minor
    const isMajorQuality = quality === 'Major' || quality === 'Maj7' || quality === 'Dom7' || quality === 'Aug' || quality === 'Sus2' || quality === 'Sus4' || quality === '6' || quality === 'Maj9' || quality === '9' || quality === 'add9';

    if (scaleType === 'Minor Pentatonic' && isMajorQuality) {
      return transpose(root, -3);
    }
    return root;
  };

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

  // --- RENDER HELPERS ---
  const renderSidebar = () => (
    <div className="panel" style={{
      width: '320px',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px',
      gap: '32px',
      overflowY: 'auto',
      zIndex: 10
    }}>
      {/* BRAND / TITLE */}
      <div className="fade-in">
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Guitar Mapper</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
          <span style={{ height: '6px', width: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }}></span>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Domotic Edition</p>
        </div>
      </div>

      {/* MODE SELECTION */}
      <div className="input-group fade-in" style={{ animationDelay: '0.1s' }}>
        <label className="label-sm">Application Mode</label>
        <div className="card" style={{ padding: '6px', display: 'flex', gap: '4px', background: 'var(--bg-input)', border: 'none' }}>
          <button
            onClick={() => setAppMode('MANUAL')}
            className={`btn ${appMode === 'MANUAL' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
          >
            Manual
          </button>
          <button
            onClick={() => setAppMode('AUTO')}
            className={`btn ${appMode === 'AUTO' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, border: 'none' }}
          >
            Auto
          </button>
        </div>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.75rem', lineHeight: '1.4' }}>
          {appMode === 'AUTO' ? 'Select a chord below to find matching scales.' : 'Play notes to detect scale or select manually.'}
        </p>
      </div>

      {/* INSTRUMENT SETTINGS */}
      <div className="input-group fade-in" style={{ animationDelay: '0.2s' }}>
        <label className="label-sm">Instrument</label>
        <select
          value={instrument}
          onChange={(e) => setInstrument(e.target.value as InstrumentType)}
          className="select-control"
          style={{ width: '100%' }}
        >
          <option value="GUITAR">Guitar (6 Str)</option>
          <option value="BASS_4">Bass (4 Str)</option>
          <option value="BASS_5">Bass (5 Str)</option>
          <option value="CUSTOM">Custom / Manual</option>
        </select>

        {/* CUSTOM TUNING EDITOR */}
        {instrument === 'CUSTOM' && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px', background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Adjust Pitches (Low to High)</span>
            {/* Render from High String (1) to Low String (N) */}
            {customTuning
              .map((pitch, i) => ({ pitch, index: i }))
              .reverse()
              .map(({ pitch, index }) => {
                const note = getNoteFromMidi(pitch);
                const stringNum = customTuning.length - index; // e.g. 6 - 5 = 1 (Top), 6 - 0 = 6 (Bottom)

                return (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '6px 10px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: 600 }}>Str {stringNum}</span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => { const newT = [...customTuning]; newT[index] -= 1; setCustomTuning(newT); }}
                        className="btn-secondary"
                        style={{ padding: '2px 8px', height: '28px', display: 'flex', alignItems: 'center' }}
                      >-</button>

                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--warning)', width: '24px', textAlign: 'center' }}>
                        {note.name}
                      </span>

                      <button
                        onClick={() => { const newT = [...customTuning]; newT[index] += 1; setCustomTuning(newT); }}
                        className="btn-secondary"
                        style={{ padding: '2px 8px', height: '28px', display: 'flex', alignItems: 'center' }}
                      >+</button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* CONTEXTUAL CONTROLS */}
      <div className="input-group fade-in" style={{ animationDelay: '0.3s' }}>
        <label className="label-sm">
          {appMode === 'AUTO' ? 'Chord Analysis' : 'Manual Selection'}
        </label>

        {appMode === 'AUTO' ? (
          <ChordBuilder
            onChordBuilt={handleBuilderUpdate}
            onScaleSelect={handleAutoScaleSelect}
          />
        ) : (
          <div className="card">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <select
                value={manualRoot}
                onChange={(e) => setManualRoot(e.target.value as NoteName)}
                className="select-control"
                style={{ flex: 1 }}
              >
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map(n => <option key={n} value={n}>{n}</option>)}
              </select>

              <select
                value={manualScaleType}
                onChange={(e) => setManualScaleType(e.target.value as ScaleType)}
                className="select-control"
                style={{ flex: 2 }}
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
              Or play 3-4 notes to detect scale.
            </div>
          </div>
        )}
      </div>

      {/* VIEW SETTINGS */}
      <div className="input-group" style={{ marginTop: 'auto' }}>
        <label className="label-sm">Settings</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Frets</label>
            <select
              value={fretCount}
              onChange={(e) => setFretCount(Number(e.target.value))}
              className="select-control"
              style={{ width: '100%', padding: '8px' }}
            >
              {[12, 15, 18, 21, 22, 24].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Zoom {zoom}%</label>
            <input
              type="range"
              min="50"
              max="150"
              step="10"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              style={{ width: '100%', marginTop: '6px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: '100vh', display: 'flex', background: 'var(--bg-main)', color: 'var(--text-main)', overflow: 'hidden' }}>

      {/* LEFT SIDEBAR */}
      {renderSidebar()}

      {/* MAIN CONTENT AREA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>

        {/* MINIMAL HEADER */}
        <div style={{
          height: '80px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 5
        }}>
          <h1 className="glow-text" style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: detectedChord ? '#fff' : 'var(--text-muted)', letterSpacing: '-1px' }}>
            {detectedChord ? detectedChord.name : 'Play Chords...'}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Note Count Warning for Manual Mode */}
            {appMode === 'MANUAL' && activeNotes.length > 4 && (
              <div style={{
                padding: '6px 12px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--risk)',
                border: '1px solid var(--risk)', fontSize: '0.75rem', fontWeight: 700
              }}>
                MAX 4 NOTES
              </div>
            )}

            {isScaleMismatch && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                color: 'var(--warning)', fontSize: '0.9rem', fontWeight: 600,
                background: 'rgba(245, 158, 11, 0.1)', padding: '6px 12px', borderRadius: '6px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <span style={{ fontSize: '1rem' }}>⚠️</span>
                <span>Notes outside scale</span>
              </div>
            )}
          </div>
        </div>

        {/* FRETBOARD AREA */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          paddingBottom: '140px',
          background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
        }}>
          <div style={{ width: '100%', padding: '0 40px', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
            <Fretboard
              tuning={instrument === 'CUSTOM' ? customTuning : INSTRUMENT_TUNINGS[instrument]}
              scale={targetScale}
              activeNotes={activeNotes}
              root={activeNotes.length > 0 ? activeNotes[0] : undefined}
              fretCount={fretCount}
              zoom={zoom / 100}
            />
          </div>
        </div>

        {/* PIANO FOOTER */}
        <div style={{
          height: '140px',
          background: 'var(--bg-panel)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'center',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
          zIndex: 10
        }}>
          <Piano activeNotes={activeNotes} onToggleNote={toggleNote} />
        </div>

      </div>
    </div>
  );
}

export default App;
