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
// Global state
const state = {
    key: 'C',
    scale: 'major',
    timeSignature: '4/4',
    barsPerLine: 4,
    bpm: 120,
    lines: [],
    currentBar: null,
    currentBeat: null,
    previousChord: null,
    selectedExtension: '',
    selectedDuration: 1,
    pendingEdit: null,
    melodyLineCounter: 0, // Counter for unique melody line IDs
    currentMelodyContext: null,
    selectedMelodyNotes: [],
    pendingMelodyEdit: null
};

// Music theory data
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    melodicMinor: [0, 2, 3, 5, 7, 9, 11],
    pentatonicMajor: [0, 2, 4, 7, 9],
    pentatonicMinor: [0, 3, 5, 7, 10],
    blues: [0, 3, 5, 6, 7, 10],
    wholeTone: [0, 2, 4, 6, 8, 10],
    diminished: [0, 2, 3, 5, 6, 8, 9, 11],
    bebopMajor: [0, 2, 4, 5, 7, 8, 9, 11],
    bebopDominant: [0, 2, 4, 5, 7, 9, 10, 11],
    altered: [0, 1, 3, 4, 6, 8, 10],
    lydianDominant: [0, 2, 4, 6, 7, 9, 10]
};

const CHORD_QUALITIES = {
    major: { I: '', II: 'm', III: 'm', IV: '', V: '', VI: 'm', VII: 'dim' },
    minor: { I: 'm', II: 'dim', III: '', IV: 'm', V: 'm', VI: '', VII: '' },
    dorian: { I: 'm', II: 'm', III: '', IV: '', V: 'm', VI: 'dim', VII: '' },
    phrygian: { I: 'm', II: '', III: '', IV: 'm', V: 'dim', VI: '', VII: 'm' },
    lydian: { I: '', II: '', III: 'm', IV: 'dim', V: '', VI: 'm', VII: 'm' },
    mixolydian: { I: '', II: 'm', III: 'dim', IV: '', V: 'm', VI: 'm', VII: '' },
    locrian: { I: 'dim', II: '', III: 'm', IV: 'm', V: '', VI: '', VII: 'm' },
    harmonicMinor: { I: 'm', II: 'dim', III: 'aug', IV: 'm', V: '', VI: '', VII: 'dim' },
    melodicMinor: { I: 'm', II: 'm', III: 'aug', IV: '', V: '', VI: 'dim', VII: 'dim' },
    bebopMajor: { I: '', II: 'm', III: 'm', IV: '', V: '', VI: 'm', VII: 'dim', VIII: '' },
    bebopDominant: { I: '', II: 'm', III: 'dim', IV: '', V: 'm', VI: 'm', VII: '', VIII: '' },
    diminished: { I: 'dim', II: '', III: 'm', IV: 'dim', V: '', VI: 'm', VII: 'dim', VIII: '' }
};

// Circle of Fifths order (clockwise from C at top)
const CIRCLE_OF_FIFTHS_ORDER = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F'];

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeControls();
    initializeModal();
    addFirstLine();

    // Update instrument legend on startup
    updateInstrumentLegend();
});

function initializeControls() {
    document.getElementById('key-select').addEventListener('change', (e) => {
        state.key = e.target.value;
        updateAllChordDisplay();
    });

    document.getElementById('scale-select').addEventListener('change', (e) => {
        state.scale = e.target.value;
        updateAllChordDisplay();
    });

    document.getElementById('time-signature').addEventListener('change', (e) => {
        state.timeSignature = e.target.value;
        rebuildAllBars();
    });

    document.getElementById('bars-per-line').addEventListener('change', (e) => {
        state.barsPerLine = parseInt(e.target.value);
        rebuildAllBars();
    });

    document.getElementById('bpm-input').addEventListener('change', (e) => {
        state.bpm = parseInt(e.target.value);
    });

    // Chord volume control
    const chordVolumeSlider = document.getElementById('chord-volume');
    const chordVolumeValue = document.getElementById('chord-volume-value');

    if (chordVolumeSlider && chordVolumeValue) {
        chordVolumeSlider.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            const percentage = Math.round(volume * 100);

            // Update display
            chordVolumeValue.textContent = `${percentage}%`;

            // Update audio engine
            if (window.AudioEngine) {
                window.AudioEngine.setChordVolume(volume);
            }
        });
    }

    document.getElementById('add-line-btn').addEventListener('click', addLine);
    document.getElementById('play-all-btn').addEventListener('click', playAll);
    document.getElementById('save-musicxml-btn').addEventListener('click', saveMusicXML);
    document.getElementById('load-musicxml-btn').addEventListener('click', () => {
        document.getElementById('file-input').click();
    });
    document.getElementById('file-input').addEventListener('change', loadMusicXML);
    document.getElementById('export-midi-btn').addEventListener('click', exportMIDI);
    document.getElementById('export-separate-midi-btn').addEventListener('click', exportSeparateMIDI);
    document.getElementById('export-pdf-btn').addEventListener('click', exportPDF);
}

function initializeModal() {
    const modal = document.getElementById('chord-modal');
    const closeBtn = modal.querySelector('.close');
    const insertBtn = document.getElementById('insert-chord-btn');

    closeBtn.addEventListener('click', () => {
        // If editing and user cancels, restore original chord
        if (state.pendingEdit) {
            const { lineId, barIndex, originalChord, originalIndex } = state.pendingEdit;
            const bar = state.lines[lineId]?.bars[barIndex];
            if (bar) {
                bar.chords.splice(originalIndex, 0, originalChord);
                updateBarDisplay(lineId);
            }
            state.pendingEdit = null;
        }
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            // If editing and user cancels by clicking outside, restore original chord
            if (state.pendingEdit) {
                const { lineId, barIndex, originalChord, originalIndex } = state.pendingEdit;
                const bar = state.lines[lineId]?.bars[barIndex];
                if (bar) {
                    bar.chords.splice(originalIndex, 0, originalChord);
                    updateBarDisplay(lineId);
                }
                state.pendingEdit = null;
            }
            modal.classList.remove('active');
        }
    });

    insertBtn.addEventListener('click', insertChord);

    // Extension buttons
    document.querySelectorAll('.ext-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ext-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedExtension = btn.dataset.ext;
            
            // Update the chord display in center of circle
            updateSelectedChordDisplay();
            
            // Play the updated chord
            if (state.selectedChord) {
                playChord(getFullChordName());
            }
        });
    });
}

function addFirstLine() {
    addLine();
}

function addLine() {
    const lineId = state.lines.length;
    const line = {
        id: lineId,
        bars: [],
        melodyLines: [] // Array of melody line objects
    };

    for (let i = 0; i < state.barsPerLine; i++) {
        line.bars.push({
            chords: [],
            lyrics: '',
            repeatStart: false,
            repeatEnd: false
        });
    }

    state.lines.push(line);
    renderLine(line);
}

function renderLine(line) {
    const container = document.getElementById('song-container');
    const lineDiv = document.createElement('div');
    lineDiv.className = 'song-line';
    lineDiv.dataset.lineId = line.id;

    // Generate the HTML content for the line
    lineDiv.innerHTML = getLineHTML(line);

    // Append the new line to the container
    container.appendChild(lineDiv);

    // Attach all necessary event listeners
    attachLineEventListeners(lineDiv, line);

    // Update the visual display for chords
    updateBarDisplay(line.id);
}

function rebuildAllBars() {
    const container = document.getElementById('song-container');
    container.innerHTML = ''; // Clear the container

    state.lines.forEach(line => {
        // Adjust the number of bars for each line based on the new setting
        while (line.bars.length < state.barsPerLine) {
            line.bars.push({
                chords: [],
                lyrics: '',
                repeatStart: false,
                repeatEnd: false
            });
        }
        while (line.bars.length > state.barsPerLine) {
            line.bars.pop();
        }

        // Re-render the line with the updated bar structure
        renderLine(line);
    });
}

function openChordModal(lineId, barIndex, existingChord = null) {
    console.log('Opening modal for line', lineId, 'bar', barIndex);
    state.currentBar = { lineId, barIndex };
    const modal = document.getElementById('chord-modal');
    
    if (!modal) {
        console.error('Modal not found!');
        return;
    }
    
    // Get previous chord for context
    const previousChord = getPreviousChord(lineId, barIndex);
    state.previousChord = previousChord;
    
    // Reset or preload selections
    state.selectedChord = null;
    state.selectedExtension = '';
    document.querySelectorAll('.ext-btn').forEach(b => b.classList.remove('active'));
    
    // Setup duration options
    setupDurationOptions();

    // Draw circle of fifths (will also set initial display)
    try {
        drawCircleOfFifths(previousChord);
    } catch (error) {
        console.error('Error drawing circle:', error);
    }
    
    // If editing an existing chord, preload its values
    if (existingChord) {
        state.selectedChord = {
            root: existingChord.root,
            degree: typeof existingChord.degree === 'number' ? existingChord.degree : -1,
            quality: existingChord.quality || ''
        };
        state.selectedExtension = existingChord.extension || '';
        
        // Activate the corresponding extension button
        const extSelector = `.ext-btn[data-ext="${state.selectedExtension}"]`;
        const extBtn = document.querySelector(extSelector) || document.querySelector('.ext-btn[data-ext=""]');
        if (extBtn) extBtn.classList.add('active');
        
        // Set duration
        const durationSelect = document.getElementById('duration-select');
        if (durationSelect) {
            durationSelect.value = String(existingChord.duration || 1);
            state.selectedDuration = parseFloat(durationSelect.value);
        }
        
        // Update center display with the preloaded chord
        updateSelectedChordDisplay();
    } else {
        // Default to basic extension button active
        const basicBtn = document.querySelector('.ext-btn[data-ext=""]');
        if (basicBtn) basicBtn.classList.add('active');
        
        // Ensure center label is reset
        updateSelectedChordDisplay();
    }
    
    modal.classList.add('active');
}

function setupDurationOptions() {
    // Set initial duration
    state.selectedDuration = 1;

    const durationSelect = document.getElementById('duration-select');
    if (!durationSelect) return;

    durationSelect.value = '1';

    durationSelect.addEventListener('change', () => {
        state.selectedDuration = parseFloat(durationSelect.value);
    });
}

function setupMelodyNoteDurationOptions() {
    // Set initial duration for melody notes
    const durationSelect = document.getElementById('melody-note-duration-select');
    if (!durationSelect) return;

    durationSelect.value = '1';

    durationSelect.addEventListener('change', () => {
        // This will be handled in insertMelodyNotes
    });
}

function getPreviousChord(lineId, barIndex) {
    // Look backwards for the most recent chord
    for (let i = lineId; i >= 0; i--) {
        const line = state.lines[i];
        if (!line) continue;
        
        const startBar = i === lineId ? barIndex - 1 : line.bars.length - 1;
        for (let j = startBar; j >= 0; j--) {
            const bar = line.bars[j];
            if (bar.chords.length > 0) {
                return bar.chords[bar.chords.length - 1];
            }
        }
    }
    return null;
}

