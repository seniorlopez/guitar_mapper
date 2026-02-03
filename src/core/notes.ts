export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export const NOTES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const NOTE_TO_INDEX: Record<NoteName, number> = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
};

export const INTERVALS = {
    P1: 0,
    m2: 1,
    M2: 2,
    m3: 3,
    M3: 4,
    P4: 5,
    d5: 6,
    P5: 7,
    m6: 8,
    M6: 9,
    m7: 10,
    M7: 11
};

export interface Note {
    name: NoteName;
    octave: number;
    midi: number;
}

export function getNoteFromMidi(midi: number): Note {
    const name = NOTES[midi % 12];
    const octave = Math.floor(midi / 12) - 1; // MIDI 60 = C4
    return { name, octave, midi };
}

export function getInterval(root: NoteName, note: NoteName): number {
    const rootIdx = NOTE_TO_INDEX[root];
    const noteIdx = NOTE_TO_INDEX[note];
    return (noteIdx - rootIdx + 12) % 12;
}

export function transpose(note: NoteName, semitones: number): NoteName {
    const noteIdx = NOTE_TO_INDEX[note];
    const newIdx = (noteIdx + semitones) % 12;
    return NOTES[newIdx];
}
