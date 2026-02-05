import React from 'react';
import { type Note, getNoteFromMidi, type NoteName } from '../core/notes';

interface PianoProps {
    activeNotes: Note[];
    onToggleNote: (note: Note) => void;
    startMidi?: number;
    endMidi?: number;
}

export const Piano: React.FC<PianoProps> = ({
    activeNotes,
    onToggleNote,
    startMidi = 40,
    endMidi = 88
}) => {
    const keys = [];
    for (let m = startMidi; m <= endMidi; m++) {
        keys.push(getNoteFromMidi(m));
    }

    const isBlack = (name: NoteName) => name.includes('#');

    return (
        <div style={{
            display: 'flex',
            position: 'relative',
            height: '100%',
            background: 'var(--bg-panel)',
            padding: '0 20px',
            alignItems: 'flex-start'
        }}>
            {keys.map((note) => {
                const black = isBlack(note.name);
                const isActive = activeNotes.some(n => n.midi === note.midi);

                if (black) {
                    return (
                        <div
                            key={note.midi}
                            onClick={() => onToggleNote(note)}
                            className="piano-key black"
                            style={{
                                width: '28px',
                                height: '60%',
                                background: isActive ? 'var(--primary)' : '#1e1e1e',
                                color: isActive ? '#fff' : 'transparent',
                                border: '1px solid #000',
                                borderTop: 'none',
                                borderRadius: '0 0 4px 4px',
                                marginLeft: '-14px',
                                marginRight: '-14px',
                                zIndex: 10,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                                position: 'relative'
                            }}
                        >
                            {isActive && <span style={{ fontSize: '9px', marginBottom: '4px', fontWeight: 'bold' }}>{note.name}</span>}
                        </div>
                    );
                } else {
                    return (
                        <div
                            key={note.midi}
                            onClick={() => onToggleNote(note)}
                            className="piano-key white"
                            style={{
                                width: '42px',
                                height: '100%',
                                background: isActive ? 'rgba(6, 182, 212, 0.2)' : '#e2e8f0', // Slight hint of primary when active, else slate-200
                                color: isActive ? 'var(--primary)' : '#333',
                                border: '1px solid #94a3b8',
                                borderTop: 'none',
                                borderRadius: '0 0 6px 6px',
                                zIndex: 1,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                paddingBottom: '8px',
                                boxShadow: isActive ? 'inset 0 0 10px var(--primary)' : 'inset 0 -5px 10px rgba(0,0,0,0.1)'
                            }}
                        >
                            {isActive ? note.name : ''}
                        </div>
                    );
                }
            })}
        </div>
    );
};
