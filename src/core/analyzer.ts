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

    // Safety: Clamp duration. Some MIDIs report huge duration. Max 10 mins for demo.
    const duration = Math.min(midi.duration, 600);
    if (!duration || duration <= 0) return [];

    const events: ChordEvent[] = [];

    // Sampling rate
    const step = 0.25;
    let lastChordName = '';
    let currentEvent: ChordEvent | null = null;

    // Safety: Protection against infinite loop
    let iterations = 0;
    const MAX_ITER = 10000;

    for (let time = 0; time < duration; time += step) {
        if (iterations++ > MAX_ITER) break; // Emergency brake

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
