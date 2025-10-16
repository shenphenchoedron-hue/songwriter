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
// MIDI Export
class MIDIExporter {
    export(state) {
        const midiData = this.generateMIDI(state);
        this.downloadMIDI(midiData, 'song.mid');
    }

    // Export separate MIDI files for each instrument
    exportSeparateInstruments(state) {
        const instrumentTracks = this.collectInstrumentTracks(state);
        
        if (instrumentTracks.length === 0) {
            alert('Ingen instrumenter fundet. Tilføj melodilinjer først.');
            return;
        }

        // Create and download MIDI file for each instrument
        instrumentTracks.forEach(track => {
            const midiData = this.generateInstrumentMIDI(state, track);
            this.downloadMIDI(midiData, `${track.name}.mid`);
        });

        alert(`Eksporteret ${instrumentTracks.length} MIDI filer (én per instrument).`);
    }

    // Collect all instrument tracks from the song
    collectInstrumentTracks(state) {
        const instrumentMap = new Map();
        const subdivisions = 4;
        const [beatsPerBar] = state.timeSignature.split('/').map(Number);
        const beatsPerLine = state.barsPerLine * beatsPerBar;

        let lineOffset = 0;

        state.lines.forEach((line, lineIndex) => {
            line.melodyLines.forEach(melodyLine => {
                const instrument = INSTRUMENTS[melodyLine.instrument];
                if (!instrument) return;

                const instrumentKey = melodyLine.instrument;
                
                if (!instrumentMap.has(instrumentKey)) {
                    instrumentMap.set(instrumentKey, {
                        key: instrumentKey,
                        name: instrument.displayName || instrument.name,
                        soundfont: instrument.soundfont,
                        isDrumset: instrumentKey === 'drumset',
                        notes: []
                    });
                }

                const track = instrumentMap.get(instrumentKey);

                // Convert grid notes to absolute timing
                melodyLine.notes.forEach(note => {
                    const beatInLine = note.col / subdivisions;
                    const absoluteBeat = lineOffset + beatInLine;
                    const duration = note.span / subdivisions;

                    const noteData = {
                        beat: absoluteBeat,
                        duration: duration,
                        midiNote: note.midiNote || null,
                        drumName: note.drumName || null,
                        pitch: note.pitch
                    };

                    track.notes.push(noteData);
                });
            });

            lineOffset += beatsPerLine;
        });

        return Array.from(instrumentMap.values());
    }

    // Generate MIDI file for a specific instrument track
    generateInstrumentMIDI(state, track) {
        const [beatsPerBar, beatType] = state.timeSignature.split('/').map(Number);
        const ticksPerBeat = 480;
        const tempo = Math.round(500000 / (state.bpm / 120)); // Convert BPM to microseconds per quarter note
        const beatDuration = 60 / state.bpm;

        // Collect all events for this instrument
        const events = [];

        track.notes.forEach(note => {
            const startTick = Math.round(note.beat * ticksPerBeat);
            const durationTicks = Math.round(note.duration * ticksPerBeat);

            // For drums, use General MIDI drum mapping (MIDI channel 10)
            if (track.isDrumset && note.drumName) {
                const drumMidiNote = this.getDrumMidiNote(note.drumName);
                
                events.push({
                    time: startTick,
                    type: 'noteOn',
                    note: drumMidiNote,
                    velocity: 100,
                    channel: 9 // Channel 10 (0-indexed as 9) for drums
                });

                events.push({
                    time: startTick + durationTicks,
                    type: 'noteOff',
                    note: drumMidiNote,
                    velocity: 0,
                    channel: 9
                });
            } else if (note.midiNote) {
                // Regular melodic instrument
                events.push({
                    time: startTick,
                    type: 'noteOn',
                    note: note.midiNote,
                    velocity: 80,
                    channel: 0
                });

                events.push({
                    time: startTick + durationTicks,
                    type: 'noteOff',
                    note: note.midiNote,
                    velocity: 0,
                    channel: 0
                });
            }
        });

        // Sort events by time
        events.sort((a, b) => a.time - b.time);

        // Build MIDI file
        return this.buildMIDIFile(events, ticksPerBeat, tempo);
    }

