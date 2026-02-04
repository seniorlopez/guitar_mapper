import { type NoteName, transpose } from './notes';
import { type ChordResult } from './chords';

/**
 * Estimates the likely Parent Major Key for a given chord.
 * Used for "Smart Manual Mode".
 * 
 * Logic:
 * Major -> I (Root)
 * Minor -> vi (Relative Minor of Parent Major)
 * Dim -> vii (Leading Tone of Parent Major)
 * Dom7 -> V (Dominant of Parent Major)
 * m7b5 -> vii (Leading Tone of Parent Major? Or ii of Minor?) -> Let's map to Major Parent of locrian? Ionian + 1
 * 
 * NOTE: This maps to the IONIAN (Major) scale that "contains" this chord functioning as a specific degree.
 * The prompt example: "si aparece B disminuido, en ionian seria la escala de Do Mayor".
 * B dim is vii of C Major. So B -> transpose -1 -> C.
 */
export function estimateParentKey(chord: ChordResult): NoteName {
    const { root, quality } = chord;

    // Helper map for Quality -> Semitone Offset from Parent Major Root
    // e.g. Minor is typically the 'vi', which is +9 semitones from Root (or -3).
    // So if we have A Minor, Parent is C Major (A - 9 = C).

    // We need to REVERSE the interval to find the parent.
    // I (Major) -> offset 0
    // ii (Minor) -> offset 2. Parent = root - 2.
    // iii (Minor) -> offset 4. Parent = root - 4.
    // IV (Major) -> offset 5. Parent = root - 5.
    // V (Major/Dom) -> offset 7. Parent = root - 7.
    // vi (Minor) -> offset 9. Parent = root - 9.
    // vii (Dim) -> offset 11. Parent = root - 11.

    // Ambiguity: A Minor could be ii (of G), iii (of F), or vi (of C).
    // Standard convention for "most likely":
    // Minor -> Assume vi (Relative Minor).
    // Major -> Assume I (Tonic).
    // Dom7 -> Assume V (Dominant).
    // Dim -> Assume vii (Leading Tone).
    // m7b5 -> Assume vii of Major? Or ii of Minor?
    // Let's stick to the prompt examples.

    switch (quality) {
        case 'Major':
        case 'Maj7':
        case 'Maj9':
        case '6':
        case 'add9':
            // Assume Tonic (I)
            return root;

        case 'Minor':
        case 'min7':
        case 'm6':
        case 'min9':
        case 'm(add9)':
            // Assume Relative Minor (vi).
            // Parent is +3 semitones (or -9).
            // e.g. A Minor -> C Major.
            return transpose(root, 3);

        case 'Dom7':
        case '9':
        case '7b9':
        case '7#9':
            // Assume Dominant (V).
            // Parent is +5 semitones (or -7).
            // e.g. G Dom7 -> C Major.
            return transpose(root, 5); // G(7) + 5 = C(0)

        case 'Dim':
        case 'Dim7': // Dim7 is often vii of Harmonic Minor, but let's map to Major parent approximation?
            // Prompt: "B disminuido ... seria la escala de Do Mayor" -> vii degree.
            // Parent is +1 semitone.
            // e.g. B Dim -> C Major.
            return transpose(root, 1);

        case 'm7b5':
            // Half-diminished. Often vii in Major keys, or ii in Minor keys.
            // As vii in Major: Bm7b5 is in C Major.
            // Parent is +1 semitone.
            return transpose(root, 1);

        case 'Aug':
            // Aug often V+ or I+. Let's assume V? Or I? 
            // C Aug often resolving to F. (V of F).
            // Let's assume I for now.
            return root;

        case 'Sus2':
        case 'Sus4':
            // often V or I. Treat as I.
            return root;

        default:
            return root;
    }
}