function drawCircleOfFifths(previousChord) {
    const svg = document.getElementById('circle-of-fifths');
    svg.innerHTML = '';
    
    // Completely redesigned to show only the 7 scale notes in a circle
    
    const width = 600;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = 260;
    const middleRadius = 180;
    const innerRadius = 100;
    const romanRadius = 285; // Outside the outer circle
    
    // Get scale notes to determine which notes are in key
    const scaleNotes = getScaleNotes();
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    
    // Relative minor for each major key (3 semitones down)
    const relativeMinorMap = {
        'C': 'Am', 'G': 'Em', 'D': 'Bm', 'A': 'F#m', 'E': 'C#m', 'B': 'G#m',
        'F#': 'D#m', 'C#': 'A#m', 'G#': 'E#m', 'D#': 'B#m', 'A#': 'F##m',
        'Gb': 'Ebm', 'Db': 'Bbm', 'Ab': 'Fm', 'Eb': 'Cm', 'Bb': 'Gm', 'F': 'Dm'
    };
    
    // Determine which notation to use (sharp or flat) based on key
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'];
    const useFlats = flatKeys.includes(state.key) || state.key.includes('b');
    
    // Create the correct circle order based on notation preference
    const circleOrder = useFlats ?
        ['C', 'G', 'D', 'A', 'E', 'B', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F'] :
        ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
    
    // Draw all 12 notes in Circle of Fifths order - OUTER RING (Major keys)
    circleOrder.forEach((note, index) => {
        const angle = (index * (360 / 12)) - 90;
        const nextAngle = ((index + 1) * (360 / 12)) - 90;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('chord-circle-segment');
        
        // Create path for outer segment (major keys)
        const path = createArcPath(centerX, centerY, middleRadius, outerRadius, angle, nextAngle);
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', path);
        
        // Check if note is in current scale (considering enharmonics)
        const noteInScale = scaleNotes.some(scaleNote =>
            scaleNote === note ||
            areEnharmonicEquivalents(scaleNote, note)
        );
        const scaleIndex = scaleNotes.findIndex(scaleNote =>
            scaleNote === note ||
            areEnharmonicEquivalents(scaleNote, note)
        );
        
        // Color based on whether in scale
        const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'];
        const mutedColors = ['#b0b0b0', '#c0c0c0', '#d0d0d0', '#b5b5b5', '#c5c5c5', '#d5d5d5', '#b8b8b8'];
        
        pathEl.setAttribute('fill', noteInScale ? colors[scaleIndex % colors.length] : mutedColors[index % mutedColors.length]);
        pathEl.setAttribute('stroke', 'white');
        pathEl.setAttribute('stroke-width', '2');
        
        // Highlight if this is the root key (check enharmonic equivalents)
        if (state.key === note || areEnharmonicEquivalents(state.key, note)) {
            pathEl.setAttribute('stroke', '#FFD700');
            pathEl.setAttribute('stroke-width', '4');
        }
        
        // Make out-of-scale notes less prominent
        if (!noteInScale) {
            pathEl.setAttribute('opacity', '0.5');
        }
        
        group.appendChild(pathEl);
        
        // Add major key label
        const labelAngle = (angle + nextAngle) / 2;
        const labelRadius = (outerRadius + middleRadius) / 2;
        const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180);
        const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', labelX);
        text.setAttribute('y', labelY);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '22');
        text.setAttribute('font-weight', 'bold');
        text.textContent = note;
        
        group.appendChild(text);
        
        // Add click handler for major key
        group.style.cursor = 'pointer';
        group.addEventListener('click', (e) => {
            e.stopPropagation();
            selectChord(note, noteInScale ? scaleIndex : -1, false);
        });
        
        svg.appendChild(group);
    });
    
    // Draw INNER RING (Relative minor keys)
    circleOrder.forEach((note, index) => {
        const angle = (index * (360 / 12)) - 90;
        const nextAngle = ((index + 1) * (360 / 12)) - 90;
        
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('chord-circle-segment');
        
        // Create path for inner segment (minor keys)
        const path = createArcPath(centerX, centerY, innerRadius, middleRadius, angle, nextAngle);
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', path);
        
        const minorKey = relativeMinorMap[note];
        const minorRoot = minorKey.replace('m', '');
        
        // Check if in scale
        const noteInScale = scaleNotes.some(scaleNote =>
            scaleNote === minorRoot ||
            areEnharmonicEquivalents(scaleNote, minorRoot)
        );
        const scaleIndex = scaleNotes.findIndex(scaleNote =>
            scaleNote === minorRoot ||
            areEnharmonicEquivalents(scaleNote, minorRoot)
        );
        
        // Darker colors for minor keys
        const minorColors = ['#4a5fd1', '#5d3a8a', '#d074db', '#3b8cde', '#00d0de', '#32c75b', '#da5a7a'];
        const mutedMinorColors = ['#909090', '#a0a0a0', '#b0b0b0', '#959595', '#a5a5a5', '#b5b5b5', '#989898'];
        
        pathEl.setAttribute('fill', noteInScale ? minorColors[scaleIndex % minorColors.length] : mutedMinorColors[index % mutedMinorColors.length]);
        pathEl.setAttribute('stroke', 'white');
        pathEl.setAttribute('stroke-width', '2');
        
        if (!noteInScale) {
            pathEl.setAttribute('opacity', '0.5');
        }
        
        group.appendChild(pathEl);
        
        // Add minor key label
        const labelAngle = (angle + nextAngle) / 2;
        const labelRadius = (middleRadius + innerRadius) / 2;
        const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180);
        const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180);
        
        const minorText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        minorText.setAttribute('x', labelX);
        minorText.setAttribute('y', labelY);
        minorText.setAttribute('text-anchor', 'middle');
        minorText.setAttribute('dominant-baseline', 'middle');
        minorText.setAttribute('fill', 'white');
        minorText.setAttribute('font-size', '16');
        minorText.setAttribute('font-weight', 'bold');
        minorText.textContent = minorKey;
        
        group.appendChild(minorText);
        
        // Add click handler for minor key
        group.style.cursor = 'pointer';
        group.addEventListener('click', (e) => {
            e.stopPropagation();
            selectChord(minorRoot, noteInScale ? scaleIndex : -1, true);
        });
        
        svg.appendChild(group);
    });
    
    // Add Roman numerals for notes in scale - positioned radially outward from center
    scaleNotes.forEach((note, scaleIndex) => {
        // Find the angle for this note in the circle using the correct circleOrder
        const circleIndex = circleOrder.findIndex(n =>
            n === note || areEnharmonicEquivalents(n, note)
        );
        
        if (circleIndex >= 0) {
            const angle = (circleIndex * (360 / 12)) - 90;
            const nextAngle = ((circleIndex + 1) * (360 / 12)) - 90;
            const labelAngle = (angle + nextAngle) / 2;
            
            // Place roman numerals just outside the outer circle
            const romanLabelX = centerX + romanRadius * Math.cos(labelAngle * Math.PI / 180);
            const romanLabelY = centerY + romanRadius * Math.sin(labelAngle * Math.PI / 180);
            
            // Create a background circle for better visibility
            const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            bgCircle.setAttribute('cx', romanLabelX);
            bgCircle.setAttribute('cy', romanLabelY);
            bgCircle.setAttribute('r', '20');
            bgCircle.setAttribute('fill', 'white');
            bgCircle.setAttribute('stroke', '#3498db');
            bgCircle.setAttribute('stroke-width', '2');
            svg.appendChild(bgCircle);
            
            const romanText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            romanText.setAttribute('x', romanLabelX);
            romanText.setAttribute('y', romanLabelY);
            romanText.setAttribute('text-anchor', 'middle');
            romanText.setAttribute('dominant-baseline', 'middle');
            romanText.setAttribute('fill', '#2c3e50');
            romanText.setAttribute('font-size', '20');
            romanText.setAttribute('font-weight', 'bold');
            romanText.textContent = romanNumerals[scaleIndex];
            
            svg.appendChild(romanText);
        }
    });
    
    // Add selected chord label in center (large and prominent)
    const centerLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    centerLabel.setAttribute('x', centerX);
    centerLabel.setAttribute('y', centerY);
    centerLabel.setAttribute('text-anchor', 'middle');
    centerLabel.setAttribute('dominant-baseline', 'middle');
    centerLabel.setAttribute('fill', '#3498db');
    centerLabel.setAttribute('font-size', '48');
    centerLabel.setAttribute('font-weight', 'bold');
    centerLabel.setAttribute('id', 'svg-chord-name');
    centerLabel.textContent = '-';
    svg.appendChild(centerLabel);
}

// Helper function to check if two notes are enharmonic equivalents
function areEnharmonicEquivalents(note1, note2) {
    const enharmonics = {
        'C#': 'Db', 'Db': 'C#',
        'D#': 'Eb', 'Eb': 'D#',
        'F#': 'Gb', 'Gb': 'F#',
        'G#': 'Ab', 'Ab': 'G#',
        'A#': 'Bb', 'Bb': 'A#'
    };
    return enharmonics[note1] === note2 || enharmonics[note2] === note1;
}

function createArcPath(cx, cy, innerRadius, outerRadius, startAngle, endAngle) {
    const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
    const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
    const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
    const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
    
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    return [
        "M", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");
}

function polarToCartesian(cx, cy, radius, angleInDegrees) {
    const angleInRadians = angleInDegrees * Math.PI / 180;
    return {
        x: cx + radius * Math.cos(angleInRadians),
        y: cy + radius * Math.sin(angleInRadians)
    };
}

function getScaleNotes() {
    // Determine if we should use sharps or flats based on key
    const flatKeys = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb'];
    const useFlats = flatKeys.includes(state.key) || state.key.includes('b');
    
    // Get the appropriate NOTES array (with sharps or flats)
    const notesArray = useFlats ?
        ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] :
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const rootIndex = notesArray.indexOf(state.key);
    if (rootIndex === -1) {
        // Try to find enharmonic equivalent
        const enharmonicMap = {
            'C#': 'Db', 'Db': 'C#', 'D#': 'Eb', 'Eb': 'D#',
            'F#': 'Gb', 'Gb': 'F#', 'G#': 'Ab', 'Ab': 'G#', 'A#': 'Bb', 'Bb': 'A#'
        };
        const equivalent = enharmonicMap[state.key];
        const equivalentIndex = notesArray.indexOf(equivalent);
        if (equivalentIndex >= 0) {
            const scalePattern = SCALES[state.scale];
            return scalePattern.map(interval => notesArray[(equivalentIndex + interval) % 12]);
        }
        return [];
    }
    
    const scalePattern = SCALES[state.scale];
    return scalePattern.map(interval => notesArray[(rootIndex + interval) % 12]);
}

function selectChord(note, degree, isMinor = false) {
    // If clicking in outer ring (major), always use major quality
    // If clicking in inner ring (minor), always use minor quality
    state.selectedChord = {
        root: note,
        degree: degree,
        quality: isMinor ? 'm' : ''
    };
    
    // Update the display in center of circle
    updateSelectedChordDisplay();
    
    // Play the chord
    playChord(getFullChordName());
}

function getChordQuality(degree) {
    if (degree < 0) return '';
    
    const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const roman = romanNumerals[degree];
    
    // Return quality based on scale if defined, otherwise return empty
    if (CHORD_QUALITIES[state.scale]) {
        return CHORD_QUALITIES[state.scale][roman] || '';
    }
    
    return '';
}

function getFullChordName() {
    if (!state.selectedChord) return '-';
    
    const { root, quality } = state.selectedChord;
    const extension = state.selectedExtension;
    
    return `${root}${quality}${extension}`;
}

function updateSelectedChordDisplay() {
    const chordName = getFullChordName();
    
    // Update SVG text in center of circle
    const svgChordName = document.getElementById('svg-chord-name');
    if (svgChordName) {
        svgChordName.textContent = chordName;
        
        // Adjust font size based on length
        const length = chordName.length;
        if (length > 6) {
            svgChordName.setAttribute('font-size', '36');
        } else if (length > 4) {
            svgChordName.setAttribute('font-size', '42');
        } else {
            svgChordName.setAttribute('font-size', '48');
        }
    }
}