    // Map drum names to General MIDI drum notes
    getDrumMidiNote(drumName) {
        const drumMap = {
            'Kick': 36,          // Bass Drum 1
            'Snare': 38,         // Acoustic Snare
            'Snare Rim': 37,     // Side Stick
            'HiHat': 42,         // Closed Hi-Hat
            'HiHat Open': 46,    // Open Hi-Hat
            'Tom 1': 50,         // High Tom
            'Tom 2': 47,         // Low-Mid Tom
            'Floor Tom': 43,     // High Floor Tom
            'Crash': 49,         // Crash Cymbal 1
            'Ride': 51,          // Ride Cymbal 1
            'Cowbell': 56,       // Cowbell
            'Clap': 39           // Hand Clap
        };
        return drumMap[drumName] || 38; // Default to snare
    }

    generateMIDI(state) {
        const [beatsPerBar, beatType] = state.timeSignature.split('/').map(Number);
        const ticksPerBeat = 480;
        const tempo = 500000; // 120 BPM (microseconds per quarter note)

        // Collect all events
        const events = [];
        let currentTick = 0;

        state.lines.forEach(line => {
            line.bars.forEach(bar => {
                bar.chords.forEach(chord => {
                    const notes = this.getChordNotes(chord);
                    const duration = Math.round(chord.duration * ticksPerBeat);

                    // Note on events
                    notes.forEach(note => {
                        events.push({
                            time: currentTick,
                            type: 'noteOn',
                            note: note,
                            velocity: 80
                        });
                    });

                    // Note off events
                    notes.forEach(note => {
                        events.push({
                            time: currentTick + duration,
                            type: 'noteOff',
                            note: note,
                            velocity: 0
                        });
                    });

                    currentTick += duration;
                });

                // If bar is empty, advance time
                if (bar.chords.length === 0) {
                    currentTick += beatsPerBar * ticksPerBeat;
                }
            });
        });

        // Sort events by time
        events.sort((a, b) => a.time - b.time);

        // Build MIDI file
        return this.buildMIDIFile(events, ticksPerBeat, tempo);
    }

    getChordNotes(chord) {
        const noteMap = {
            'C': 60, 'C#': 61, 'Db': 61,
            'D': 62, 'D#': 63, 'Eb': 63,
            'E': 64,
            'F': 65, 'F#': 66, 'Gb': 66,
            'G': 67, 'G#': 68, 'Ab': 68,
            'A': 69, 'A#': 70, 'Bb': 70,
            'B': 71
        };

        const root = noteMap[chord.root] || 60;
        const quality = chord.quality;
        const extension = chord.extension;

        // Define intervals for different chord types
        const intervals = this.getChordIntervals(quality, extension);

        return intervals.map(interval => root + interval);
    }

    getChordIntervals(quality, extension) {
        let intervals = [0, 4, 7]; // Default major

        // Base triads
        if (quality === 'm') {
            intervals = [0, 3, 7]; // Minor
        } else if (quality === 'dim') {
            intervals = [0, 3, 6]; // Diminished
        } else if (quality === 'aug') {
            intervals = [0, 4, 8]; // Augmented
        }

        // Extensions
        if (extension === '7') {
            intervals = quality === 'm' ? [0, 3, 7, 10] : [0, 4, 7, 10];
        } else if (extension === 'maj7') {
            intervals = [0, 4, 7, 11];
        } else if (extension === 'm7') {
            intervals = [0, 3, 7, 10];
        } else if (extension === 'dim7') {
            intervals = [0, 3, 6, 9];
        } else if (extension === '9') {
            intervals = quality === 'm' ? [0, 3, 7, 10, 14] : [0, 4, 7, 10, 14];
        } else if (extension === 'maj9') {
            intervals = [0, 4, 7, 11, 14];
        } else if (extension === 'm9') {
            intervals = [0, 3, 7, 10, 14];
        } else if (extension === '11') {
            intervals = [0, 4, 7, 10, 14, 17];
        } else if (extension === '13') {
            intervals = [0, 4, 7, 10, 14, 21];
        } else if (extension === 'sus2') {
            intervals = [0, 2, 7];
        } else if (extension === 'sus4') {
            intervals = [0, 5, 7];
        }

        return intervals;
    }

