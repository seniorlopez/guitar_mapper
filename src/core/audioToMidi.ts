import { BasicPitch, outputToNotesPoly } from '@spotify/basic-pitch';
import { Midi } from '@tonejs/midi';

export async function transcribeAudioToMidi(audioBuffer: AudioBuffer, onProgress: (pct: number) => void): Promise<Midi> {
    const targetSampleRate = 22050;

    console.log(`[AudioToMidi] Input: ${audioBuffer.duration}s @ ${audioBuffer.sampleRate}Hz`);

    // 0. Normalize Audio (Crucial for ML models)
    const normalizedBuffer = normalizeBuffer(audioBuffer);

    // 1. Resample
    let resampledBuffer: AudioBuffer;
    try {
        resampledBuffer = await resampleBuffer(normalizedBuffer, targetSampleRate);
    } catch (e) {
        throw new Error(`Resampling failed: ${e}`);
    }

    console.log(`[AudioToMidi] Resampled: ${resampledBuffer.duration}s @ ${resampledBuffer.sampleRate}Hz`);

    // Use CDN to ensure model availability (Avoid local server issues)
    const modelUrl = 'https://unpkg.com/@spotify/basic-pitch@1.0.1/model/model.json';
    const basicPitch = new BasicPitch(modelUrl);

    // Basic uses FFT_HOP = 512 by default in Python, but 256 often in JS?
    // Let's assume standard 512 for now. If notes are 2x fast, we switch.
    const fftHop = 512;
    const framesPerSecond = targetSampleRate / fftHop;

    console.log(`[AudioToMidi] Inference Start. FPS: ${framesPerSecond}`);

    const noteEventsFrames = await new Promise<any[]>((resolve, reject) => {
        basicPitch.evaluateModel(
            resampledBuffer,
            (frames, onsets) => {
                // Lowering thresholds slightly to be more generous
                // onset=0.3 (was 0.5), frame=0.2 (was 0.3)
                const notes = outputToNotesPoly(frames, onsets, 0.25, 0.2, 5); // very sensitive
                resolve(notes);
            },
            (percent) => {
                onProgress(percent);
            }
        ).catch(e => reject(new Error(`Model Error: ${e}`)));
    });

    console.log(`[AudioToMidi] Inference Done. Found ${noteEventsFrames.length} events.`);

    const midi = new Midi();
    const track = midi.addTrack();

    console.log(`[AudioToMidi] Detected ${noteEventsFrames.length} notes.`);

    noteEventsFrames.forEach(n => {
        const startTime = n.startFrame / framesPerSecond;
        const duration = n.durationFrames / framesPerSecond;

        // Safety: Ignore weird notes
        if (duration <= 0) return;

        track.addNote({
            midi: n.pitchMidi,
            time: startTime,
            duration: duration,
            velocity: n.amplitude
        });
    });

    // Explicitly set name and ensure duration is correct?
    // Tonejs Midi calculates duration dynamically from tracks.
    midi.name = "Audio Transcription";

    if (noteEventsFrames.length === 0) {
        console.warn("Zero notes detected. The model might not have loaded or audio is silent.");
        // Add a dummy note to prove it parsed? No, throw.
        throw new Error("No notes detected by AI model.");
    }

    return midi;
}

function normalizeBuffer(buffer: AudioBuffer): AudioBuffer {
    const data = buffer.getChannelData(0); // Assume mono or just take left
    let max = 0;
    for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > max) max = abs;
    }
    if (max === 0) return buffer;

    // Create new buffer
    const ctx = new OfflineAudioContext(1, buffer.length, buffer.sampleRate);
    const newBuf = ctx.createBuffer(1, buffer.length, buffer.sampleRate);
    const newData = newBuf.getChannelData(0);

    const scale = 0.95 / max; // Normalize to 0.95
    for (let i = 0; i < data.length; i++) {
        newData[i] = data[i] * scale;
    }
    return newBuf;
}

async function resampleBuffer(buffer: AudioBuffer, targetRate: number): Promise<AudioBuffer> {
    if (buffer.sampleRate === targetRate) return buffer;

    // OfflineAudioContext needs a valid length calculation
    const ratio = buffer.sampleRate / targetRate;
    const newLength = Math.ceil(buffer.length / ratio);

    // BasicPitch works best with Mono.
    const offlineCtx = new OfflineAudioContext(1, newLength, targetRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start();

    return await offlineCtx.startRendering();
}