function insertChord() {
    if (!state.selectedChord || !state.currentBar) return;
    
    const { lineId, barIndex } = state.currentBar;
    const line = state.lines[lineId];
    const bar = line.bars[barIndex];
    
    // Get color for this degree
    const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a'];
    const degree = state.selectedChord.degree >= 0 ? state.selectedChord.degree : 0;
    
    const [beatsPerBar] = state.timeSignature.split('/').map(Number);
    
    // Calculate current beats used in this bar
    let usedBeats = 0;
    bar.chords.forEach(chord => {
        usedBeats += chord.duration;
    });
    
    const availableBeats = beatsPerBar - usedBeats;
    
    // If chord fits in current bar, insert it normally
    if (state.selectedDuration <= availableBeats) {
        const chord = {
            root: state.selectedChord.root,
            quality: state.selectedChord.quality,
            extension: state.selectedExtension,
            degree: state.selectedChord.degree,
            duration: state.selectedDuration,
            beat: 0,
            color: degree >= 0 ? colors[degree % colors.length] : '#999999'
        };
        
        bar.chords.push(chord);
        updateBarDisplay(lineId);
    } else {
        // Chord doesn't fit - split it across bars
        let remainingDuration = state.selectedDuration;
        let currentBarIndex = barIndex;
        let currentLineId = lineId;
        
        while (remainingDuration > 0) {
            const currentLine = state.lines[currentLineId];
            const currentBar = currentLine.bars[currentBarIndex];
            
            // Calculate space in current bar
            let usedInBar = 0;
            currentBar.chords.forEach(chord => {
                usedInBar += chord.duration;
            });
            const spaceInBar = beatsPerBar - usedInBar;
            
            // Determine how much to put in this bar
            const durationInThisBar = Math.min(remainingDuration, spaceInBar);
            
            if (durationInThisBar > 0) {
                const chordSegment = {
                    root: state.selectedChord.root,
                    quality: state.selectedChord.quality,
                    extension: state.selectedExtension,
                    degree: state.selectedChord.degree,
                    duration: durationInThisBar,
                    beat: 0,
                    color: degree >= 0 ? colors[degree % colors.length] : '#999999'
                };
                
                currentBar.chords.push(chordSegment);
                remainingDuration -= durationInThisBar;
            }
            
            // Move to next bar
            currentBarIndex++;
            
            // If we've run out of bars in this line, move to next line
            if (currentBarIndex >= currentLine.bars.length) {
                currentBarIndex = 0;
                currentLineId++;
                
                // Create new line if needed
                if (currentLineId >= state.lines.length) {
                    addLine();
                }
            }
        }
        
        // Update all affected lines
        for (let i = lineId; i <= currentLineId && i < state.lines.length; i++) {
            updateBarDisplay(i);
        }
    }
    
    // Close modal
function showRepeatMenu(e, lineId, barIndex) {
    // Remove existing menus
    document.querySelectorAll('.chord-context-menu').forEach(el => el.remove());
    
    const menu = document.createElement('div');
    menu.className = 'chord-context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    
    const bar = state.lines[lineId].bars[barIndex];
    
    menu.innerHTML = `
        <div class="context-menu-item">${bar.repeatStart ? '✓' : ''} Gentagelse start</div>
        <div class="context-menu-item">${bar.repeatEnd ? '✓' : ''} Gentagelse slut</div>
        <div class="context-menu-item">Fjern gentagelse</div>
    `;
    
    document.body.appendChild(menu);
    
    const items = menu.querySelectorAll('.context-menu-item');
    
    items[0].addEventListener('click', () => {
        bar.repeatStart = !bar.repeatStart;
        rebuildAllBars();
        menu.remove();
    });
    
    items[1].addEventListener('click', () => {
        bar.repeatEnd = !bar.repeatEnd;
        rebuildAllBars();
        menu.remove();
    });
    
    items[2].addEventListener('click', () => {
        bar.repeatStart = false;
        bar.repeatEnd = false;
        rebuildAllBars();
        menu.remove();
    });
    
    // Close menu on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

    state.pendingEdit = null;
    document.getElementById('chord-modal').classList.remove('active');
}

function updateBarDisplay(lineId) {
    const line = state.lines[lineId];
    const lineEl = document.querySelector(`[data-line-id="${lineId}"]`);
    if (!lineEl) return;
    
    line.bars.forEach((bar, barIndex) => {
        const barEl = lineEl.querySelector(`[data-bar-index="${barIndex}"]`);
        const beatsContainer = barEl.querySelector('.beats-container');
        
        // Clear existing chord segments
        beatsContainer.querySelectorAll('.chord-segment').forEach(el => el.remove());
        
        // Add chord segments
        let currentBeat = 0;
        bar.chords.forEach((chord, chordIndex) => {
            const segment = document.createElement('div');
            segment.className = 'chord-segment';
            
            const [beatsPerBar] = state.timeSignature.split('/').map(Number);
            const startPercent = (currentBeat / beatsPerBar) * 100;
            const widthPercent = (chord.duration / beatsPerBar) * 100;
            
            segment.style.left = `${startPercent}%`;
            segment.style.width = `${widthPercent}%`;
            
            // Use the saved color from the chord
            if (chord.color) {
                segment.style.background = chord.color;
            }
            
            const chordName = `${chord.root}${chord.quality}${chord.extension}`;
            segment.innerHTML = `
                <div class="chord-name">${chordName}</div>
                <div class="play-icon">▶</div>
            `;
            
            segment.addEventListener('click', (e) => {
                e.stopPropagation();
                showChordContextMenu(e, lineId, barIndex, chordIndex);
            });
            
            beatsContainer.appendChild(segment);
            currentBeat += chord.duration;
        });
        
        // Update bar styling
        if (bar.chords.length > 0) {
            barEl.classList.add('has-chords');
        } else {
            barEl.classList.remove('has-chords');
        }
    });
}

function showChordContextMenu(e, lineId, barIndex, chordIndex) {
    // Remove existing context menus
    document.querySelectorAll('.chord-context-menu').forEach(el => el.remove());
    
    const menu = document.createElement('div');
    menu.className = 'chord-context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    
    menu.innerHTML = `
        <div class="context-menu-item play-item">▶ Afspil</div>
        <div class="context-menu-item edit-item">✏️ Rediger</div>
        <div class="context-menu-item danger delete-item">🗑 Slet</div>
    `;
    
    document.body.appendChild(menu);
    
    menu.querySelector('.play-item').addEventListener('click', () => {
        const chord = state.lines[lineId].bars[barIndex].chords[chordIndex];
        const chordName = `${chord.root}${chord.quality}${chord.extension}`;
        playChord(chordName);
        menu.remove();
    });
    
    menu.querySelector('.edit-item').addEventListener('click', () => {
        editChord(lineId, barIndex, chordIndex);
        menu.remove();
    });
    
    menu.querySelector('.delete-item').addEventListener('click', () => {
        deleteChord(lineId, barIndex, chordIndex);
        menu.remove();
    });
    
    // Close menu on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

function editChord(lineId, barIndex, chordIndex) {
    const chord = state.lines[lineId].bars[barIndex].chords[chordIndex];
    console.log('Editing chord:', chord);

    // Mark pending edit so we can restore on cancel
    state.pendingEdit = {
        lineId,
        barIndex,
        originalIndex: chordIndex,
        originalChord: { ...chord }
    };

    // Temporarily remove the old chord to free space for editing
    state.lines[lineId].bars[barIndex].chords.splice(chordIndex, 1);
    updateBarDisplay(lineId);

    // Open modal with chord pre-loaded
    openChordModal(lineId, barIndex, chord);
}

function editMelodyNote(lineId, melodyLineId, noteId) {
    const line = state.lines.find(l => l.id === lineId);
    const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
    const note = melodyLine?.notes.find(n => n.id === noteId);

    if (!note) {
        console.error('Note not found for editing');
        return;
    }

    console.log('Editing melody note:', note);

    // Find the bar index for this note
    const barIndex = note.barIndex;

    // Check if THIS specific note is part of a simultaneous group
    const isSimultaneous = note.simultaneous === true;
    
    if (isSimultaneous) {
        // This note is part of a simultaneous group (chord)
        // Find all notes with the same chordIndex in the same bar
        const notesInSameChord = melodyLine.notes.filter(n =>
            n.barIndex === barIndex &&
            n.simultaneous === true &&
            n.chordIndex === note.chordIndex
        );
        
        if (notesInSameChord.length > 1) {
            // Multiple simultaneous notes - edit them as a group
            console.log('Editing simultaneous note group with', notesInSameChord.length, 'notes');
            state.pendingMelodyEdit = {
                lineId,
                melodyLineId,
                barIndex,
                noteId,
                originalNotesInBar: [...notesInSameChord]
            };

            // Temporarily remove only these simultaneous notes
            melodyLine.notes = melodyLine.notes.filter(n =>
                !notesInSameChord.some(chord => chord.id === n.id)
            );
            
            if (typeof updateMelodyBarDisplay === 'function') {
                updateMelodyBarDisplay(lineId);
            }

            // Store the simultaneous notes for pre-selection
            state.simultaneousNotesToPreselect = [...notesInSameChord];
            console.log('Stored simultaneous notes for pre-selection:', state.simultaneousNotesToPreselect);
        } else {
            // Single simultaneous note (shouldn't happen, but handle it)
            console.log('Editing single simultaneous note');
            state.pendingMelodyEdit = {
                lineId,
                melodyLineId,
                barIndex,
                noteId,
                originalNote: { ...note }
            };

            const noteIndex = melodyLine.notes.findIndex(n => n.id === noteId);
            if (noteIndex > -1) {
                melodyLine.notes.splice(noteIndex, 1);
                if (typeof updateMelodyBarDisplay === 'function') {
                    updateMelodyBarDisplay(lineId);
                }
            }

            state.singleNoteToPreselect = { ...note };
        }
    } else {
        // Single note editing (not simultaneous)
        console.log('Editing single non-simultaneous note');
        state.pendingMelodyEdit = {
            lineId,
            melodyLineId,
            barIndex,
            noteId,
            originalNote: { ...note }
        };

        // Temporarily remove the specific note being edited
        const noteIndex = melodyLine.notes.findIndex(n => n.id === noteId);
        if (noteIndex > -1) {
            melodyLine.notes.splice(noteIndex, 1);
            if (typeof updateMelodyBarDisplay === 'function') {
                updateMelodyBarDisplay(lineId);
            }
        }

        // Store the single note for pre-selection
        state.singleNoteToPreselect = { ...note };
    }

    // Open modal with note pre-loaded for editing
    openMelodyNoteModal(lineId, melodyLineId, barIndex, true);
}

function deleteChord(lineId, barIndex, chordIndex) {
    state.lines[lineId].bars[barIndex].chords.splice(chordIndex, 1);
    updateBarDisplay(lineId);
}

function deleteLine(lineId) {
    if (state.lines.length <= 1) {
        alert('Du skal have mindst én linje');
        return;
    }

    state.lines.splice(lineId, 1);

    // Reindex lines
    state.lines.forEach((line, index) => {
        line.id = index;
    });

    // Re-render all lines
    const container = document.getElementById('song-container');
    container.innerHTML = '';
    state.lines.forEach(line => renderLine(line));

    // Update the instrument legend
    if (typeof updateInstrumentLegend === 'function') {
        updateInstrumentLegend();
    }
}
// --- MELODY LINE FUNCTIONS ---

function openMelodyInstrumentModal(lineId) {
    state.currentLineId = lineId;
    const modal = document.getElementById('melody-instrument-modal');
    populateInstrumentGrid();
    modal.classList.add('active');

    // Attach listeners only once
    const closeBtn = modal.querySelector('.melody-close');
    const addBtn = document.getElementById('add-melody-line-btn');
    const instrumentGrid = modal.querySelector('.instrument-grid');

    const closeModalHandler = () => {
        modal.classList.remove('active');
        state.selectedInstrument = null;
    };

    const addMelodyLineHandler = () => {
        if (state.selectedInstrument) {
            addMelodyLine(state.currentLineId, state.selectedInstrument);
            closeModalHandler();
        } else {
            alert('Vælg venligst et instrument.');
        }
    };

    // Use cloning to remove old listeners before adding new ones
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeModalHandler);

    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    newAddBtn.addEventListener('click', addMelodyLineHandler);
    
    // Use event delegation for instrument selection for efficiency
    const instrumentSelectHandler = (e) => {
        if (e.target && e.target.closest('.instrument-card')) {
            const card = e.target.closest('.instrument-card');
            // Remove active class from all other cards
            instrumentGrid.querySelectorAll('.instrument-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.selectedInstrument = card.dataset.instrument;
        }
    };
    
    // Also remove and re-add listener for the grid
    const newInstrumentGrid = instrumentGrid.cloneNode(true); // Deep clone to keep children
    instrumentGrid.parentNode.replaceChild(newInstrumentGrid, instrumentGrid);
    populateInstrumentGrid(newInstrumentGrid); // Repopulate the new grid
    newInstrumentGrid.addEventListener('click', instrumentSelectHandler);
}

function populateInstrumentGrid(grid = null) {
    const instrumentGrid = grid || document.querySelector('#melody-instrument-modal .instrument-grid');
    instrumentGrid.innerHTML = '';

    // Create a Set to track displayed instrument names
    const displayedNames = new Set();

    // Instrument PNG icon mapping
    const instrumentIcons = {
        acoustic_bass: 'img/kontrabas.png', // Double bass
        electric_bass: 'img/elbas.png',
        synth_bass: 'img/synthbas.png',
        acoustic_guitar: 'img/akustiskguitar.png',
        electric_guitar_clean: 'img/elguitar.png',
        piano: 'img/klaver.png',
        flute: 'img/flute.png',
        violin: 'img/violin.png',
        drumset: 'img/trommer.png'
    };

    // Assuming INSTRUMENTS is defined in instruments.js
    for (const [key, value] of Object.entries(INSTRUMENTS)) {
        // Only add if the name hasn't been displayed yet
        if (!displayedNames.has(value.name)) {
            const card = document.createElement('div');
            card.className = 'instrument-card';
            card.dataset.instrument = key;

            // Use green color for drumset, otherwise use instrument color
            if (key === 'drumset') {
                card.style.backgroundColor = '#28a745'; // Green for drumset
            } else {
                card.style.backgroundColor = value.color || '#3b465a';
            }

            // Get specific PNG icon for this instrument, fallback to musical note emoji
            const iconPath = instrumentIcons[key] || '🎵';

            card.innerHTML = `
                <div class="instrument-icon">
                    ${iconPath.endsWith('.png') ?
                        `<img src="${iconPath}" alt="${value.name}" style="width: 40px; height: 40px; object-fit: contain;">` :
                        iconPath
                    }
                </div>
                <span>${value.name}</span>
            `;

            instrumentGrid.appendChild(card);
            displayedNames.add(value.name);
        }
    }
}

function addMelodyLine(lineId, instrument) {
    const line = state.lines.find(l => l.id === lineId);
    if (!line) return;

    const melodyLineId = `m${state.melodyLineCounter++}`;

    const instrumentInfo = INSTRUMENTS[instrument];
    
    let pitchScale;
    
    // For drumset, use drum names instead of pitches
    if (instrument === 'drumset' && instrumentInfo.drumMap) {
        pitchScale = Object.keys(instrumentInfo.drumMap);
    } else {
        // For melodic instruments, use pitch-based scale
        const scaleNotes = getScaleNotes();
        const availableNotes = getInstrumentNotes(instrument, scaleNotes, state.key);
        pitchScale = availableNotes.map(n => n.displayName);
    }

    const newMelodyLine = {
        id: melodyLineId,
        instrument: instrument,
        pitchScale: pitchScale, // Array of pitch names or drum names
        notes: [], // Array of {row, col, span, pitch, midiNote} or {row, col, span, drumName}
        volume: 0.7,
        collapsed: false,
        samplesLoaded: false // Track if drum samples are loaded
    };

    line.melodyLines.push(newMelodyLine);

    // Re-render the specific line to show the new melody track
    reRenderLine(lineId);

    // Update the instrument legend
    updateInstrumentLegend();
}

function reRenderLine(lineId) {
    const line = state.lines.find(l => l.id === lineId);
    if (!line) return;

    const container = document.getElementById('song-container');
    const existingLineEl = container.querySelector(`.song-line[data-line-id="${lineId}"]`);

    if (existingLineEl) {
        // Create a new element and replace the old one
        const newLineEl = document.createElement('div');
        newLineEl.className = 'song-line';
        newLineEl.dataset.lineId = line.id;
        
        // Use existing render function but point it to the new element's innerHTML
        const lineContent = getLineHTML(line);
        newLineEl.innerHTML = lineContent;
        
        container.replaceChild(newLineEl, existingLineEl);
        
        // Re-attach event listeners for the new line
        attachLineEventListeners(newLineEl, line);
    }
}

function getLineHTML(line) {
    const [beatsPerBar] = state.timeSignature.split('/').map(Number);

    return `
        <div class="line-header">
            <div class="line-number">Linje ${line.id + 1}</div>
            <div class="line-actions">
                <button class="btn btn-small btn-secondary play-line-btn">▶ Afspil</button>
                <button class="btn btn-small btn-primary add-melody-btn">+ Melodi</button>
                <button class="btn btn-small btn-danger delete-line-btn">🗑 Slet</button>
            </div>
        </div>
        <div class="section-title">Akkorder</div>
        <div class="bars-container">
            <div class="playback-progress" data-line-id="${line.id}"></div>
            ${line.bars.map((bar, barIndex) => `
                <div class="bar ${bar.repeatStart ? 'repeat-start' : ''} ${bar.repeatEnd ? 'repeat-end' : ''}" data-bar-index="${barIndex}">
                    <div class="bar-number">${barIndex + 1}</div>
                    <div class="bar-repeat-controls">
                        <button class="repeat-btn repeat-start-btn ${bar.repeatStart ? 'active' : ''}" title="Gentagelse start">|:</button>
                        <button class="repeat-btn repeat-end-btn ${bar.repeatEnd ? 'active' : ''}" title="Gentagelse slut">:|</button>
                        <button class="repeat-btn play-bar-btn" title="Afspil denne takt">▶</button>
                    </div>
                    ${bar.repeatStart ? '<div class="repeat-dots repeat-dots-start"><div class="dot"></div><div class="dot"></div></div>' : ''}
                    ${bar.repeatEnd ? '<div class="repeat-dots repeat-dots-end"><div class="dot"></div><div class="dot"></div></div>' : ''}
                    <div class="beats-container">
                        ${Array(beatsPerBar).fill(0).map((_, beatIndex) => `
                            <div class="beat" data-beat-index="${beatIndex}"></div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="lyrics-container">
            ${line.bars.map((bar, barIndex) => `
                <input type="text" class="lyrics-input-bar" data-bar-index="${barIndex}" placeholder="Tekst..." value="${bar.lyrics || ''}">
            `).join('')}
        </div>
        <div class="melody-lines-container">
            ${line.melodyLines.map(mLine => getMelodyLineHTML(mLine, line.id, state.barsPerLine)).join('')}
        </div>
    `;
}

function getMelodyLineHTML(melodyLine, lineId) {
    const instrument = INSTRUMENTS[melodyLine.instrument];
    const instrumentColor = instrument?.color || '#a29bfe';
    const instrumentName = instrument?.name || 'Unknown';
    const isDrumset = melodyLine.instrument === 'drumset';
    const [beatsPerBar] = state.timeSignature.split('/').map(Number);
    
    // Use 4 subdivisions per beat for quarter-note precision
    const subdivisions = 4;
    const totalCols = state.barsPerLine * beatsPerBar * subdivisions;
    const colsPerBar = beatsPerBar * subdivisions;
    
    // Ensure pitchScale exists and has the right notes
    if (!melodyLine.pitchScale || melodyLine.pitchScale.length === 0) {
        if (isDrumset && instrument.drumMap) {
            melodyLine.pitchScale = Object.keys(instrument.drumMap);
        } else {
            const scaleNotes = getScaleNotes();
            const availableNotes = getInstrumentNotes(melodyLine.instrument, scaleNotes, state.key);
            melodyLine.pitchScale = availableNotes.map(n => n.displayName);
        }
    }
    
    // Label width - wider for drum names
    const labelWidth = isDrumset ? '100px' : '40px';
    
    // Create grid with pitch/drum labels on left and cells for notes
    return `
        <div class="melody-line ${melodyLine.collapsed ? 'collapsed' : ''}" data-melody-line-id="${melodyLine.id}" data-line-id="${lineId}" data-subdivisions="${subdivisions}">
            <div class="melody-line-header" style="background: linear-gradient(135deg, ${instrumentColor}15, ${instrumentColor}30); border: 2px solid ${instrumentColor};">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <button class="toggle-collapse-btn" title="Skjul/Vis grid">
                        ${melodyLine.collapsed ? '▶' : '▼'}
                    </button>
                    <span class="melody-line-name" style="color: #2c3e50;">${instrumentName}</span>
                    ${isDrumset ? `
                        <span class="samples-status" style="color: #28a745; font-size: 0.85em; margin-left: 10px; font-weight: bold;">
                            ✓ Samples klar
                        </span>
                        <button class="btn btn-small btn-secondary load-drum-samples-btn" style="margin-left: 10px;" title="Load dine egne custom samples (valgfrit)">
                            📂 Load Custom Samples
                        </button>` : ''}
                    <div class="volume-control" style="display: flex; align-items: center; gap: 8px;">
                        <input type="range" class="volume-slider" min="0" max="100" value="${(melodyLine.volume || 0.7) * 100}"
                               style="width: 80px;" title="Volumen">
                        <span class="volume-value" style="font-size: 0.8em; color: #7f8c8d; min-width: 35px;">${Math.round((melodyLine.volume || 0.7) * 100)}%</span>
                    </div>
                </div>
                <button class="btn btn-small btn-danger delete-melody-line-btn">🗑 Slet</button>
            </div>
            <div class="melody-grid" data-melody-id="${melodyLine.id}" style="--grid-cols: ${totalCols}; --grid-color: ${instrumentColor}; --label-width: ${labelWidth};">
                ${melodyLine.pitchScale.map((pitch, rowIdx) => 
                    `<div class="melody-row" data-row="${rowIdx}"><div class="pitch-label pitch-label-clickable" data-pitch="${pitch}" data-row="${rowIdx}" style="background: ${instrumentColor}20; border-color: ${instrumentColor}; font-size: ${isDrumset ? '0.75em' : '1em'}; cursor: pointer;">${pitch}</div><div class="melody-cells" style="--grid-cols: ${totalCols};">${Array(totalCols).fill(0).map((_, colIdx) => {
                                const isBarStart = colIdx > 0 && (colIdx % colsPerBar) === 0;
                                const isBeatStart = colIdx > 0 && (colIdx % subdivisions) === 0 && (colIdx % colsPerBar) !== 0;
                                return `<div class="melody-cell ${isBarStart ? 'bar-start' : ''} ${isBeatStart ? 'beat-start' : ''}" data-row="${rowIdx}" data-col="${colIdx}"></div>`;
                            }).join('')}</div></div>`
                ).join('')}
            </div>
        </div>
    `;
}

function toggleMelodyLineCollapse(lineId, melodyLineId) {
    console.log('Toggling collapse for melody line', melodyLineId);
    const line = state.lines.find(l => l.id === lineId);
    const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
    if (!melodyLine) {
        console.error('Melody line not found!');
        return;
    }
    
    // Toggle collapsed state
    melodyLine.collapsed = !melodyLine.collapsed;
    console.log('New collapsed state:', melodyLine.collapsed);
    
    // Re-render the line
    reRenderLine(lineId);
}


function attachLineEventListeners(lineEl, line) {
    // Top-level line buttons
    lineEl.querySelector('.play-line-btn')?.addEventListener('click', () => playLine(line.id));
    lineEl.querySelector('.add-melody-btn')?.addEventListener('click', () => openMelodyInstrumentModal(line.id));
    lineEl.querySelector('.delete-line-btn')?.addEventListener('click', () => deleteLine(line.id));

    // Bar interaction
    lineEl.querySelectorAll('.bar').forEach((barEl, barIndex) => {
        barEl.addEventListener('click', (e) => {
            if (!e.target.closest('.chord-segment') && !e.target.closest('.repeat-btn')) {
                openChordModal(line.id, barIndex);
            }
        });

        const startBtn = barEl.querySelector('.repeat-start-btn');
        const endBtn = barEl.querySelector('.repeat-end-btn');
        const playBarBtn = barEl.querySelector('.play-bar-btn');

        startBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const bar = state.lines[line.id].bars[barIndex];
            bar.repeatStart = !bar.repeatStart;
            rebuildAllBars();
        });

        endBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            const bar = state.lines[line.id].bars[barIndex];
            bar.repeatEnd = !bar.repeatEnd;
            rebuildAllBars();
        });

        playBarBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            playBar(line.id, barIndex);
        });
    });
    
    // Melody grid cell interaction
    lineEl.querySelectorAll('.melody-cell').forEach(cell => {
        const melodyLineEl = cell.closest('.melody-line');
        const melodyLineId = melodyLineEl.dataset.melodyLineId;
        const row = parseInt(cell.dataset.row, 10);
        const col = parseInt(cell.dataset.col, 10);
        
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            openNoteSpanModal(line.id, melodyLineId, row, col);
        });
    });

    // Melody line collapse buttons
    lineEl.querySelectorAll('.toggle-collapse-btn').forEach(btn => {
        const melodyLineEl = btn.closest('.melody-line');
        const melodyLineId = melodyLineEl.dataset.melodyLineId;
        console.log('Attaching collapse listener to button for melody line', melodyLineId);
        
        btn.addEventListener('click', (e) => {
            console.log('Collapse button clicked!');
            e.stopPropagation();
            e.preventDefault();
            toggleMelodyLineCollapse(line.id, melodyLineId);
        });
    });
    
    // Make headers not interfere with button clicks
    lineEl.querySelectorAll('.melody-line-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Only toggle if clicking directly on header, not on buttons or sliders
            if (e.target === header || e.target.classList.contains('melody-line-name')) {
                const melodyLineEl = header.closest('.melody-line');
                const melodyLineId = melodyLineEl.dataset.melodyLineId;
                toggleMelodyLineCollapse(line.id, melodyLineId);
            }
        });
    });

    // Volume sliders
    lineEl.querySelectorAll('.volume-slider').forEach(slider => {
        const melodyLineEl = slider.closest('.melody-line');
        const melodyLineId = melodyLineEl.dataset.melodyLineId;
        const volumeValue = slider.parentElement.querySelector('.volume-value');
        
        slider.addEventListener('input', (e) => {
            e.stopPropagation();
            const volume = parseInt(e.target.value) / 100;
            const melodyLine = line.melodyLines.find(ml => ml.id === melodyLineId);
            if (melodyLine) {
                melodyLine.volume = volume;
                if (volumeValue) {
                    volumeValue.textContent = `${Math.round(volume * 100)}%`;
                }
            }
        });
    });

    // Load drum samples buttons
    lineEl.querySelectorAll('.load-drum-samples-btn').forEach(btn => {
        const melodyLineEl = btn.closest('.melody-line');
        const melodyLineId = melodyLineEl.dataset.melodyLineId;
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const melodyLine = line.melodyLines.find(ml => ml.id === melodyLineId);
            if (melodyLine && melodyLine.instrument === 'drumset') {
                btn.disabled = true;
                btn.textContent = 'Loading...';

                // Load custom drum samples from user-selected files
                const success = await window.AudioEngine.loadDrumSamplesFromFiles();

                if (success) {
                    btn.textContent = '✓ Custom Loaded';
                } else {
                    btn.textContent = '📂 Load Custom Samples';
                }
                btn.disabled = false;
            }
        });
    });


    // Melody line delete buttons
    lineEl.querySelectorAll('.delete-melody-line-btn').forEach(btn => {
        const melodyLineEl = btn.closest('.melody-line');
        const melodyLineId = melodyLineEl.dataset.melodyLineId;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteMelodyLine(line.id, melodyLineId);
        });
    });

    // Pitch label click to preview sound
    lineEl.querySelectorAll('.pitch-label-clickable').forEach(label => {
        const melodyLineEl = label.closest('.melody-line');
        const melodyLineId = melodyLineEl.dataset.melodyLineId;
        const pitch = label.dataset.pitch;
        const row = parseInt(label.dataset.row);
        
        label.addEventListener('click', async (e) => {
            e.stopPropagation();
            const melodyLine = line.melodyLines.find(ml => ml.id === melodyLineId);
            if (!melodyLine) return;
            
            const instrument = INSTRUMENTS[melodyLine.instrument];
            const isDrumset = melodyLine.instrument === 'drumset';
            
            if (isDrumset) {
                // Play drum sample
                if (window.AudioEngine && window.AudioEngine.drumSamplesLoaded) {
                    await window.AudioEngine.playDrumSample(pitch, 0, melodyLine.volume || 0.7);
                } else {
                    console.warn('Drum samples not loaded yet');
                }
            } else {
                // Play melodic note
                const scaleNotes = getScaleNotes();
                const availableNotes = getInstrumentNotes(melodyLine.instrument, scaleNotes, state.key);
                const noteInfo = availableNotes.find(n => n.displayName === pitch);
                
                if (noteInfo && window.AudioEngine) {
                    await window.AudioEngine.playNote(
                        noteInfo.midiNote,
                        window.AudioEngine.audioContext.currentTime,
                        0.5,
                        instrument.soundfont,
                        melodyLine.volume || 0.7
                    );
                }
            }
        });
    });

    // Lyrics inputs
    lineEl.querySelectorAll('.lyrics-input-bar').forEach((input, barIndex) => {
        input.addEventListener('input', (e) => {
            state.lines[line.id].bars[barIndex].lyrics = e.target.value;
        });
    });

    updateBarDisplay(line.id);
    
    // Render all melody grids for this line
    line.melodyLines.forEach(melodyLine => {
        renderMelodyGrid(line.id, melodyLine.id);
    });
}

