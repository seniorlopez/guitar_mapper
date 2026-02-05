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
        onScaleSelect(scaleType);
    };

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
        return null;
    };

    const compatibleScales = getCompatibleScales(quality);
    const shouldShow = (s: ScaleType) => compatibleScales ? compatibleScales.includes(s) : true;

    return (
        <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
        }}>
            <h3 className="label-sm" style={{ margin: 0 }}>Chord Builder</h3>

            {/* Root Selector */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <select
                    value={root}
                    onChange={(e) => setRoot(e.target.value as NoteName)}
                    className="select-control"
                    style={{ flex: 1 }}
                >
                    {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                {/* Quality Selector */}
                <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value)}
                    className="select-control"
                    style={{ flex: 2 }}
                >
                    {qualities.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
            </div>

            {/* Scale Context Selector */}
            <div className="input-group">
                <label className="label-sm">Target Scale context</label>
                <select
                    value={scaleType}
                    onChange={(e) => setScaleType(e.target.value as ScaleType)}
                    className="select-control"
                    style={{ width: '100%' }}
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
