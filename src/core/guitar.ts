import { type Note, getNoteFromMidi } from './notes';

// Standard Tuning Basic MIDI numbers
// Guitar: E2=40, A2=45, D3=50, G3=55, B3=59, E4=64
export const GUITAR_TUNING = [40, 45, 50, 55, 59, 64];

// Bass 4: E1=28, A1=33, D2=38, G2=43
export const BASS_4_TUNING = [28, 33, 38, 43];

// Bass 5: B0=23, E1=28, A1=33, D2=38, G2=43
export const BASS_5_TUNING = [23, 28, 33, 38, 43];

export type InstrumentType = 'GUITAR' | 'BASS_4' | 'BASS_5' | 'CUSTOM';

export const INSTRUMENT_TUNINGS: Record<InstrumentType, number[]> = {
    'GUITAR': GUITAR_TUNING,
    'BASS_4': BASS_4_TUNING,
    'BASS_5': BASS_5_TUNING,
    'CUSTOM': GUITAR_TUNING // Default start for custom
};


export interface FretboardPosition {
    string: number;
    fret: number;
    note: Note;
}

export function getNoteAt(openMidi: number, fret: number): Note {
    return getNoteFromMidi(openMidi + fret);
}

export function generateFretboard(tuning: number[], frets: number = 24): FretboardPosition[][] {
    const board: FretboardPosition[][] = [];
    // tuning array: index 0 = lowest string (physically top or bottom depending on view, usually E2 on guitar)
    // We iterate strings from 0 to N
    for (let s = 0; s < tuning.length; s++) {
        const stringData: FretboardPosition[] = [];
        const openMidi = tuning[s];
        for (let f = 0; f <= frets; f++) {
            stringData.push({
                string: s,
                fret: f,
                note: getNoteAt(openMidi, f)
            });
        }
        board.push(stringData);
    }
    return board;
}