function deleteMelodyLine(lineId, melodyLineId) {
    const line = state.lines.find(l => l.id === lineId);
    if (line) {
        const index = line.melodyLines.findIndex(ml => ml.id === melodyLineId);
        if (index > -1) {
            line.melodyLines.splice(index, 1);
            if (typeof reRenderLine === 'function') {
                reRenderLine(lineId);
            } else {
                if (typeof updateMelodyBarDisplay === 'function') {
                    updateMelodyBarDisplay(lineId);
                }
            }

            // Update the instrument legend
            if (typeof updateInstrumentLegend === 'function') {
                updateInstrumentLegend();
            }
        }
    }
}

function updateInstrumentLegend() {
    const legendContainer = document.getElementById('instrument-legend');
    const legendItems = document.getElementById('legend-items');

    if (!legendContainer || !legendItems) return;

    // Collect all unique instruments currently in use
    const usedInstruments = new Map();

    state.lines.forEach(line => {
        line.melodyLines.forEach(melodyLine => {
            const instrumentKey = melodyLine.instrument;
            const instrument = INSTRUMENTS[instrumentKey];

            if (instrument && !usedInstruments.has(instrumentKey)) {
                usedInstruments.set(instrumentKey, {
                    name: instrument.displayName || instrument.name,
                    color: instrument.color,
                    key: instrumentKey
                });
            }
        });
    });

    // Clear existing legend items
    legendItems.innerHTML = '';

    if (usedInstruments.size === 0) {
        // Hide legend if no instruments are in use
        legendContainer.style.display = 'none';
        return;
    }

    // Show legend if there are instruments
    legendContainer.style.display = 'block';

    // Add legend items for each instrument
    usedInstruments.forEach((instrument, key) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';

        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${instrument.color}"></div>
            <span class="legend-name">${instrument.name}</span>
        `;

        legendItems.appendChild(legendItem);
    });
}
// ====== NEW SIMPLIFIED GRID-BASED NOTE FUNCTIONS ======

function getNoteSymbol(span, subdivisions = 4) {
    // Convert span to beats (1 subdivision = 1/4 beat)
    const beats = span / subdivisions;
    
    if (beats >= 4) return '𝅝'; // Whole note
    if (beats >= 2) return '𝅗𝅥'; // Half note
    if (beats >= 1) return '♩'; // Quarter note
    if (beats >= 0.5) return '♪'; // Eighth note
    return '♬'; // Sixteenth note
}

function openNoteSpanModal(lineId, melodyLineId, row, col) {
    const line = state.lines.find(l => l.id === lineId);
    const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
    if (!melodyLine) return;

    // Check if there's already a note at THIS EXACT cell (same row AND col)
    const existingNote = melodyLine.notes.find(n => n.row === row && n.col === col);
    
    if (existingNote) {
        // Show context menu for existing note
        const fakeEvent = { clientX: window.event?.clientX || 100, clientY: window.event?.clientY || 100 };
        showGridNoteContextMenu(fakeEvent, lineId, melodyLineId, existingNote);
        return;
    }
    
    console.log(`No existing note at row ${row}, col ${col}. Creating new note.`);

    // Default span - 1 subdivision (1/4 beat / sixteenth note)
    const subdivisions = 4;
    const spanNum = 1; // 1 subdivision (smallest unit)

    // Create new note
    const pitch = melodyLine.pitchScale[row];
    let displayName = pitch;
    
    const isDrumset = melodyLine.instrument === 'drumset';
    let midiNote = null;
    let drumName = null;
    
    if (isDrumset) {
        // For drumset, use drum name
        drumName = pitch; // pitch is actually the drum name
        displayName = pitch;
    } else {
        // For melodic instruments
        const scaleNotes = getScaleNotes();
        const availableNotes = getInstrumentNotes(melodyLine.instrument, scaleNotes, state.key);
        const noteInfo = availableNotes.find(n => n.displayName === pitch);
        if (!noteInfo) return;
        midiNote = noteInfo.midiNote;
    }

    // Calculate max span based on totalCols with subdivisions
    const [beatsPerBar] = state.timeSignature.split('/').map(Number);
    const totalCols = state.barsPerLine * beatsPerBar * subdivisions;
    const maxSpan = totalCols - col;

    // For melody, remove overlaps
    removeOverlappingNotes(melodyLine, row, col, Math.min(spanNum, maxSpan));

    const newNote = {
        id: `n${Date.now()}${Math.random().toString(36).substr(2, 5)}`,
        row: row,
        col: col,
        span: Math.min(spanNum, maxSpan),
        pitch: pitch,
        displayName: displayName
    };
    
    // Add instrument-specific properties
    if (isDrumset) {
        newNote.drumName = drumName;
    } else {
        newNote.midiNote = midiNote;
    }

    // Add new note
    melodyLine.notes.push(newNote);
    console.log(`Added note at row ${row}, col ${col}. Total notes now: ${melodyLine.notes.length}`);
    console.log('All notes:', melodyLine.notes);

    // Re-render
    renderMelodyGrid(lineId, melodyLineId);
}

function removeOverlappingNotes(melodyLine, row, col, span) {
    melodyLine.notes = melodyLine.notes.filter(note => {
        if (note.row !== row) return true; // Different row, keep it
        // Check if overlaps
        const noteEnd = note.col + note.span;
        const newEnd = col + span;
        return !(col < noteEnd && newEnd > note.col);
    });
}

function showGridNoteContextMenu(e, lineId, melodyLineId, note) {
    document.querySelectorAll('.chord-context-menu').forEach(el => el.remove());
    
    const menu = document.createElement('div');
    menu.className = 'chord-context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    
    menu.innerHTML = `
        <div class="context-menu-item play-melody-item">▶ Afspil</div>
        <div class="context-menu-item danger delete-melody-item">🗑 Slet tone</div>
    `;
    
    document.body.appendChild(menu);
    
    menu.querySelector('.play-melody-item').addEventListener('click', async () => {
        // Play this single note
        const line = state.lines.find(l => l.id === lineId);
        const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
        if (melodyLine && window.AudioEngine) {
            const instrument = INSTRUMENTS[melodyLine.instrument];
            const subdivisions = 4;
            const beatDuration = 60 / state.bpm;
            const duration = (note.span / subdivisions) * beatDuration;
            
            await window.AudioEngine.playNote(
                note.midiNote,
                window.AudioEngine.audioContext.currentTime,
                duration,
                instrument.soundfont
            );
        }
        menu.remove();
    });
    
    menu.querySelector('.delete-melody-item').addEventListener('click', () => {
        const line = state.lines.find(l => l.id === lineId);
        const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
        if (melodyLine) {
            const index = melodyLine.notes.findIndex(n => n.id === note.id);
            if (index > -1) {
                melodyLine.notes.splice(index, 1);
                renderMelodyGrid(lineId, melodyLineId);
            }
        }
        menu.remove();
    });
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

function renderMelodyGrid(lineId, melodyLineId) {
    const line = state.lines.find(l => l.id === lineId);
    const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
    if (!line || !melodyLine) return;

    const lineEl = document.querySelector(`.song-line[data-line-id="${lineId}"]`);
    if (!lineEl) return;

    const melodyLineEl = lineEl.querySelector(`.melody-line[data-melody-line-id="${melodyLineId}"]`);
    if (!melodyLineEl) return;

    const instrument = INSTRUMENTS[melodyLine.instrument];
    const instrumentColor = instrument?.color || '#a29bfe';
    
    const [beatsPerBar] = state.timeSignature.split('/').map(Number);
    const subdivisions = parseInt(melodyLineEl.dataset.subdivisions) || 4;
    const totalCols = state.barsPerLine * beatsPerBar * subdivisions;

    // Clear existing notes
    melodyLineEl.querySelectorAll('.melody-note-in-grid').forEach(el => el.remove());

    // Draw notes
    melodyLine.notes.forEach(note => {
        const row = melodyLineEl.querySelector(`.melody-row[data-row="${note.row}"]`);
        if (!row) return;

        const cellsContainer = row.querySelector('.melody-cells');
        if (!cellsContainer) return;
const noteEl = document.createElement('div');
noteEl.className = 'melody-note-in-grid';

// Calculate position based on total columns
const leftPercent = (note.col / totalCols) * 100;
const widthPercent = (note.span / totalCols) * 100;

noteEl.style.left = `${leftPercent}%`;
noteEl.style.width = `calc(${widthPercent}% - 2px)`;
noteEl.style.background = instrumentColor;

// Show pitch and symbol
const noteSymbol = getNoteSymbol(note.span, subdivisions);
noteEl.textContent = `${note.pitch} ${noteSymbol}`;
const beats = note.span / subdivisions;
noteEl.title = `${note.pitch} • ${beats} beats`;

// Add resize handle
const resizeHandle = document.createElement('div');
resizeHandle.className = 'note-resize-handle';
resizeHandle.title = 'Træk for at ændre længde';
noteEl.appendChild(resizeHandle);

// Click to show menu
noteEl.addEventListener('click', (e) => {
    if (!e.target.classList.contains('note-resize-handle')) {
        e.stopPropagation();
        showGridNoteContextMenu(e, lineId, melodyLineId, note);
    }
});

// Drag to resize with subdivision support
resizeHandle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    const startX = e.clientX;
    const startSpan = note.span;
    const cellWidth = cellsContainer.getBoundingClientRect().width / totalCols;
    
    const onMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaCols = Math.round(deltaX / cellWidth);
        let newSpan = Math.max(1, startSpan + deltaCols);
        
        // Don't exceed grid bounds
        const maxSpan = totalCols - note.col;
        newSpan = Math.min(newSpan, maxSpan);
        
        if (newSpan !== note.span) {
            // Update note span
            note.span = newSpan;
            // Remove overlaps (excluding this note)
            const otherNotes = melodyLine.notes.filter(n => n.id !== note.id);
            melodyLine.notes = otherNotes;
            removeOverlappingNotes(melodyLine, note.row, note.col, note.span);
            melodyLine.notes.push(note);
            // Re-render
            renderMelodyGrid(lineId, melodyLineId);
        }
    };
    
    const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
});

cellsContainer.appendChild(noteEl);
    });
}

// ====== OLD FUNCTIONS (kept for backwards compatibility, redirecting to placeholder) ======


function openMelodyNoteModal(lineId, melodyLineId, barIndex, isEditing = false) {
    console.log('Opening melody note modal for line', lineId, 'melodyLine', melodyLineId, 'bar', barIndex, 'editing:', isEditing);

    const line = state.lines.find(l => l.id === lineId);
    const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
    if (!melodyLine) {
        console.error('Melody line not found!');
        return;
    }

    console.log('Found melody line:', melodyLine);

    // Store context in state
    state.currentMelodyContext = { lineId, melodyLineId, barIndex, isEditing };

    const modal = document.getElementById('melody-note-modal');
    if (!modal) {
        console.error('Melody note modal not found!');
        return;
    }

    console.log('Modal found, showing...');
    modal.classList.add('active');

    // Populate notes and set selection state
    if (isEditing) {
        // Check for pre-selected notes from editMelodyNote
        if (state.simultaneousNotesToPreselect && state.simultaneousNotesToPreselect.length > 0) {
            // Use the stored simultaneous notes for pre-selection
            state.selectedMelodyNotes = [...state.simultaneousNotesToPreselect];
            console.log('Using pre-selected simultaneous notes:', state.selectedMelodyNotes);
            // Clear the temporary storage
            state.simultaneousNotesToPreselect = null;
        } else if (state.singleNoteToPreselect) {
            // Use the stored single note for pre-selection
            state.selectedMelodyNotes = [state.singleNoteToPreselect];
            console.log('Using pre-selected single note:', state.selectedMelodyNotes);
            // Clear the temporary storage
            state.singleNoteToPreselect = null;
        } else {
            // Fallback to checking pendingMelodyEdit
            const noteBeingEdited = state.pendingMelodyEdit?.originalNote;
            state.selectedMelodyNotes = noteBeingEdited ? [noteBeingEdited] : [];
            console.log('Fallback to single note editing from pendingEdit:', state.selectedMelodyNotes);
        }
    } else {
        // Start with a clean slate
        state.selectedMelodyNotes = [];
    }

    console.log('Final selected melody notes for modal:', state.selectedMelodyNotes);

    populateMelodyNoteGrid(melodyLine.instrument, isEditing);

    // Add event listener for note selection
    const grid = document.getElementById('melody-note-grid');
    const newGrid = grid.cloneNode(true); // Clone to remove old listeners
    grid.parentNode.replaceChild(newGrid, grid);

    newGrid.addEventListener('click', (e) => {
        const noteBtn = e.target.closest('.note-btn');
        console.log('Click detected on grid, target:', e.target, 'noteBtn:', noteBtn);

        if (noteBtn) {
            console.log('Note button clicked!');
            e.preventDefault();
            e.stopPropagation();

            noteBtn.classList.toggle('active');
            console.log('Note button active state:', noteBtn.classList.contains('active'));
            console.log('Note button classes:', noteBtn.className);

            const noteData = JSON.parse(noteBtn.dataset.note);
            console.log('Note data:', noteData);

            // Add or remove from selection
            const index = state.selectedMelodyNotes.findIndex(n => n.midiNote === noteData.midiNote);
            console.log('Note index in selection:', index);

            if (index > -1) {
                state.selectedMelodyNotes.splice(index, 1);
                console.log('Removed note from selection');
            } else {
                state.selectedMelodyNotes.push(noteData);
                console.log('Added note to selection');
            }

            console.log('Current selection:', state.selectedMelodyNotes);
        } else {
            console.log('Click was not on a note button');
        }
    });

    // Setup close button with restore functionality for editing
    const closeBtn = modal.querySelector('.melody-note-close');
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', () => {
        // If editing and user cancels, restore original notes
        if (isEditing && state.pendingMelodyEdit) {
            const { lineId, melodyLineId, originalNote, originalNotesInBar } = state.pendingMelodyEdit;
            const line = state.lines.find(l => l.id === lineId);
            const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
            if (melodyLine) {
                if (originalNotesInBar) {
                    // Restore all original simultaneous notes
                    originalNotesInBar.forEach(originalNote => {
                        melodyLine.notes.push(originalNote);
                    });
                } else if (originalNote) {
                    // Restore single original note
                    melodyLine.notes.push(originalNote);
                }
                if (typeof updateMelodyBarDisplay === 'function') {
                    updateMelodyBarDisplay(lineId);
                }
            }
            state.pendingMelodyEdit = null;
        }
        modal.classList.remove('active');
    });

    // Setup insert button
    const insertBtn = document.getElementById('insert-melody-notes-btn');
    const newInsertBtn = insertBtn.cloneNode(true);
    insertBtn.parentNode.replaceChild(newInsertBtn, insertBtn);
    newInsertBtn.addEventListener('click', insertMelodyNotes);

    // Setup modal click outside to close with restore functionality
    modal.removeEventListener('click', modal._outsideClickHandler);
    modal._outsideClickHandler = (e) => {
        if (e.target === modal) {
            // If editing and user cancels by clicking outside, restore original notes
            if (isEditing && state.pendingMelodyEdit) {
                const { lineId, melodyLineId, originalNote, originalNotesInBar } = state.pendingMelodyEdit;
                const line = state.lines.find(l => l.id === lineId);
                const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
                if (melodyLine) {
                    if (originalNotesInBar) {
                        // Restore all original simultaneous notes
                        originalNotesInBar.forEach(originalNote => {
                            melodyLine.notes.push(originalNote);
                        });
                    } else if (originalNote) {
                        // Restore single original note
                        melodyLine.notes.push(originalNote);
                    }
                    if (typeof updateMelodyBarDisplay === 'function') {
                        updateMelodyBarDisplay(lineId);
                    }
                }
                state.pendingMelodyEdit = null;
            }
            modal.classList.remove('active');
        }
    };
    modal.addEventListener('click', modal._outsideClickHandler);
}

function populateMelodyNoteGrid(instrumentKey, isEditing = false) {
    console.log('Populating melody note grid for instrument:', instrumentKey, 'editing:', isEditing);

    const grid = document.getElementById('melody-note-grid');
    if (!grid) {
        console.error('Melody note grid not found!');
        return;
    }

    grid.innerHTML = ''; // Clear previous notes

    // If editing, find the notes for the current bar to pre-select them
    const notesToPreselect = isEditing ? new Set(state.selectedMelodyNotes.map(n => n.midiNote)) : new Set();
    console.log('Notes to preselect:', notesToPreselect);

    // Get the notes for the current scale and key
    const scaleNotes = getScaleNotes();
    console.log('Scale notes:', scaleNotes);

    // Get the available notes for the instrument within that scale
    const availableNotes = getInstrumentNotes(instrumentKey, scaleNotes, state.key);
    console.log('Available notes:', availableNotes.length, availableNotes);

    if (availableNotes.length === 0) {
        grid.innerHTML = '<p>No available notes for this instrument in the current key and scale.</p>';
        return;
    }

    // Group notes by octave
    const notesByOctave = new Map();
    availableNotes.forEach(note => {
        const octave = note.octave;
        if (!notesByOctave.has(octave)) {
            notesByOctave.set(octave, []);
        }
        notesByOctave.get(octave).push(note);
    });

    // Sort octaves numerically (highest first, lowest last for bottom-to-top layout)
    const sortedOctaves = Array.from(notesByOctave.keys()).sort((a, b) => b - a);

    // Create a table structure
    const table = document.createElement('table');
    table.className = 'note-octave-table';

    // Add header row
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Octave</th>
        <th>Notes</th>
    `;
    table.appendChild(headerRow);

    // Add rows for each octave
    sortedOctaves.forEach(octave => {
        const notes = notesByOctave.get(octave);

        const row = document.createElement('tr');

        // Octave cell
        const octaveCell = document.createElement('td');
        octaveCell.className = 'octave-label';
        octaveCell.textContent = octave;
        row.appendChild(octaveCell);

        // Notes cell
        const notesCell = document.createElement('td');
        notesCell.className = 'octave-notes';

        notes.forEach(noteInfo => {
            const noteBtn = document.createElement('button');
            noteBtn.className = 'note-btn';

            // Check if this note is in the current scale (considering enharmonic equivalents)
            const noteInScale = scaleNotes.some(scaleNote => {
                // Direct match
                if (scaleNote === noteInfo.note) return true;

                // Check enharmonic equivalents
                return areEnharmonicEquivalents(scaleNote, noteInfo.note);
            });

            // Add visual indication for scale notes
            if (noteInScale) {
                noteBtn.classList.add('in-scale');
                noteBtn.title = `${noteInfo.displayName} (in scale)`;
            } else {
                noteBtn.classList.add('out-of-scale');
                noteBtn.title = `${noteInfo.displayName} (out of scale)`;
            }

            noteBtn.textContent = noteInfo.displayName;
            noteBtn.dataset.note = JSON.stringify(noteInfo);

            // If editing, mark the button as active if this note should be pre-selected
            if (notesToPreselect.has(noteInfo.midiNote)) {
                noteBtn.classList.add('active');
            }

            notesCell.appendChild(noteBtn);
        });

        row.appendChild(notesCell);
        table.appendChild(row);
    });

    grid.appendChild(table);
}

function insertMelodyNotes() {
    console.log('Inserting melody notes...');
    console.log('Current melody context:', state.currentMelodyContext);
    console.log('Selected melody notes:', state.selectedMelodyNotes);

    const { lineId, melodyLineId, barIndex } = state.currentMelodyContext;
    if (lineId === undefined || !melodyLineId || barIndex === undefined) {
        console.error('Invalid melody context for insertion');
        return;
    }

    const line = state.lines.find(l => l.id === lineId);
    const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
    if (!melodyLine) {
        console.error('Melody line not found for insertion');
        return;
    }

    const duration = parseFloat(document.getElementById('melody-note-duration-select').value);
    console.log('Duration:', duration);

    // Handle editing vs insertion differently
    if (state.currentMelodyContext.isEditing) {
        // When editing, the notes have already been removed in editMelodyNote
        // So we don't need to remove them again here
        console.log('Editing mode: notes already removed in editMelodyNote');
    }

    // Add the newly selected notes
    if (state.selectedMelodyNotes.length > 0) {
        const currentTime = Date.now();
        // Only mark as simultaneous if multiple notes are selected (chord)
        const isSimultaneous = state.selectedMelodyNotes.length > 1;
        
        state.selectedMelodyNotes.forEach((noteInfo, index) => {
            // Ensure each note has a unique ID if it doesn't have one already
            const noteId = noteInfo.id || `n${currentTime}${Math.random().toString(36).substr(2, 5)}${index}`;
            melodyLine.notes.push({
                ...noteInfo,
                id: noteId, // Assign new or existing ID
                barIndex: barIndex,
                duration: duration,
                simultaneous: isSimultaneous, // Only true when multiple notes selected
                chordIndex: isSimultaneous ? 0 : undefined, // Only set for simultaneous notes
            });
        });
    }

    console.log('Final melody line notes after insertion:', melodyLine.notes);

    console.log('Updated melody line notes:', melodyLine.notes);
    console.log('Number of notes in melody line:', melodyLine.notes.length);

    // Re-render the line to show the new notes
    console.log('Re-rendering line', lineId);
    if (typeof reRenderLine === 'function') {
        reRenderLine(lineId);
    } else {
        console.error('reRenderLine function not found!');
        // Fallback: update the specific line display
        updateMelodyBarDisplay(lineId);
    }

    // Close the modal
    const modal = document.getElementById('melody-note-modal');
    if (modal) {
        modal.classList.remove('active');
        console.log('Modal closed');
    } else {
        console.error('Modal not found for closing!');
    }

    // Reset selection and pending edit state
    state.selectedMelodyNotes = [];
    state.currentMelodyContext = null;
    state.pendingMelodyEdit = null;
}
    
function updateMelodyBarDisplay(lineId) {
    console.log('Updating melody bar display for line', lineId);
    const line = state.lines.find(l => l.id === lineId);
    const lineEl = document.querySelector(`.song-line[data-line-id="${lineId}"]`);
    if (!line || !lineEl) {
        console.error('Line or line element not found for display update');
        return;
    }

    console.log('Line data for display update:', line);

    // Go through each melody line and draw its notes
    line.melodyLines.forEach(melodyLine => {
        const instrumentColor = INSTRUMENTS[melodyLine.instrument]?.color || '#a29bfe';
        const melodyLineEl = lineEl.querySelector(`.melody-line[data-melody-line-id="${melodyLine.id}"]`);
        if (!melodyLineEl) return;

        // Clear existing notes from all melody bars in this line
        melodyLineEl.querySelectorAll('.melody-bar-segment .melody-note').forEach(n => n.remove());
        
        // Group notes by bar
        let barNotes = {};
        melodyLine.notes.forEach(note => {
            if (!barNotes[note.barIndex]) {
                barNotes[note.barIndex] = [];
            }
            barNotes[note.barIndex].push(note);
        });

        // Draw notes for each bar
        for (const barIndex in barNotes) {
            console.log(`Drawing ${barNotes[barIndex].length} notes for bar ${barIndex}`);
            const segment = melodyLineEl.querySelector(`.melody-bar-segment[data-bar-index="${barIndex}"]`);
            const beatsContainer = segment?.querySelector('.beats-container');
            if (!segment || !beatsContainer) {
                console.error('Segment or beats container not found for bar', barIndex);
                continue;
            }

            console.log('Found segment and beats container for bar', barIndex);
            let currentBeat = 0;
            const [beatsPerBar] = state.timeSignature.split('/').map(Number);

            const notesInBar = barNotes[barIndex];
            
            // Group notes by whether they're simultaneous or not
            // Sort by position in bar to ensure correct order
            const sortedNotes = [...notesInBar].sort((a, b) => {
                // If both have chordIndex, sort by it
                if (a.chordIndex !== undefined && b.chordIndex !== undefined) {
                    return a.chordIndex - b.chordIndex;
                }
                // Otherwise maintain order
                return 0;
            });

            // Process notes sequentially, grouping simultaneous ones
            let i = 0;
            while (i < sortedNotes.length) {
                const currentNote = sortedNotes[i];
                
                // Check if this note is part of a simultaneous group (chord)
                if (currentNote.simultaneous && currentNote.chordIndex !== undefined) {
                    // Collect all notes with the same chordIndex (simultaneous notes)
                    const chordNotes = [];
                    const currentChordIndex = currentNote.chordIndex;
                    while (i < sortedNotes.length &&
                           sortedNotes[i].simultaneous &&
                           sortedNotes[i].chordIndex === currentChordIndex) {
                        chordNotes.push(sortedNotes[i]);
                        i++;
                    }
                    
                    // Draw all simultaneous notes at the current beat position
                    const noteDuration = chordNotes[0]?.duration || 1;
                    const widthPercent = (noteDuration / beatsPerBar) * 100;
                    const leftPercent = (currentBeat / beatsPerBar) * 100;

                    chordNotes.forEach((note, noteIndex) => {
                        const noteEl = document.createElement('div');
                        noteEl.className = 'melody-note simultaneous-note';

                        noteEl.style.width = `calc(${widthPercent}% - 2px)`;
                        noteEl.style.left = `${leftPercent}%`;
                        noteEl.style.backgroundColor = instrumentColor;
                        noteEl.style.zIndex = '5';

                        // Position multiple notes in chord vertically stacked
                        if (chordNotes.length > 1) {
                            const noteHeight = 100 / chordNotes.length;
                            noteEl.style.top = `${noteIndex * noteHeight}%`;
                            noteEl.style.height = `${noteHeight}%`;
                            noteEl.style.fontSize = `${Math.max(0.6, 0.9 - (chordNotes.length - 1) * 0.2)}em`;
                        }

                        noteEl.textContent = note.displayName;

                        noteEl.addEventListener('click', (e) => {
                            e.stopPropagation();
                            showMelodyNoteContextMenu(e, lineId, melodyLine.id, note.id);
                        });

                        beatsContainer.appendChild(noteEl);
                    });
                    
                    // Advance currentBeat by the duration of the chord
                    currentBeat += noteDuration;
                } else {
                    // Single note (not simultaneous)
                    const note = currentNote;
                    console.log(`Drawing single note ${i + 1}:`, note);
                    const noteEl = document.createElement('div');
                    noteEl.className = 'melody-note';

                    const widthPercent = (note.duration / beatsPerBar) * 100;
                    noteEl.style.width = `calc(${widthPercent}% - 2px)`;
                    noteEl.style.left = `${(currentBeat / beatsPerBar) * 100}%`;
                    noteEl.style.backgroundColor = instrumentColor;
                    noteEl.style.zIndex = '5';

                    noteEl.textContent = note.displayName;

                    noteEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        showMelodyNoteContextMenu(e, lineId, melodyLine.id, note.id);
                    });

                    beatsContainer.appendChild(noteEl);
                    currentBeat += note.duration;
                    i++;
                }
            }
        }
    });
}
    
