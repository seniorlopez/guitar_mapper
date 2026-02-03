import { type Note, getNoteFromMidi } from './notes';

// Standard Tuning Basic MIDI numbers
// E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
export const STRING_OPEN_MIDI = [40, 45, 50, 55, 59, 64];

export interface FretboardPosition {
    string: number;
    fret: number;
    note: Note;
}

export function getNoteAt(stringIndex: number, fret: number): Note {
    const openMidi = STRING_OPEN_MIDI[stringIndex];
    return getNoteFromMidi(openMidi + fret);
}

export function generateFretboard(frets: number = 24): FretboardPosition[][] {
    const board: FretboardPosition[][] = [];
    for (let s = 0; s < 6; s++) {
        const stringData: FretboardPosition[] = [];
        for (let f = 0; f <= frets; f++) {
            stringData.push({
                string: s,
                fret: f,
                note: getNoteAt(s, f)
            });
        }
        board.push(stringData);
    }
    return board;
}
