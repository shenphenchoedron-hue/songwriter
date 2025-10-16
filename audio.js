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
// Audio Engine for playing chords with soundfont-player and acoustic guitar
class AudioEngine {
    constructor() {
        this.isPlaying = false;
        this.currentSequence = null;
        this.instruments = {}; // Store multiple instruments
        this.audioContext = null;
        this.drumSamples = null; // Tone.js Players for drum samples
        this.drumSamplesLoaded = false;
        this.chordVolume = 0.8; // Default chord volume (0.0 to 1.0)
        this.init();
    }

    async init() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Firefox requires audio context to be resumed after creation
            if (this.audioContext.state === 'suspended') {
                console.log('Audio context suspended (Firefox), will resume on user interaction');
            }

            // Load acoustic guitar soundfont as default
            console.log('Loading default acoustic guitar soundfont...');
            await this.loadInstrument('acoustic_guitar_steel');
            console.log('Acoustic guitar loaded successfully!');
            
            // Auto-load built-in drum samples
            await this.autoLoadBuiltInDrumSamples();
        } catch (e) {
            console.error('Error initializing audio:', e);
        }
    }
    
    // Auto-load drum samples from built-in samples folder
    async autoLoadBuiltInDrumSamples() {
        try {
            console.log('Auto-loading built-in drum samples...');
            
            // Check if Tone is available
            if (typeof Tone === 'undefined') {
                console.error('Tone.js library not loaded');
                return false;
            }
            
            // Start Tone.js audio context (required for Firefox)
            await Tone.start();
            console.log('Tone.js audio context started');
            
            // Initialize drumSamples as an object of Players
            this.drumSamples = {};
            
            // Define built-in sample mapping
            const sampleFiles = {
                'Kick': 'samples/kick.mp3',
                'Snare': 'samples/snare.wav',
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
            };
            
            // Load each sample
            for (const [drumName, path] of Object.entries(sampleFiles)) {
                try {
                    const player = new Tone.Player(path).toDestination();
                    await player.load(path);
                    this.drumSamples[drumName] = player;
                    console.log(`Auto-loaded ${drumName} from ${path}`);
                } catch (e) {
                    console.warn(`Could not auto-load ${drumName}:`, e);
                }
            }
            
            this.drumSamplesLoaded = true;
            console.log(`Auto-loaded ${Object.keys(this.drumSamples).length} drum samples!`);
            return true;
            
        } catch (e) {
            console.error('Error auto-loading drum samples:', e);
            return false;
        }
    }
    
    // Load drum samples from user-selected files
    async loadDrumSamplesFromFiles() {
        return new Promise((resolve) => {
            // Create file input for multiple files
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = 'audio/*,.mp3,.wav';
            
            input.onchange = async (e) => {
                const files = Array.from(e.target.files);
                
                if (files.length === 0) {
                    resolve(false);
                    return;
                }
                
                try {
                    console.log(`Loading ${files.length} drum sample files...`);
                    
                    // Check if Tone is available
                    if (typeof Tone === 'undefined') {
                        console.error('Tone.js library not loaded');
                        resolve(false);
                        return;
                    }
                    
                    // Start Tone.js audio context (required for Firefox)
                    await Tone.start();
                    console.log('Tone.js audio context started');
                    
                    // Initialize drumSamples as an object of Players
                    this.drumSamples = {};
                    
                    // Get drum map to know what samples we expect
                    const drumset = window.INSTRUMENTS?.drumset;
                    const drumNames = drumset ? Object.keys(drumset.drumMap) : [];
                    
                    // Load each file
                    for (const file of files) {
                        const fileName = file.name.toLowerCase();
                        
                        // Match file to drum name
                        let drumName = null;
                        if (fileName.includes('kick')) drumName = 'Kick';
                        else if (fileName.includes('snarerim')) drumName = 'Snare Rim';
                        else if (fileName.includes('snare')) drumName = 'Snare';
                        else if (fileName.includes('hihatopen') || fileName.includes('hh-open')) drumName = 'HiHat Open';
                        else if (fileName.includes('hihat') || fileName.includes('hh')) drumName = 'HiHat';
                        else if (fileName.includes('tom1')) drumName = 'Tom 1';
                        else if (fileName.includes('tom2')) drumName = 'Tom 2';
                        else if (fileName.includes('floor') || fileName.includes('floortom')) drumName = 'Floor Tom';
                        else if (fileName.includes('crash')) drumName = 'Crash';
                        else if (fileName.includes('ride')) drumName = 'Ride';
                        else if (fileName.includes('cowbell')) drumName = 'Cowbell';
                        else if (fileName.includes('clap') || fileName.includes('klap')) drumName = 'Clap';
                        
                        if (drumName) {
                            // Create object URL for the file
                            const url = URL.createObjectURL(file);
                            
                            // Create a Tone.Player for this sample
                            const player = new Tone.Player(url).toDestination();
                            await player.load(url);
                            
                            this.drumSamples[drumName] = player;
                            console.log(`Loaded ${drumName} from ${file.name}`);
                        }
                    }
                    
                    this.drumSamplesLoaded = true;
                    console.log(`Successfully loaded ${Object.keys(this.drumSamples).length} drum samples!`);
                    resolve(true);
                    
                } catch (e) {
                    console.error('Error loading drum samples:', e);
                    resolve(false);
                }
            };
            
            // Trigger file picker
            input.click();
        });
    }
    
    // Play a drum sample
    async playDrumSample(drumName, delaySeconds = 0, volume = 0.7) {
        if (!this.drumSamplesLoaded || !this.drumSamples) {
            console.warn('Drum samples not loaded. Please load samples first.');
            return;
        }
        
        try {
            // Ensure Tone is started (important for Firefox)
            if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                await Tone.start();
            }
            
            const originalPlayer = this.drumSamples[drumName];
            if (!originalPlayer) {
                console.warn(`Drum sample "${drumName}" not found`);
                return;
            }
            
            // Create a new player instance for each hit to allow overlapping sounds
            const player = new Tone.Player({
                url: originalPlayer.buffer,
                volume: Tone.gainToDb(volume)
            }).toDestination();
            
            // Use relative timing with "+delay" notation
            if (delaySeconds > 0) {
                player.start(`+${delaySeconds}`);
            } else {
                player.start();
            }
            
            // Clean up player after it's done playing
            setTimeout(() => {
                player.dispose();
            }, (delaySeconds + player.buffer.duration + 1) * 1000);
        } catch (e) {
            console.error(`Error playing drum sample "${drumName}":`, e);
        }
    }
    
    async loadInstrument(instrumentDef) {
        // Handle both string and object definitions
        const instrumentName = typeof instrumentDef === 'string' ? instrumentDef : instrumentDef.name || 'acoustic_grand_piano';
        
        if (this.instruments[instrumentName]) {
            return this.instruments[instrumentName];
        }
        
        try {
            console.log(`Loading instrument: ${instrumentName}...`);
            if (typeof Soundfont !== 'undefined') {
                this.instruments[instrumentName] = await Soundfont.instrument(this.audioContext, instrumentName);
                console.log(`${instrumentName} loaded!`);
                return this.instruments[instrumentName];
            } else {
                console.error('Soundfont library not loaded');
            }
        } catch (e) {
            console.error(`Error loading instrument ${instrumentName}:`, e);
        }
    }
    
    async getInstrument(instrumentName) {
        if (!this.instruments[instrumentName]) {
            await this.loadInstrument(instrumentName);
        }
        return this.instruments[instrumentName];
    }

    // Note frequencies - now returns MIDI note numbers for soundfont
    getMidiNote(note, octave = 4) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1,
            'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4,
            'F': 5, 'F#': 6, 'Gb': 6,
            'G': 7, 'G#': 8, 'Ab': 8,
            'A': 9, 'A#': 10, 'Bb': 10,
            'B': 11
        };

        if (!noteMap.hasOwnProperty(note)) {
            console.error('Unknown note:', note);
            return 60; // Return middle C as fallback
        }

        // MIDI note number calculation: octave * 12 + note
        const midiNote = (octave + 1) * 12 + noteMap[note];
        return midiNote;
    }

    // Parse chord name into MIDI notes
    parseChordToMidi(chordName) {
        // Extract root note
        let root = chordName[0];
        let index = 1;
        
        if (chordName[1] === '#' || chordName[1] === 'b') {
            root += chordName[1];
            index = 2;
        }

        const modifier = chordName.substring(index);
        
        // Define intervals for different chord types (in semitones)
        const intervals = {
            '': [0, 4, 7],              // Major
            'm': [0, 3, 7],             // Minor
            'dim': [0, 3, 6],           // Diminished
            'aug': [0, 4, 8],           // Augmented
            '7': [0, 4, 7, 10],         // Dominant 7th
            'maj7': [0, 4, 7, 11],      // Major 7th
            'm7': [0, 3, 7, 10],        // Minor 7th
            'dim7': [0, 3, 6, 9],       // Diminished 7th
            '9': [0, 4, 7, 10, 14],     // Dominant 9th
            'maj9': [0, 4, 7, 11, 14],  // Major 9th
            'm9': [0, 3, 7, 10, 14],    // Minor 9th
            '11': [0, 4, 7, 10, 14, 17], // 11th
            '13': [0, 4, 7, 10, 14, 17, 21], // 13th
            'sus2': [0, 2, 7],          // Suspended 2nd
            'sus4': [0, 5, 7]           // Suspended 4th
        };

        const chordIntervals = intervals[modifier] || intervals[''];
        const rootMidi = this.getMidiNote(root, 3); // Start at octave 3 for guitar range
        
        // Return array of MIDI note numbers
        return chordIntervals.map(interval => rootMidi + interval);
    }

    // Set chord volume (0.0 to 1.0)
    setChordVolume(volume) {
        this.chordVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        console.log(`Chord volume set to ${Math.round(this.chordVolume * 100)}%`);
    }

    // Get current chord volume
    getChordVolume() {
        return this.chordVolume;
    }

    // Ensure audio context is running (required for Firefox)
    async ensureAudioContextRunning() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            console.log('Resuming audio context for Firefox...');
            await this.audioContext.resume();
        }

        // Also ensure Tone.js context is running
        if (typeof Tone !== 'undefined' && Tone.context.state === 'suspended') {
            console.log('Starting Tone.js context for Firefox...');
            await Tone.start();
        }
    }

    // Play a single chord with strumming effect
    async playChord(chordName, duration = 1.5, instrumentName = 'acoustic_guitar_steel') {
        // Skip if volume is muted (0)
        if (this.chordVolume <= 0) {
            return;
        }

        // Ensure audio context is running for Firefox
        await this.ensureAudioContextRunning();

        const instrument = await this.getInstrument(instrumentName);
        if (!instrument) {
            console.warn('Instrument not loaded yet');
            return;
        }

        const midiNotes = this.parseChordToMidi(chordName);
        const strumDelay = 0.04; // 40ms between strings for strumming effect
        const now = this.audioContext.currentTime;

        // Play each note with increasing delay for strum effect
        midiNotes.forEach((midiNote, index) => {
            const startTime = now + (index * strumDelay);
            instrument.play(midiNote, startTime, {
                duration: duration,
                gain: this.chordVolume
            });
        });
    }
    
    // Play a single note for melody (supports both melodic instruments and drums)
    async playNote(midiNote, startTime, duration, instrumentDef, volume = 0.7, drumName = null) {
        // Skip if volume is muted (0)
        if (volume <= 0) {
            return;
        }

        // Ensure audio context is running for Firefox
        await this.ensureAudioContextRunning();

        // Check if this is a drum sample
        if (drumName) {
            await this.playDrumSample(drumName, startTime, volume);
            return;
        }

        // Use soundfont-player for melodic instruments
        const instrumentName = typeof instrumentDef === 'string' ? instrumentDef : 'acoustic_grand_piano';
        const instrument = await this.getInstrument(instrumentName);

        if (!instrument) {
            console.warn(`Instrument ${instrumentName} not loaded yet`);
            return;
        }

        console.log(`Playing note: MIDI ${midiNote}, instrument ${instrumentName}, duration ${duration}, volume ${volume}`);

        instrument.play(midiNote, startTime, {
            duration: duration,
            gain: volume
        });
    }
    
    // Alias for backwards compatibility
    async playNoteWithVolume(midiNote, startTime, duration, instrumentName, volume) {
        return this.playNote(midiNote, startTime, duration, instrumentName, volume);
    }

    // Play a sequence of chords and melodies
    async playSequence(chords, melodyNotes = [], bpm = 120, onComplete = null, onProgress = null) {
        if (this.isPlaying) {
            this.stopSequence();
        }

        // Ensure audio contexts are running (important for Firefox)
        await this.ensureAudioContextRunning();

        // Ensure Tone is started (important for Firefox)
        if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Tone.js started for playback');
        }

        this.isPlaying = true;
        
        // Calculate beat duration based on BPM
        const beatDuration = 60 / bpm;
        const strumDelay = 0.04; // 40ms between strings for chords
        
        let currentTime = this.audioContext.currentTime;
        let maxTime = currentTime;
        const startTime = this.audioContext.currentTime;

        // Calculate total beats for progress tracking
        let totalBeats = 0;
        chords.forEach(chord => {
            totalBeats += (chord.duration || 1.0);
        });

        // Play chords
        chords.forEach((chord) => {
            if (!this.isPlaying) return;

            const duration = chord.duration || 1.0;
            const actualDuration = duration * beatDuration;
            
            // Only play if it's not a rest (empty bar)
            if (chord.name && !chord.isRest) {
                this.playChordAtTime(chord.name, currentTime, actualDuration, strumDelay);
            }
            // Always advance time, even for rests
            currentTime += actualDuration;
        });
        
        maxTime = Math.max(maxTime, currentTime);
        
        // Play melody notes (new grid-based format, includes drums)
        if (melodyNotes && melodyNotes.length > 0) {
            melodyNotes.forEach(note => {
                if (!this.isPlaying) return;
                
                const noteDuration = note.duration * beatDuration;
                const volume = note.volume !== undefined ? note.volume : 0.7;
                
                // Check if this is a drum note - use relative timing
                if (note.drumName) {
                    const drumDelay = note.beat * beatDuration;
                    this.playNote(null, drumDelay, noteDuration * 0.95, note.instrument, volume, note.drumName);
                    maxTime = Math.max(maxTime, startTime + drumDelay + noteDuration);
                } else {
                    const noteStartTime = startTime + (note.beat * beatDuration);
                    this.playNote(note.midiNote, noteStartTime, noteDuration * 0.95, note.instrument, volume);
                    maxTime = Math.max(maxTime, noteStartTime + noteDuration);
                }
            });
        }

        // Setup progress tracking animation
        if (onProgress && typeof onProgress === 'function') {
            const updateProgress = () => {
                if (!this.isPlaying) return;
                
                const elapsed = this.audioContext.currentTime - startTime;
                const currentBeat = elapsed / beatDuration;
                onProgress(currentBeat);
                
                // Continue updating
                if (this.isPlaying) {
                    requestAnimationFrame(updateProgress);
                }
            };
            requestAnimationFrame(updateProgress);
        }

        // Reset playing state after sequence
        const totalDuration = (maxTime - this.audioContext.currentTime) * 1000;
        this.currentSequence = setTimeout(() => {
            this.isPlaying = false;
            this.currentSequence = null;
            
            // Call the completion callback if provided
            if (onComplete && typeof onComplete === 'function') {
                onComplete();
            }
        }, totalDuration);
    }
    
    async playChordAtTime(chordName, startTime, duration, strumDelay) {
        // Skip if volume is muted (0)
        if (this.chordVolume <= 0) {
            return;
        }

        const instrument = await this.getInstrument('acoustic_guitar_steel');
        if (!instrument) return;
        
        const midiNotes = this.parseChordToMidi(chordName);
        
        midiNotes.forEach((midiNote, stringIndex) => {
            const noteStartTime = startTime + (stringIndex * strumDelay);
            instrument.play(midiNote, noteStartTime, {
                duration: duration * 0.95,
                gain: this.chordVolume
            });
        });
    }

    // Stop current sequence
    stopSequence() {
        console.log('Stopping sequence...');
        this.isPlaying = false;
        
        // Clear the timeout
        if (this.currentSequence) {
            clearTimeout(this.currentSequence);
            this.currentSequence = null;
        }
        
        // Stop all soundfont instruments
        Object.values(this.instruments).forEach(instrument => {
            if (instrument && instrument.stop) {
                try {
                    instrument.stop();
                } catch (e) {
                    console.warn('Could not stop instrument:', e);
                }
            }
        });
        
        // Stop Tone.js transport and cancel all scheduled events
        if (typeof Tone !== 'undefined') {
            try {
                Tone.Transport.stop();
                Tone.Transport.cancel();
            } catch (e) {
                console.warn('Could not stop Tone.js:', e);
            }
        }
        
        console.log('Sequence stopped');
    }
}

// Firefox-specific user interaction handler
document.addEventListener('click', async function initAudioContext() {
    // Remove this listener after first use
    document.removeEventListener('click', initAudioContext);

    // Ensure audio context is running after first user interaction
    if (window.AudioEngine) {
        await window.AudioEngine.ensureAudioContextRunning();
        console.log('Audio context initialized after user interaction');
    }
}, { once: true });

// Create global instance
window.AudioEngine = new AudioEngine();