function showMelodyNoteContextMenu(e, lineId, melodyLineId, noteId) {
    // Remove existing menus
    document.querySelectorAll('.chord-context-menu').forEach(el => el.remove());
    
    const menu = document.createElement('div');
    menu.className = 'chord-context-menu';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;
    
    menu.innerHTML = `
        <div class="context-menu-item edit-melody-item">✏️ Rediger</div>
        <div class="context-menu-item danger delete-melody-item">🗑 Slet</div>
    `;
    
    document.body.appendChild(menu);
    
    menu.querySelector('.edit-melody-item').addEventListener('click', () => {
        editMelodyNote(lineId, melodyLineId, noteId);
        menu.remove();
    });
    
    menu.querySelector('.delete-melody-item').addEventListener('click', () => {
        deleteMelodyNote(lineId, melodyLineId, noteId);
        menu.remove();
    });
    
    // Close menu on outside click
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 0);
}

function deleteMelodyNote(lineId, melodyLineId, noteId) {
    const line = state.lines.find(l => l.id === lineId);
    const melodyLine = line?.melodyLines.find(ml => ml.id === melodyLineId);
    if (!melodyLine) return;

    const noteIndex = melodyLine.notes.findIndex(n => n.id === noteId);
    if (noteIndex > -1) {
        melodyLine.notes.splice(noteIndex, 1);
        if (typeof reRenderLine === 'function') {
            reRenderLine(lineId);
        } else {
            if (typeof updateMelodyBarDisplay === 'function') {
                updateMelodyBarDisplay(lineId);
            }
        }
    }
}
    