    buildMIDIFile(events, ticksPerBeat, tempo) {
        // MIDI file structure: Header + Track
        const header = this.createMIDIHeader(1, ticksPerBeat);
        const track = this.createMIDITrack(events, tempo);

        // Combine header and track
        const midiData = new Uint8Array(header.length + track.length);
        midiData.set(header, 0);
        midiData.set(track, header.length);

        return midiData;
    }

    createMIDIHeader(numTracks, ticksPerBeat) {
        const header = new Uint8Array(14);
        const view = new DataView(header.buffer);

        // "MThd" chunk ID
        header[0] = 0x4D; // M
        header[1] = 0x54; // T
        header[2] = 0x68; // h
        header[3] = 0x64; // d

        // Chunk size (6 bytes for header data)
        view.setUint32(4, 6);

        // Format type (1 = multiple tracks, synchronous)
        view.setUint16(8, 1);

        // Number of tracks
        view.setUint16(10, numTracks);

        // Ticks per quarter note
        view.setUint16(12, ticksPerBeat);

        return header;
    }

    createMIDITrack(events, tempo) {
        const trackEvents = [];

        // Set tempo event
        trackEvents.push(...this.createTempoEvent(0, tempo));

        // Add note events
        let lastTime = 0;
        events.forEach(event => {
            const deltaTime = event.time - lastTime;
            const channel = event.channel || 0; // Default to channel 0
            
            if (event.type === 'noteOn') {
                trackEvents.push(...this.createNoteEvent(deltaTime, 0x90 | channel, event.note, event.velocity));
            } else if (event.type === 'noteOff') {
                trackEvents.push(...this.createNoteEvent(deltaTime, 0x80 | channel, event.note, event.velocity));
            }
            
            lastTime = event.time;
        });

        // End of track
        trackEvents.push(...[0x00, 0xFF, 0x2F, 0x00]);

        // Create track chunk
        const trackData = new Uint8Array(8 + trackEvents.length);
        const view = new DataView(trackData.buffer);

        // "MTrk" chunk ID
        trackData[0] = 0x4D; // M
        trackData[1] = 0x54; // T
        trackData[2] = 0x72; // r
        trackData[3] = 0x6B; // k

        // Chunk size
        view.setUint32(4, trackEvents.length);

        // Track events
        trackData.set(trackEvents, 8);

        return trackData;
    }

    createTempoEvent(deltaTime, tempo) {
        return [
            ...this.encodeVariableLength(deltaTime),
            0xFF, // Meta event
            0x51, // Set tempo
            0x03, // Length
            (tempo >> 16) & 0xFF,
            (tempo >> 8) & 0xFF,
            tempo & 0xFF
        ];
    }

    createNoteEvent(deltaTime, status, note, velocity) {
        return [
            ...this.encodeVariableLength(deltaTime),
            status, // Note on/off
            note,
            velocity
        ];
    }

    encodeVariableLength(value) {
        const bytes = [];
        bytes.push(value & 0x7F);
        
        value >>= 7;
        while (value > 0) {
            bytes.unshift((value & 0x7F) | 0x80);
            value >>= 7;
        }
        
        return bytes;
    }

    downloadMIDI(data, filename) {
        const blob = new Blob([data], { type: 'audio/midi' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.MIDIExporter = new MIDIExporter();