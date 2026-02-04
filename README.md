# Guitar Mapper 🎸

**Guitar Mapper** is an interactive web application designed for guitarists and musicians to visualize scales, chords, and musical patterns on the fretboard. It bridges the gap between music theory and the instrument, helping users "map" their knowledge directly onto the guitar neck.

## Features ✨

-   **Interactive Fretboard**: Visualizes notes, intervals, and scale patterns across the entire neck.
-   **Smart Chord Detection**: Select notes on the piano interface, and the app identifies the chord name automatically.
-   **Magic Scale System**:
    -   Automatically suggests scales that fit your selected notes or chord.
    -   **Scale Families**: Toggle between **Diatonic** (Major, Minor, Modes) and **Pentatonic** (Major, Minor) scales.
-   **Piano Interface**: A clickable piano keyboard to manually input notes and explore relationships.
-   **Manual Mode**: Build your own chord voicings and see how they translate to scale shapes.

## Getting Started 🚀

### Prerequisites

-   **Node.js**: Ensure you have Node.js installed (v18+ recommended).

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/seniorlopez/guitar_mapper.git
    cd guitar_mapper
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open your browser at `http://localhost:5173`.

## Usages 🎮

1.  **Find a Chord**: Click notes on the piano at the bottom. The app will name the chord (e.g., "C Major 7").
2.  **Map a Scale**:
    -   Once notes are active, use the **Magic Scale** dropdown to select a scale.
    -   The fretboard will light up with the notes of that scale relative to the root.
3.  **Switch Scale Types**:
    -   Use the **Scale Family** toggle in the header.
    -   Select **Pentatonic** to focus on 5-note scales perfect for soloing.
    -   Select **Diatonic** for full 7-note scales and modes (Ionian, Dorian, etc.).

## Tech Stack 🛠️

-   **Frontend**: React (v19)
-   **Language**: TypeScript
-   **Build Tool**: Vite
-   **Styling**: CSS Modules / Inline Styles

---

Built with ❤️ by [Senior Lopez](https://github.com/seniorlopez)

## Changerlog 📜

### [Current Session] - 2026-02-04
- **Modes**: Split application into **Manual Mode** (Piano Input) and **Auto Mode** (Chord Builder).
- **Reactive Fretboard**: The fretboard now resizes dynamically and supports adjustable fret counts (12-24) and zoom levels.
- **Smart Analysis (Manual Mode)**: Automatically detects chords from 3-4 notes input on the piano and estimates the **Parent Key** to display the correct scale.
- **Smart Logic (Auto Mode)**:
- **Intelligent Scale Mapping**: Added logic to map Major Chords + Minor Pentatonic selections to the **Relative Minor** scale (e.g., C Maj7 -> A Minor Pentatonic).
- **Compatibility Filtering**: The Scale dropdown now filters options based on the selected Chord Quality.