function playBar(lineId, barIndex) {
    const bar = state.lines[lineId].bars[barIndex];
    console.log('Playing bar', barIndex, 'from line', lineId);
    
    // Collect chords from this bar
    const chords = [];
    bar.chords.forEach(chord => {
        const chordName = `${chord.root}${chord.quality}${chord.extension}`;
        chords.push({ name: chordName, duration: chord.duration });
    });
    
    if (chords.length > 0) {
        playChordSequence(chords);
    } else {
        console.log('Bar is empty, nothing to play');
    }
}

function playLine(lineId) {
    const lineEl = document.querySelector(`[data-line-id="${lineId}"]`);
    const playBtn = lineEl?.querySelector('.play-line-btn');
    
    // Check if already playing - if so, stop
    if (window.AudioEngine && window.AudioEngine.isPlaying) {
        console.log('Stopping playback...');
        window.AudioEngine.stopSequence();
        if (playBtn) {
            playBtn.textContent = '▶ Afspil';
            playBtn.classList.remove('playing');
        }
        // Also reset the play-all button if it's playing
        const playAllBtn = document.getElementById('play-all-btn');
        if (playAllBtn) {
            playAllBtn.textContent = '▶ Afspil alt';
            playAllBtn.classList.remove('playing');
        }
        return;
    }
    
    const line = state.lines[lineId];
    console.log('Playing line', lineId, 'bars:', line.bars.length);
    const chords = processRepeats([line]);
    console.log('After processRepeats:', chords.length, 'chords');
    
    // Collect melody notes from this line
    const melodyData = collectMelodyNotes([line]);
    
    // Update button to show stop icon
    if (playBtn) {
        playBtn.textContent = '⬛ Stop';
        playBtn.classList.add('playing');
    }
    
    playChordAndMelodySequence(chords, melodyData);
}

