import { Midi } from '@tonejs/midi';
import { getNoteFromMidi } from './notes';
import { detectChord } from './chords';

export interface ChordEvent {
    startTime: number;
    endTime: number;
    chordName: string;
}

export function analyzeMidi(midi: Midi): ChordEvent[] {
    // 1. Flatten all notes from all tracks
    const allNotes = midi.tracks.flatMap(t => t.notes).sort((a, b) => a.time - b.time);

    if (allNotes.length === 0) return [];

    const duration = midi.duration;
    const events: ChordEvent[] = [];

    // Sampling rate: analyze every X seconds (e.g. 1/8th note approx or fixed 0.25s)
    // Higher resolution = more noise. Lower = missing fast changes.
    const step = 0.2;
    let lastChordName = '';
    let currentEvent: ChordEvent | null = null;

    for (let time = 0; time < duration; time += step) {
        // Find notes active at this time
        // Note: 'active' means strictly overlapping 'time'.
        const activeNotes = allNotes
            .filter(n => time >= n.time && time < (n.time + n.duration))
            .map(n => getNoteFromMidi(n.midi));

        // Dedup by MIDI number
        const uniqueNotes = activeNotes.filter((v, i, a) => a.findIndex(t => t.midi === v.midi) === i);

        // Detect
        const detection = detectChord(uniqueNotes);
        const chordName = detection ? detection.name : 'N.C.'; // No Chord

        // Logic: Merge continuous identical chords
        if (chordName !== lastChordName) {
            // Change detected!
            // Close previous event
            if (currentEvent) {
                currentEvent.endTime = time;
                events.push(currentEvent);
            }

            // Start new event
            currentEvent = {
                startTime: time,
                endTime: time + step, // tentative
                chordName
            };
            lastChordName = chordName;
        } else {
            // Continue previous
            if (currentEvent) {
                currentEvent.endTime = time + step;
            }
        }
    }

    // Push last
    if (currentEvent) {
        events.push(currentEvent);
    }

    // Filter noise: Remove very short events (< ~0.2s) unless they are the only ones?
    // Let's keep raw for now, user wants "estimation presisa".
    return events.filter(e => e.chordName !== 'N.C.');
}
