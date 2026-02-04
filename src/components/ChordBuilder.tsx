import React, { useState, useEffect } from 'react';
import { type Note, NOTES, type NoteName } from '../core/notes';
import { CHORD_SHAPES, getChordNotes } from '../core/chords';
import { type ScaleType } from '../core/scales';

interface ChordBuilderProps {
    onChordBuilt: (notes: Note[], root: NoteName, quality: string) => void;
    onScaleSelect: (scaleType: ScaleType) => void;
}

export const ChordBuilder: React.FC<ChordBuilderProps> = ({ onChordBuilt, onScaleSelect }) => {
    const [root, setRoot] = useState<NoteName>('C');
    const [quality, setQuality] = useState<string>('Major');
    const [scaleType, setScaleType] = useState<ScaleType>('Major');

    const qualities = Object.keys(CHORD_SHAPES);

    const handleBuild = () => {
        const notes = getChordNotes(root, quality, 3); // Default to middle octave
        onChordBuilt(notes, root, quality);

        // Auto-select a corresponding scale type if implied?
        // Logic: specific mapping from Chord Quality -> Scale Type
        // let impliedScale: ScaleType = 'Major';
        // if (quality.includes('Minor') || quality === 'm7' || quality === 'min7') impliedScale = 'Minor';
        // if (quality === 'Dom7') impliedScale = 'Mixolydian';
        // if (quality === 'Maj7') impliedScale = 'Major'; // Ionian
        // if (quality === 'm7b5') impliedScale = 'Locrian';

        // But respect the user's explicit scale choice if we want.
        // The prompt says "Si lo escoges, te pone la escala correspondiente que elijas del drop down".
        // This implies the dropdown *controls* the scale mapping.
        // So we should just trigger the callback with the currently selected ScaleType from the dropdown.
        onScaleSelect(scaleType);
    };

    // Auto-build when changes happen? Or explicit button?
    // "quedo bien perrisimo"... "Si lo escoges, te pone..." -> Immediate reaction is best for "feeling premium".
    useEffect(() => {
        handleBuild();
    }, [root, quality, scaleType]);

    // Filter scales based on quality compatibility
    const getCompatibleScales = (currentQuality: string) => {
        const majorScales: ScaleType[] = ['Major', 'Lydian', 'Mixolydian', 'Major Pentatonic'];
        const minorScales: ScaleType[] = ['Minor', 'Dorian', 'Phrygian', 'Aeolian', 'Harmonic Minor', 'Melodic Minor', 'Minor Pentatonic'];
        const domScales: ScaleType[] = ['Mixolydian', 'Major', 'Major Pentatonic']; // Dom7 implies Major 3rd
        const dimScales: ScaleType[] = ['Locrian', 'Harmonic Minor']; // Diminished contexts

        if (currentQuality === 'Major' || currentQuality === 'Maj7' || currentQuality === 'Maj9' || currentQuality === '6' || currentQuality === 'add9') {
            return majorScales;
        }
        if (currentQuality === 'Minor' || currentQuality === 'min7' || currentQuality === 'm6' || currentQuality === 'min9' || currentQuality === 'm(add9)') {
            return minorScales;
        }
        if (currentQuality === 'Dom7' || currentQuality === '9') {
            return domScales;
        }
        if (currentQuality === 'm7b5' || currentQuality === 'Dim') {
            return dimScales;
        }

        // Default show all if unsure
        return null;
    };

    const compatibleScales = getCompatibleScales(quality);

    // Helper to check if a specific scale should be shown
    const shouldShow = (s: ScaleType) => compatibleScales ? compatibleScales.includes(s) : true;

    return (
        <div style={{
            background: '#1a1a1a',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '240px'
        }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#888', textTransform: 'uppercase' }}>Chord Builder</h3>

            {/* Root Selector */}
            <div style={{ display: 'flex', gap: '5px' }}>
                <select
                    value={root}
                    onChange={(e) => setRoot(e.target.value as NoteName)}
                    style={{ flex: 1, padding: '5px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                >
                    {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                {/* Quality Selector */}
                <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    style={{ flex: 2, padding: '5px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                >
                    {qualities.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
            </div>

            {/* Scale Context Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '0.7rem', color: '#666' }}>Target Scale context</label>
                <select
                    value={scaleType}
                    onChange={(e) => setScaleType(e.target.value as ScaleType)}
                    style={{ width: '100%', padding: '5px', background: '#222', color: '#fff', border: '1px solid #444', borderRadius: '4px' }}
                >
                    <optgroup label="Diatonic">
                        {shouldShow('Major') && <option value="Major">Major (Ionian)</option>}
                        {shouldShow('Minor') && <option value="Minor">Minor (Aeolian)</option>}
                        {shouldShow('Dorian') && <option value="Dorian">Dorian</option>}
                        {shouldShow('Phrygian') && <option value="Phrygian">Phrygian</option>}
                        {shouldShow('Lydian') && <option value="Lydian">Lydian</option>}
                        {shouldShow('Mixolydian') && <option value="Mixolydian">Mixolydian</option>}
                        {shouldShow('Locrian') && <option value="Locrian">Locrian</option>}
                        {shouldShow('Harmonic Minor') && <option value="Harmonic Minor">Harmonic Minor</option>}
                        {shouldShow('Melodic Minor') && <option value="Melodic Minor">Melodic Minor</option>}
                    </optgroup>
                    <optgroup label="Pentatonic">
                        {shouldShow('Major Pentatonic') && <option value="Major Pentatonic">Major Pentatonic</option>}
                        {shouldShow('Minor Pentatonic') && <option value="Minor Pentatonic">Minor Pentatonic</option>}
                    </optgroup>
                </select>
            </div>
        </div>
    );
};