function playAll() {
    const playBtn = document.getElementById('play-all-btn');
    
    // Check if already playing - if so, stop
    if (window.AudioEngine && window.AudioEngine.isPlaying) {
        console.log('Stopping playback...');
        window.AudioEngine.stopSequence();
        playBtn.textContent = '▶ Afspil alt';
        playBtn.classList.remove('playing');
        return;
    }
    
    console.log('Playing all lines:', state.lines.length);
    const chords = processRepeats(state.lines);
    console.log('After processRepeats:', chords.length, 'chords');
    
    // Collect melody notes from all lines
    const melodyData = collectMelodyNotes(state.lines);
    
    // Update button to show stop icon
    playBtn.textContent = '⬛ Stop';
    playBtn.classList.add('playing');
    
    playChordAndMelodySequence(chords, melodyData);
}

function collectMelodyNotes(lines) {
    const melodyData = [];
    const subdivisions = 4;
    const [beatsPerBar] = state.timeSignature.split('/').map(Number);
    
    let currentBeat = 0; // Tracks the current beat position as we build the sequence

    lines.forEach((line, lineIndex) => {
        let repeatSection = [];
        let repeatSectionStartBeat = 0;
        let inRepeat = false;

        line.bars.forEach((bar, barIndex) => {
            // Check for repeat start
            if (bar.repeatStart) {
                console.log('  >>> MELODY REPEAT START at bar', barIndex);
                inRepeat = true;
                repeatSection = [];
                repeatSectionStartBeat = currentBeat;
            }

            // Collect melody notes from this bar
            const barNotes = [];
            
            line.melodyLines.forEach(melodyLine => {
                const instrument = INSTRUMENTS[melodyLine.instrument];
                if (!instrument) return;

                const isDrumset = melodyLine.instrument === 'drumset';

                melodyLine.notes.forEach(note => {
                    // Calculate which bar this note is in
                    const colsPerBar = beatsPerBar * subdivisions;
                    const noteBarIndex = Math.floor(note.col / colsPerBar);
                    
                    if (noteBarIndex !== barIndex) return; // Not in this bar

                    // Calculate beat position within this bar
                    const colInBar = note.col % colsPerBar;
                    const beatInBar = colInBar / subdivisions;
                    const absoluteBeat = currentBeat + beatInBar;
                    const duration = note.span / subdivisions;

                    const noteData = {
                        beat: absoluteBeat,
                        duration: duration,
                        instrument: instrument.soundfont,
                        volume: melodyLine.volume || 0.7
                    };

                    // Add drum-specific or note-specific data
                    if (isDrumset && note.drumName) {
                        noteData.drumName = note.drumName;
                        noteData.midiNote = null;
                    } else {
                        noteData.midiNote = note.midiNote;
                    }

                    barNotes.push(noteData);
                });
            });

            // Add bar notes to appropriate section
            if (inRepeat) {
                console.log('  Adding', barNotes.length, 'melody notes to repeat section');
                repeatSection.push(...barNotes);
            } else {
                console.log('  Adding', barNotes.length, 'melody notes to main sequence');
                melodyData.push(...barNotes);
            }

            // Advance current beat by one bar BEFORE checking repeat end
            currentBeat += beatsPerBar;

            // Check for repeat end
            if (bar.repeatEnd) {
                console.log('  >>> MELODY REPEAT END at bar', barIndex, '- Section has', repeatSection.length, 'notes');
                // Add the repeat section first time
                console.log('  Adding melody repeat section first time');
                melodyData.push(...repeatSection);
                
                // Calculate the duration of the repeat section
                const repeatDuration = currentBeat - repeatSectionStartBeat;
                console.log('  Repeat duration:', repeatDuration, 'beats (from', repeatSectionStartBeat, 'to', currentBeat, ')');
                
                // Add the repeat section second time with offset beats
                console.log('  Adding melody repeat section second time (THE REPEAT)');
                const secondRepetition = repeatSection.map(note => ({
                    ...note,
                    beat: note.beat + repeatDuration
                }));
                melodyData.push(...secondRepetition);
                
                // Advance currentBeat by the repeat duration again (because we're playing it twice)
                currentBeat += repeatDuration;
                console.log('  Advanced currentBeat to', currentBeat, 'after repeat');
                
                inRepeat = false;
                repeatSection = [];
            }
        });

        // If there are remaining notes in repeat section (no end found)
        if (repeatSection.length > 0) {
            console.log('WARNING: Melody repeat section not closed, playing once. Section had', repeatSection.length, 'notes');
            melodyData.push(...repeatSection);
        }
    });

    console.log('=== MELODY FINAL: Total notes to play:', melodyData.length, '===');
    return melodyData;
}

