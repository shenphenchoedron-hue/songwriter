/*
 * Songwriter - Open Source Song Composition Tool
 * Copyright (C) 2025  Lone Hansen
 *
 * This file is part of Songwriter.
 * Songwriter is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Songwriter is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Songwriter.  If not, see <https://www.gnu.org/licenses/>.
 */
// Instrument definitions with ranges and soundfont mappings
const INSTRUMENTS = {
    acoustic_bass: {
        name: 'Acoustic Bass',
        displayName: 'Double Bass',
        soundfont: 'acoustic_bass',
        range: {
            min: { note: 'C', octave: 1 },  // C1
            max: { note: 'G', octave: 4 }   // G4
        },
        color: '#8B4513'
    },
    electric_bass: {
        name: 'Electric Bass',
        displayName: 'Electric Bass 5',
        soundfont: 'electric_bass_finger',
        range: {
            min: { note: 'B', octave: 0 },  // B0
            max: { note: 'G', octave: 4 }   // G4
        },
        color: '#FF6B35'
    },
    synth_bass: {
        name: 'Synth Bass',
        displayName: 'Synth Bass',
        soundfont: 'synth_bass_1',
        range: {
            min: { note: 'C', octave: 0 },  // C0
            max: { note: 'G', octave: 4 }   // G4
        },
        color: '#4ECDC4'
    },
    acoustic_guitar: {
        name: 'Acoustic Guitar',
        displayName: 'Acoustic Guitar',
        soundfont: 'acoustic_guitar_steel',
        range: {
            min: { note: 'E', octave: 2 },  // E2
            max: { note: 'E', octave: 6 }   // E6
        },
        color: '#3498db'
    },
    electric_guitar_clean: {
        name: 'Electric Guitar (Clean)',
        displayName: 'E-Guitar Clean',
        soundfont: 'electric_guitar_clean',
        range: {
            min: { note: 'E', octave: 2 },
            max: { note: 'E', octave: 6 }
        },
        color: '#F38181'
    },
    piano: {
        name: 'Piano',
        displayName: 'Acoustic Piano',
        soundfont: 'acoustic_grand_piano',
        range: {
            min: { note: 'A', octave: 0 },
            max: { note: 'C', octave: 8 }
        },
        color: '#AA96DA'
    },
    flute: {
        name: 'Flute',
        displayName: 'Flute',
        soundfont: 'flute',
        range: {
            min: { note: 'C', octave: 4 },
            max: { note: 'C', octave: 7 }
        },
        color: '#FCBAD3'
    },
    violin: {
        name: 'Violin',
        displayName: 'Violin',
        soundfont: 'violin',
        range: {
            min: { note: 'G', octave: 3 },
            max: { note: 'E', octave: 7 }
        },
        color: '#D4A017'
    },
    drumset: {
        name: 'Drumset',
        displayName: 'Drum Set',
        soundfont: null, // Will use Tone.js samples instead
        type: 'drums',
        drumMap: {
            'Kick': 'samples/kick.mp3',
            'Snare': 'samples/snare.mp3',
            'Snare Rim': 'samples/snarerim.wav',
            'HiHat': 'samples/hh.mp3',
            'HiHat Open': 'samples/hihatopen.wav',
            'Tom 1': 'samples/tom1.wav',
            'Tom 2': 'samples/tom2.wav',
            'Floor Tom': 'samples/floortom.wav',
            'Crash': 'samples/jazz-crash.wav',
            'Ride': 'samples/jazz-ride.wav',
            'Cowbell': 'samples/cowbell.wav',
            'Clap': 'samples/klap.wav'
        },
        range: {
            min: { note: 'C', octave: 0 },
            max: { note: 'C', octave: 1 }
        },
        color: '#28a745' // Green color for drumset
    }
};

// Helper function to get MIDI note number
function getMidiNoteNumber(note, octave) {
    const noteMap = {
        'C': 0, 'C#': 1, 'Db': 1,
        'D': 2, 'D#': 3, 'Eb': 3,
        'E': 4,
        'F': 5, 'F#': 6, 'Gb': 6,
        'G': 7, 'G#': 8, 'Ab': 8,
        'A': 9, 'A#': 10, 'Bb': 10,
        'B': 11
    };
    
    return (octave + 1) * 12 + noteMap[note];
}

// Get available notes for an instrument within scale
function getInstrumentNotes(instrumentKey, scaleNotes, key) {
    const instrument = INSTRUMENTS[instrumentKey];
    if (!instrument) return [];
    
    const minMidi = getMidiNoteNumber(instrument.range.min.note, instrument.range.min.octave);
    const maxMidi = getMidiNoteNumber(instrument.range.max.note, instrument.range.max.octave);
    
    const availableNotes = [];
    
    // Determine if we should use sharps or flats based on key
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
    const useFlats = flatKeys.includes(key) || key.includes('b');
    
    // Go through all octaves within range
    for (let octave = instrument.range.min.octave; octave <= instrument.range.max.octave; octave++) {
        scaleNotes.forEach(scalNote => {
            const midiNote = getMidiNoteNumber(scalNote, octave);
            
            if (midiNote >= minMidi && midiNote <= maxMidi) {
                // Convert to proper notation (sharp vs flat) based on key
                let displayNote = scalNote;
                if (useFlats) {
                    const sharpToFlat = {
                        'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'
                    };
                    displayNote = sharpToFlat[scalNote] || scalNote;
                } else {
                    const flatToSharp = {
                        'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#'
                    };
                    displayNote = flatToSharp[scalNote] || scalNote;
                }
                
                availableNotes.push({
                    note: displayNote,
                    octave: octave,
                    midiNote: midiNote,
                    displayName: `${displayNote}${octave}`
                });
            }
        });
    }
    
    // Sort by MIDI note (highest first for display)
    return availableNotes.sort((a, b) => b.midiNote - a.midiNote);
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.INSTRUMENTS = INSTRUMENTS;
    window.getInstrumentNotes = getInstrumentNotes;
    window.getMidiNoteNumber = getMidiNoteNumber;
}