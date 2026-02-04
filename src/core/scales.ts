import { type NoteName, transpose } from './notes';

export type ScaleType =
    | 'Major'
    | 'Minor'
    | 'Harmonic Minor'
    | 'Melodic Minor'
    | 'Ionian' | 'Dorian' | 'Phrygian' | 'Lydian' | 'Mixolydian' | 'Aeolian' | 'Locrian'
    | 'Major Pentatonic' | 'Minor Pentatonic';

export interface Scale {
    root: NoteName;
    type: ScaleType;
    notes: NoteName[];
}

const SCALE_INTERVALS: Record<ScaleType, number[]> = {
    'Major': [0, 2, 4, 5, 7, 9, 11],
    'Minor': [0, 2, 3, 5, 7, 8, 10], // Natural Minor / Aeolian
    'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
    'Melodic Minor': [0, 2, 3, 5, 7, 9, 11], // Ascending typically
    'Ionian': [0, 2, 4, 5, 7, 9, 11], // Same as Major
    'Dorian': [0, 2, 3, 5, 7, 9, 10],
    'Phrygian': [0, 1, 3, 5, 7, 8, 10],
    'Lydian': [0, 2, 4, 6, 7, 9, 11],
    'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
    'Aeolian': [0, 2, 3, 5, 7, 8, 10], // Same as Minor
    'Locrian': [0, 1, 3, 5, 6, 8, 10],
    'Major Pentatonic': [0, 2, 4, 7, 9],
    'Minor Pentatonic': [0, 3, 5, 7, 10],
};

export function generateScale(root: NoteName, type: ScaleType): Scale {
    const intervals = SCALE_INTERVALS[type];
    const notes = intervals.map(interval => transpose(root, interval));
    return { root, type, notes };
}