function playChordAndMelodySequence(chords, melodyNotes) {
    if (window.AudioEngine) {
        // Convert to format AudioEngine expects with callbacks
        window.AudioEngine.playSequence(
            chords,
            melodyNotes,
            state.bpm,
            () => {
                // onComplete callback - reset all play buttons and hide progress
                const playAllBtn = document.getElementById('play-all-btn');
                if (playAllBtn) {
                    playAllBtn.textContent = '▶ Afspil alt';
                    playAllBtn.classList.remove('playing');
                }
                
                // Reset all line play buttons
                document.querySelectorAll('.play-line-btn').forEach(btn => {
                    btn.textContent = '▶ Afspil';
                    btn.classList.remove('playing');
                });
                
                // Hide and reset all progress lines
                document.querySelectorAll('.playback-progress').forEach(line => {
                    line.classList.remove('active');
                    line.style.left = '0%';
                });
            },
            (currentBeat) => {
                // onProgress callback - update progress line position
                updatePlaybackProgress(currentBeat);
            }
        );
    }
}

function updatePlaybackProgress(currentBeat) {
    const [beatsPerBar] = state.timeSignature.split('/').map(Number);
    const beatsPerLine = state.barsPerLine * beatsPerBar;
    
    // Build a map of beat positions accounting for repeats
    let visualBeat = 0;
    let foundPosition = false;
    let targetLineId = 0;
    let targetBeatInLine = 0;
    
    // Process through lines and bars to find visual position
    state.lines.forEach((line, lineIdx) => {
        if (foundPosition) return;
        
        let lineStartBeat = visualBeat;
        let repeatSection = null;
        let repeatStartBeat = 0;
        
        line.bars.forEach((bar, barIdx) => {
            if (foundPosition) return;
            
            // Check for repeat start
            if (bar.repeatStart) {
                repeatStartBeat = visualBeat;
                repeatSection = { startBeat: visualBeat, startBar: barIdx };
            }
            
            // Check if currentBeat falls in this bar
            const barStartBeat = visualBeat;
            const barEndBeat = visualBeat + beatsPerBar;
            
            if (currentBeat >= barStartBeat && currentBeat < barEndBeat) {
                // Current beat is in this bar
                targetLineId = lineIdx;
                targetBeatInLine = currentBeat - lineStartBeat;
                foundPosition = true;
                return;
            }
            
            // Check for repeat end
            if (bar.repeatEnd && repeatSection) {
                const repeatEndBeat = visualBeat + beatsPerBar;
                const repeatDuration = repeatEndBeat - repeatSection.startBeat;
                
                // Check if currentBeat is in the second iteration of repeat
                if (currentBeat >= repeatEndBeat && currentBeat < repeatEndBeat + repeatDuration) {
                    // We're in the second iteration - map back to first iteration visually
                    const beatInSecondIteration = currentBeat - repeatEndBeat;
                    const visualBeatInRepeat = repeatSection.startBeat + beatInSecondIteration;
                    targetLineId = lineIdx;
                    targetBeatInLine = visualBeatInRepeat - lineStartBeat;
                    foundPosition = true;
                    return;
                }
                
                // Add the repeat duration to visual beat
                visualBeat = repeatEndBeat + repeatDuration;
                repeatSection = null;
                return;
            }
            
            visualBeat += beatsPerBar;
        });
        
        if (!foundPosition) {
            visualBeat = lineStartBeat + beatsPerLine;
        }
    });
    
    // If not found, use simple calculation as fallback
    if (!foundPosition) {
        targetLineId = Math.floor(currentBeat / beatsPerLine);
        targetBeatInLine = currentBeat % beatsPerLine;
    }
    
    // Update progress line for each line
    document.querySelectorAll('.playback-progress').forEach((progressLine) => {
        const progressLineId = parseInt(progressLine.dataset.lineId);
        
        if (progressLineId === targetLineId) {
            // Show and position the progress line for the current line
            progressLine.classList.add('active');
            const percentInLine = (targetBeatInLine / beatsPerLine) * 100;
            progressLine.style.left = `${Math.min(percentInLine, 100)}%`;
        } else if (progressLineId < targetLineId) {
            // Lines already played - hide
            progressLine.classList.remove('active');
            progressLine.style.left = '100%';
        } else {
            // Lines not yet played - hide
            progressLine.classList.remove('active');
            progressLine.style.left = '0%';
        }
    });
}

function processRepeats(lines) {
    console.log('=== processRepeats called with', lines.length, 'lines ===');
    const chords = [];
    let repeatSection = [];
    let inRepeat = false;

    lines.forEach((line, lineIndex) => {

        console.log('Processing line', lineIndex, 'with', line.bars.length, 'bars');
        line.bars.forEach((bar, barIndex) => {
            console.log('  Bar', barIndex, '- repeatStart:', bar.repeatStart, 'repeatEnd:', bar.repeatEnd, 'chords:', bar.chords.length);

            // Check for repeat start
            if (bar.repeatStart) {
                console.log('  >>> REPEAT START at bar', barIndex);
                inRepeat = true;
                repeatSection = [];
            }

            // Collect chords from this bar
            const barChords = [];
            if (bar.chords.length > 0) {
                // Bar has chords
                bar.chords.forEach(chord => {
                    const chordName = `${chord.root}${chord.quality}${chord.extension}`;
                    barChords.push({ name: chordName, duration: chord.duration });
                });
            } else {
                // Empty bar - add a rest/silence with the full bar duration
                const [beatsPerBar] = state.timeSignature.split('/').map(Number);
                barChords.push({ name: null, duration: beatsPerBar, isRest: true });
            }

            console.log('  Collected', barChords.length, 'chords from this bar (including rests)');

            // Add to appropriate section
            if (inRepeat) {
                console.log('  Adding to repeat section');
                repeatSection.push(...barChords);
            } else {
                console.log('  Adding to main sequence');
                chords.push(...barChords);
            }

            // Check for repeat end
            if (bar.repeatEnd) {
                console.log('  >>> REPEAT END at bar', barIndex, '- Section has', repeatSection.length, 'chords');
                // Play the repeat section twice
                console.log('  Adding repeat section first time');
                chords.push(...repeatSection);
                console.log('  Adding repeat section second time (THE REPEAT)');
                chords.push(...repeatSection);
                inRepeat = false;
                repeatSection = [];
            }
        });
    });

    // If there are remaining chords in repeat section (no end found)
    if (repeatSection.length > 0) {
        console.log('WARNING: Repeat section not closed, playing once. Section had', repeatSection.length, 'chords');
        chords.push(...repeatSection);
    }

    console.log('=== FINAL: Total chords to play:', chords.length, '===');
    return chords;
}


function updateAllChordDisplay() {
    state.lines.forEach((line, lineId) => {
        updateBarDisplay(lineId);
    });
}


// Placeholder for audio functions (will be in audio.js)
function playChord(chordName) {
    if (window.AudioEngine) {
        window.AudioEngine.playChord(chordName);
    }
}

// Export functions (will be called from other files)
function saveMusicXML() {
    if (window.MusicXMLExporter) {
        window.MusicXMLExporter.export(state);
    }
}

function loadMusicXML(e) {
    if (window.MusicXMLExporter) {
        window.MusicXMLExporter.import(e, state, () => {
            // Rebuild UI after import
            const container = document.getElementById('song-container');
            container.innerHTML = '';
            state.lines.forEach(line => renderLine(line));

            // Update the instrument legend
            if (typeof updateInstrumentLegend === 'function') {
                updateInstrumentLegend();
            }
        });
    }
}

function exportMIDI() {
    if (window.MIDIExporter) {
        window.MIDIExporter.export(state);
    }
}

function exportSeparateMIDI() {
    if (window.MIDIExporter) {
        window.MIDIExporter.exportSeparateInstruments(state);
    }
}

function exportPDF() {
    if (window.PDFExporter) {
        window.PDFExporter.export(state);
    }
}
