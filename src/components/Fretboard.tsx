import React, { useMemo, useState, useEffect, useRef } from 'react';
import { type Note, getInterval, INTERVALS } from '../core/notes';
import { type Scale } from '../core/scales';
import { generateFretboard, type FretboardPosition } from '../core/guitar';

interface FretboardProps {
    tuning?: number[]; // ADDED
    scale?: Scale;
    activeNotes?: Note[];
    root?: Note;
    fretCount?: number;
    zoom?: number;
}

const BASE_STRING_HEIGHT = 40;

export const Fretboard: React.FC<FretboardProps> = ({
    tuning = [], // Default to empty but we'll handle it
    scale,
    activeNotes = [],
    root,
    fretCount = 24,
    zoom = 1
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1000);

    useEffect(() => {
        if (!containerRef.current) return;
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Calculate dynamic dimensions
    // We reserve some padding (e.g. 60px total)
    // If zoom is 1, we fit exactly.
    const availableWidth = containerWidth - 60;
    const baseFretWidth = availableWidth / fretCount;

    // Apply zoom (clamp minimum width so it doesn't get too small)
    const FRET_WIDTH = Math.max(30, baseFretWidth * zoom);
    const STRING_HEIGHT = BASE_STRING_HEIGHT * Math.max(0.8, zoom); // Scale height slightly less aggressively

    const board = useMemo(() => generateFretboard(tuning, fretCount), [tuning, fretCount]);
    const totalStrings = tuning.length;

    // Safety check if tuning is empty or something weird
    if (totalStrings === 0) return null;

    const getNoteStyle = (pos: FretboardPosition) => {
        // 1. Specific Active Note (High Vis)
        const activeMatch = activeNotes.find(n => n.midi === pos.note.midi);

        // Scale visual elements with zoom
        const scaleFactor = Math.max(0.8, zoom);

        if (activeMatch) {
            let fill = 'var(--primary)'; // Default Cyan
            let label: string = pos.note.name;
            const radius = 14 * scaleFactor;
            const opacity = 1;
            const stroke = '#fff';
            const strokeWidth = 2 * scaleFactor;
            const fontWeight = '800';
            let textColor = '#000';

            if (root) {
                const interval = getInterval(root.name, pos.note.name);
                if (interval === INTERVALS.P1) {
                    fill = 'var(--risk)'; // Red
                    label = 'R';
                    textColor = '#fff';
                }
                else if (interval === INTERVALS.M3 || interval === INTERVALS.m3) { fill = '#3b82f6'; textColor = '#fff'; } // Blue (keep as distinct from main cyan)
                else if (interval === INTERVALS.M7 || interval === INTERVALS.m7 || interval === INTERVALS.m6) { fill = 'var(--success)'; textColor = '#000'; } // Green
                else if (interval === INTERVALS.P5) { fill = 'var(--warning)'; textColor = '#000'; } // Amber
            }
            return { fill, stroke, strokeWidth, radius, label, opacity, fontWeight, textColor };
        }

        // 2. Scale Hint (Ghost)
        if (scale && scale.notes.includes(pos.note.name)) {
            const isRoot = pos.note.name === scale.root;
            const fill = isRoot ? 'var(--primary)' : 'var(--secondary)';
            const opacity = 0.5;
            const radius = 10 * scaleFactor;
            const label = pos.note.name;

            return { fill, stroke: 'none', strokeWidth: 0, radius, label: label as string, opacity, fontWeight: '500', textColor: '#ddd' };
        }

        // Invisible/bg
        return { fill: 'transparent', stroke: 'none', strokeWidth: 0, radius: 0, label: '', opacity: 0, fontWeight: '400', textColor: 'transparent' };
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                overflowX: 'auto',
                padding: '40px 20px',
                background: 'rgba(0,0,0,0.2)', // Subtle darken
                borderRadius: '16px',
                border: '1px solid var(--border-subtle)'
            }}
        >
            <svg width={fretCount * FRET_WIDTH + 60} height={totalStrings * STRING_HEIGHT + 40}>
                {/* Draw Frets */}
                {Array.from({ length: fretCount + 1 }).map((_, i) => (
                    <line
                        key={`fret-${i}`}
                        x1={i * FRET_WIDTH + 30}
                        y1={10}
                        x2={i * FRET_WIDTH + 30}
                        y2={totalStrings * STRING_HEIGHT + 10}
                        stroke="var(--border-subtle)"
                        strokeWidth={i === 0 ? 6 : 2}
                    />
                ))}

                {/* Draw Strings */}
                {board.map((_, i) => (
                    <line
                        key={`string-${i}`}
                        x1={30}
                        y1={i * STRING_HEIGHT + 25}
                        x2={fretCount * FRET_WIDTH + 30}
                        y2={i * STRING_HEIGHT + 25}
                        stroke="#64748b" // Slate 500
                        strokeWidth={1 + (totalStrings - 1 - i) * 0.6}
                    />
                ))}

                {/* Draw Notes */}
                {board.map((stringData) =>
                    stringData.map((pos) => {
                        const visualRow = (totalStrings - 1) - pos.string;
                        const { fill, stroke, strokeWidth, radius, label, opacity, fontWeight, textColor } = getNoteStyle(pos);

                        if (opacity === 0) return null;

                        return (
                            <g key={`note-${pos.string}-${pos.fret}`} style={{ transition: 'all 0.1s ease' }}>
                                <circle
                                    cx={pos.fret * FRET_WIDTH + 30 - (pos.fret === 0 ? 15 : FRET_WIDTH / 2)}
                                    cy={visualRow * STRING_HEIGHT + 25}
                                    r={radius}
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth={strokeWidth}
                                    fillOpacity={opacity}
                                    strokeOpacity={opacity}
                                />
                                <text
                                    x={pos.fret * FRET_WIDTH + 30 - (pos.fret === 0 ? 15 : FRET_WIDTH / 2)}
                                    y={visualRow * STRING_HEIGHT + 25 + (radius / 2.5)}
                                    fill={textColor}
                                    fillOpacity={opacity}
                                    fontSize={radius > 11 ? "12" : "10"}
                                    textAnchor="middle"
                                    pointerEvents="none"
                                    fontFamily="Inter, sans-serif"
                                    fontWeight={fontWeight}
                                >
                                    {label}
                                </text>
                            </g>
                        );
                    })
                )}

                {/* Fret Markers */}
                {[3, 5, 7, 9, 12, 15, 17, 19, 21, 24]
                    .filter(f => f <= fretCount)
                    .map(fret => (
                        <circle
                            key={`marker-${fret}`}
                            cx={fret * FRET_WIDTH + 30 - FRET_WIDTH / 2}
                            cy={totalStrings * STRING_HEIGHT + 30}
                            r={4}
                            fill="var(--text-muted)"
                            opacity={0.5}
                        />
                    ))}
            </svg>
        </div>
    );
};
