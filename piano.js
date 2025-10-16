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
// Piano Keyboard Component - 88 keys (A0 to C8)
class PianoKeyboard {
    constructor(containerId) {
        this.containerId = containerId;
        this.selectedNotes = [];
        this.availableNotes = [];
        this.scaleNotes = [];
        this.instrumentColor = '#667eea';
        this.onNoteClick = null;
        this.lastClicked = null;
        this.WHITE_W = 40;
        this.BLACK_W = 26;
        this.GAP = 1.5;
    }

    isBlack(noteName) {
        return noteName.includes("#");
    }
    
    setSelected(el, state) {
        el.dataset.selected = state ? "true" : "false";
    }
    
    toggleKey(el) {
        this.setSelected(el, el.dataset.selected !== "true");
    }

    render(availableNotes, scaleNotes, instrumentColor, onNoteClick) {
        this.availableNotes = availableNotes.map(n => n.midiNote);
        this.scaleNotes = scaleNotes;
        this.instrumentColor = instrumentColor;
        this.onNoteClick = onNoteClick;
        
        // Set CSS variable for selection color
        document.documentElement.style.setProperty('--selected-color', instrumentColor);
        
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error('Container not found:', this.containerId);
            return;
        }
        
        container.innerHTML = '';
        
        // Generate all notes
        const notes = [];
        notes.push({ name: "A0" }, { name: "A#0" }, { name: "B0" });
        for (let o = 1; o <= 7; o++) {
            ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]
                .forEach(n => notes.push({ name: `${n}${o}` }));
        }
        notes.push({ name: "C8" });
        
        // Create piano structure
        const pianoWrapper = document.createElement('div');
        pianoWrapper.className = 'piano-wrapper';
        
        const piano = document.createElement('div');
        piano.className = 'piano';
        piano.id = `piano-${this.containerId}`;
        
        const whiteLayer = document.createElement('div');
        whiteLayer.className = 'white-layer';
        
        const blackLayer = document.createElement('div');
        blackLayer.className = 'black-layer';
        
        let whiteCount = 0;
        
        notes.forEach((n, i) => {
            const key = document.createElement('div');
            const noteName = n.name.replace('#', '#'); // Ensure consistent naming
            const octave = parseInt(noteName.slice(-1));
            const note = noteName.slice(0, -1);
            const midi = this.getMidiNote(note, octave);
            const isAvailable = this.availableNotes.includes(midi);
            const isInScale = this.isNoteInScale(note);
            
            const blackClass = this.isBlack(noteName) ? "black" : "white";
            const availClass = isAvailable ? "available" : "disabled";
            const scaleClass = isInScale ? "in-scale" : "";
            
            key.className = `key ${blackClass} ${availClass} ${scaleClass}`.trim();
            key.dataset.note = noteName;
            key.dataset.noteBase = note;
            key.dataset.octave = octave;
            key.dataset.index = i;
            key.dataset.midi = midi;
            key.dataset.selected = "false";
            
            if (!this.isBlack(noteName)) {
                const lbl = document.createElement("div");
                lbl.className = "label";
                if (noteName.startsWith("C") || noteName === "A0" || noteName === "C8") {
                    lbl.textContent = noteName;
                }
                key.appendChild(lbl);
            }
            
            if (isAvailable) {
                key.addEventListener("click", (e) => {
                    const idx = parseInt(key.dataset.index);
                    if (e.shiftKey && this.lastClicked !== null) {
                        const [a, b] = [this.lastClicked, idx].sort((x, y) => x - y);
                        for (let j = a; j <= b; j++) {
                            const el = piano.querySelector(`.key[data-index='${j}']`);
                            if (el && el.classList.contains('available')) {
                                this.setSelected(el, true);
                                this.addToSelection(el.dataset.noteBase, parseInt(el.dataset.octave));
                            }
                        }
                    } else {
                        this.toggleKeySelection(key, note, octave);
                    }
                    this.lastClicked = idx;
                    
                    // Play note
                    if (this.onNoteClick) {
                        this.onNoteClick({ note, octave, midi });
                    }
                });
                
                key.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    this.setSelected(key, false);
                    this.removeFromSelection(note, octave);
                });
            }
            
            if (this.isBlack(noteName)) {
                key.style.left = (whiteCount * (this.WHITE_W + this.GAP) - this.BLACK_W / 2) + 'px';
                blackLayer.appendChild(key);
            } else {
                whiteLayer.appendChild(key);
                whiteCount++;
            }
        });
        
        piano.appendChild(whiteLayer);
        piano.appendChild(blackLayer);
        pianoWrapper.appendChild(piano);
        container.appendChild(pianoWrapper);
        
        // Set explicit heights to prevent clipping
        const rootStyles = getComputedStyle(document.documentElement);
        const whiteH = parseFloat(rootStyles.getPropertyValue('--white-height')) || 180;
        piano.style.height = whiteH + 'px';
        blackLayer.style.height = whiteH + 'px';
        
        // Apply responsive scaling
        setTimeout(() => this.applyScale(), 100);
    }
    
    toggleKeySelection(keyEl, note, octave) {
        const currently = keyEl.dataset.selected === 'true';
        this.setSelected(keyEl, !currently);
        
        if (!currently) {
            this.addToSelection(note, octave);
        } else {
            this.removeFromSelection(note, octave);
        }
    }
    
    addToSelection(note, octave) {
        if (!this.selectedNotes.find(n => n.note === note && n.octave === octave)) {
            this.selectedNotes.push({ note, octave });
        }
    }
    
    removeFromSelection(note, octave) {
        const index = this.selectedNotes.findIndex(n => n.note === note && n.octave === octave);
        if (index >= 0) {
            this.selectedNotes.splice(index, 1);
        }
    }
    
    isNoteInScale(note) {
        return this.scaleNotes.some(scaleNote => {
            if (scaleNote === note) return true;
            const enharmonics = {
                'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
                'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#',
                'A#': 'Bb', 'Bb': 'A#'
            };
            return enharmonics[scaleNote] === note || enharmonics[note] === scaleNote;
        });
    }

    getMidiNote(note, octave) {
        const noteMap = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        return (octave + 1) * 12 + noteMap[note];
    }
    
    applyScale() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        const piano = container.querySelector('.piano');
        if (!piano) return;
        
        const totalWhite = container.querySelectorAll('.key.white').length;
        const totalWidth = totalWhite * (this.WHITE_W + this.GAP);
        const wrap = container.querySelector('.piano-wrapper');
        if (!wrap) return;
        
        const scale = Math.max(0.8, Math.min(1, (wrap.clientWidth - 30) / totalWidth));
        piano.style.transformOrigin = 'top left';
        piano.style.transform = `scale(${scale})`;
        
        // Ensure black layer height is correct after scaling
        const rootStyles = getComputedStyle(document.documentElement);
        const whiteH = parseFloat(rootStyles.getPropertyValue('--white-height')) || 180;
        const blackLayer = container.querySelector('.black-layer');
        if (blackLayer) {
            blackLayer.style.height = whiteH + 'px';
        }
    }
    
    getSelectedNotes() {
        return this.selectedNotes;
    }
    
    clearSelection() {
        this.selectedNotes = [];
        const container = document.getElementById(this.containerId);
        if (container) {
            container.querySelectorAll('.key[data-selected="true"]').forEach(key => {
                key.dataset.selected = 'false';
            });
        }
    }
    
    preSelectNotes(notes) {
        this.selectedNotes = [...notes];
        
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        // Mark keys as selected
        notes.forEach(note => {
            const keyEl = container.querySelector(`[data-note-base="${note.note}"][data-octave="${note.octave}"]`);
            if (keyEl && keyEl.classList.contains('available')) {
                keyEl.dataset.selected = 'true';
            }
        });
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.PianoKeyboard = PianoKeyboard;
}