import { type Note, type NoteName, getInterval, INTERVALS } from './notes';

export interface ChordResult {
    root: NoteName;
    quality: string;
    name: string;
}

// Extended Intervals
const I = INTERVALS;
const b9 = 1;
const _9 = 2; // Same as M2
// const _11 = 5; // Same as P4
// const _13 = 9; // Same as M6
// const b13 = 8; // Same as m6

const CHORD_SHAPES: Record<string, number[]> = {
    // Triads
    'Major': [I.P1, I.M3, I.P5],
    'Minor': [I.P1, I.m3, I.P5],
    'Dim': [I.P1, I.m3, I.d5],
    'Aug': [I.P1, I.M3, I.m6],
    'Sus2': [I.P1, I.M2, I.P5],
    'Sus4': [I.P1, I.P4, I.P5],

    // 7ths
    'Maj7': [I.P1, I.M3, I.P5, I.M7],
    'min7': [I.P1, I.m3, I.P5, I.m7],
    'Dom7': [I.P1, I.M3, I.P5, I.m7],
    'm7b5': [I.P1, I.m3, I.d5, I.m7],
    'Dim7': [I.P1, I.m3, I.d5, 9],

    // Extensions
    'add9': [I.P1, I.M3, I.P5, _9],
    'm(add9)': [I.P1, I.m3, I.P5, _9],
    'Maj9': [I.P1, I.M3, I.P5, I.M7, _9],
    'min9': [I.P1, I.m3, I.P5, I.m7, _9],
    '9': [I.P1, I.M3, I.P5, I.m7, _9], // Dom9
    '7b9': [I.P1, I.M3, I.P5, I.m7, b9],
    '7#9': [I.P1, I.M3, I.P5, I.m7, 3], // #9 = m3 enharmonic? Careful. 3 semitones is m3. #9 is 3 semitones. 
    // But in Dom7#9 (Hendrix), we have M3(4) AND #9(3). 
    // Browser MIDI might not distinguish enharmonics easily without context.

    // 6ths
    '6': [I.P1, I.M3, I.P5, I.M6],
    'm6': [I.P1, I.m3, I.P5, I.M6],
};

export function detectChord(notes: Note[]): ChordResult | null {
    if (notes.length < 3) return null;

    const pitchClasses = Array.from(new Set(notes.map(n => n.name)));

    let bestMatch: ChordResult | null = null;
    let maxNotesMatched = 0;

    // Brute force: Try every note in the set as the Root
    for (const root of pitchClasses) {
        const intervals = pitchClasses.map(n => getInterval(root, n));
        const uniqueIntervals = Array.from(new Set(intervals));

        for (const [quality, requiredIntervals] of Object.entries(CHORD_SHAPES)) {
            // Check if ALL required intervals are present
            const hasAll = requiredIntervals.every(i => uniqueIntervals.includes(i));

            if (hasAll) {
                // Complexity metric: length of required intervals. 
                // We want the most specific chord (e.g. Maj7 > Major)
                if (requiredIntervals.length > maxNotesMatched) {
                    maxNotesMatched = requiredIntervals.length;
                    bestMatch = {
                        root,
                        quality,
                        name: `${root} ${quality}`
                    };
                }
            }
        }
    }

    return bestMatch;
}
