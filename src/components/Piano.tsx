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
            height: '100%',  // Fill container
            background: '#151515',
            padding: '0 20px', // Horizontal padding for edge safety
            alignItems: 'flex-start' // Keys hang from top of bar
        }}>
            {keys.map((note) => {
                const black = isBlack(note.name);
                const isActive = activeNotes.some(n => n.midi === note.midi);

                if (black) {
                    return (
                        <div
                            key={note.midi}
                            onClick={() => onToggleNote(note)}
                            style={{
                                width: '28px',
                                height: '65%', // Black keys shorter
                                background: isActive ? '#facc15' : 'black',
                                color: isActive ? 'black' : 'transparent',
                                border: '1px solid #333',
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
                            style={{
                                width: '42px',
                                height: '100%', // Full height
                                background: isActive ? '#60a5fa' : '#e5e5e5', // White keys off-white
                                color: isActive ? 'black' : '#333',
                                border: '1px solid #111', // Darker dividers
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
                                boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.1)'
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
