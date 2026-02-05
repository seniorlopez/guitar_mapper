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

### [UI Overhaul & Custom Tuning] - 2026-02-05
- **Domotic UI**: Complete visual overhaul with a dark Slate/Cyan theme, glassmorphism headers, and polished components.
- **Design System**: Implemented a robust CSS variable system for consistent styling.
- **Custom Tuning Support**: Added "Custom / Manual" instrument option to adjust individual string pitches.
- **Modes Refactor**: Distinct Manual (Piano Input) and Auto (Chord Builder) modes for better workflow.
- **Smart Analysis**: Enhanced logic for parent key estimation and scale mapping.

