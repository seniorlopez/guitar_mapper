import { BasicPitch, outputToNotesPoly } from '@spotify/basic-pitch';
import { Midi } from '@tonejs/midi';

export async function transcribeAudioToMidi(audioBuffer: AudioBuffer, onProgress: (pct: number) => void): Promise<Midi> {
    const targetSampleRate = 22050;
    const resampledBuffer = await resampleBuffer(audioBuffer, targetSampleRate);

    const basicPitch = new BasicPitch('/model/model.json');

    const framesPerSecond = targetSampleRate / 512; // 512 is default hop size

    // Run Inference
    const noteEventsFrames = await new Promise<any[]>((resolve, reject) => {
        basicPitch.evaluateModel(
            resampledBuffer,
            (frames, onsets) => {
                // Thresholds: onset=0.5, frame=0.3, minNoteLen=5 frames
                const notes = outputToNotesPoly(frames, onsets, 0.5, 0.3, 5);
                resolve(notes);
            },
            (percent) => {
                onProgress(percent);
            }
        ).catch(e => reject(e));
    });

    const midi = new Midi();
    const track = midi.addTrack();

    // Convert Frames to Seconds
    noteEventsFrames.forEach(n => {
        // BasicPitch returns { startFrame, durationFrames, pitchMidi, amplitude }
        const startTime = n.startFrame / framesPerSecond;
        const duration = n.durationFrames / framesPerSecond;

        track.addNote({
            midi: n.pitchMidi,
            time: startTime,
            duration: duration,
            velocity: n.amplitude
        });
    });

    midi.name = "Audio Transcription";
    return midi;
}

async function resampleBuffer(buffer: AudioBuffer, targetRate: number): Promise<AudioBuffer> {
    if (buffer.sampleRate === targetRate) return buffer;
    const duration = buffer.duration;
    const offlineCtx = new OfflineAudioContext(1, duration * targetRate, targetRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();
    return await offlineCtx.startRendering();
}
