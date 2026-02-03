import fs from 'fs';
import * as MidiLib from '@tonejs/midi';

console.log('MidiLib:', MidiLib);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Midi = (MidiLib as any).Midi || (MidiLib as any).default?.Midi || (MidiLib as any).default;
console.log('Resolved MidiClass:', Midi);



import { analyzeMidi } from '../src/core/analyzer';

// Mock getNoteFromMidi etc if they are not pure? 
// Actually src/core/notes.ts is pure TS.
// src/core/chords.ts is pure TS.
// src/core/analyzer.ts is pure TS.
// So this should work in Node (using ts-node).

const file = '_midi_test_files/guitarman.mid';

try {
    console.log(`Loading ${file}...`);
    const data = fs.readFileSync(file);
    const midi = new Midi(data);

    console.log(`MIDI Loaded. Duration: ${midi.duration}, Tracks: ${midi.tracks.length}`);
    console.log(`Track 0 notes: ${midi.tracks[0].notes.length}`);

    console.log('Running Analysis...');
    const events = analyzeMidi(midi);

    console.log(`Analysis complete. Events found: ${events.length}`);
    if (events.length > 0) {
        console.log('First 5 events:');
        console.log(events.slice(0, 5));
    } else {
        console.error('ERROR: No events generated!');
    }

} catch (e) {
    console.error('CRITICAL FAILURE:', e);
}
