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
// MusicXML Export and Import
class MusicXMLExporter {
    export(state) {
        const xml = this.generateMusicXML(state);
        this.downloadXML(xml, 'song.musicxml');
    }

    generateMusicXML(state) {
        const [beatsPerBar, beatType] = state.timeSignature.split('/').map(Number);
        
        // Collect all unique melody lines with their data
        const melodyInstruments = new Map();
        state.lines.forEach(line => {
            line.melodyLines?.forEach(ml => {
                if (!melodyInstruments.has(ml.id)) {
                    melodyInstruments.set(ml.id, {
                        id: ml.id,
                        instrument: ml.instrument,
                        name: INSTRUMENTS[ml.instrument]?.name || 'Unknown',
                        notes: ml.notes || [],
                        pitchScale: ml.pitchScale,
                        volume: ml.volume || 0.7,
                        collapsed: ml.collapsed || false
                    });
                }
            });
        });
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1">
  <work>
    <work-title>Untitled Song</work-title>
  </work>
  <identification>
    <creator type="composer">Songwriter App</creator>
    <encoding>
      <software>Songwriter Web App</software>
      <encoding-date>${new Date().toISOString().split('T')[0]}</encoding-date>
    </encoding>
    <!-- Custom data for grid-based melody system -->
    <miscellaneous>
      <miscellaneous-field name="melody-data">${this.escapeXML(JSON.stringify({
        melodyLines: state.lines.map(line => ({
          lineId: line.id,
          melodyLines: line.melodyLines || []
        }))
      }))}</miscellaneous-field>
    </miscellaneous>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>Chords</part-name>
    </score-part>
`;

        // Add a part for each melody line
        let partNum = 2;
        melodyInstruments.forEach((mlData, mlId) => {
            xml += `    <score-part id="P${partNum}">
      <part-name>${this.escapeXML(mlData.name)}</part-name>
      <score-instrument id="P${partNum}-I1">
        <instrument-name>${this.escapeXML(mlData.name)}</instrument-name>
      </score-instrument>
    </score-part>
`;
            partNum++;
        });

        xml += `  </part-list>
  <part id="P1">
`;

        // Generate measures for each line
        let measureNumber = 1;
        
        state.lines.forEach((line, lineIndex) => {
            line.bars.forEach((bar, barIndex) => {
                xml += `    <measure number="${measureNumber}">
`;
                
                // Add attributes for first measure
                if (measureNumber === 1) {
                    xml += `      <attributes>
        <divisions>4</divisions>
        <key>
          <fifths>${this.getKeyFifths(state.key)}</fifths>
          <mode>${state.scale === 'major' ? 'major' : 'minor'}</mode>
        </key>
        <time>
          <beats>${beatsPerBar}</beats>
          <beat-type>${beatType}</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
`;
                }

                // Add harmony symbols and lyrics
                if (bar.chords.length > 0) {
                    bar.chords.forEach(chord => {
                        const chordName = `${chord.root}${chord.quality}${chord.extension}`;
                        const rootStep = chord.root[0];
                        const rootAlter = chord.root.length > 1 ? (chord.root[1] === '#' ? '1' : '-1') : null;
                        
                        // Add harmony symbol
                        xml += `      <harmony>
        <root>
          <root-step>${rootStep}</root-step>
          ${rootAlter ? `<root-alter>${rootAlter}</root-alter>` : ''}
        </root>
        <kind${chord.quality || chord.extension ? ` text="${this.escapeXML(chord.quality + chord.extension)}"` : ''}>${this.getChordKind(chord.quality, chord.extension)}</kind>
      </harmony>
`;
                    });
                }
                
                // Add lyrics if available for this bar
                if (bar.lyrics) {
                    xml += `      <direction placement="below">
        <direction-type>
          <words>${this.escapeXML(bar.lyrics)}</words>
        </direction-type>
      </direction>
`;
                }

                // Add a whole rest to make the measure complete
                xml += `      <note>
        <rest measure="yes"/>
        <duration>${beatsPerBar * 4}</duration>
      </note>
`;

                xml += `    </measure>
`;
                measureNumber++;
            });
        });

        xml += `  </part>
`;

        // Generate parts for each melody line
        partNum = 2;
        melodyInstruments.forEach((mlData, mlId) => {
            xml += `  <part id="P${partNum}">
`;
            
            // Group notes by line and bar for this melody line
            const notesByLineAndBar = new Map();
            
            state.lines.forEach((line, lineIndex) => {
                const melodyLine = line.melodyLines?.find(ml => ml.id === mlId);
                if (!melodyLine || !melodyLine.notes) return;
                
                // Group notes by bar using col and subdivisions
                const subdivisions = 4;
                const colsPerBar = beatsPerBar * subdivisions;
                
                melodyLine.notes.forEach(note => {
                    const barInLine = Math.floor(note.col / colsPerBar);
                    const absoluteBar = lineIndex * state.barsPerLine + barInLine;
                    
                    if (!notesByLineAndBar.has(absoluteBar)) {
                        notesByLineAndBar.set(absoluteBar, []);
                    }
                    
                    // Calculate position within bar
                    const colInBar = note.col % colsPerBar;
                    const beatInBar = colInBar / subdivisions;
                    const noteDuration = note.span / subdivisions;
                    
                    notesByLineAndBar.get(absoluteBar).push({
                        ...note,
                        beatInBar: beatInBar,
                        duration: noteDuration
                    });
                });
            });
            
            // Generate measures for this melody part
            measureNumber = 1;
            const totalMeasures = state.lines.reduce((sum, line) => sum + line.bars.length, 0);
            
            for (let m = 0; m < totalMeasures; m++) {
                xml += `    <measure number="${measureNumber}">
`;
                
                // Add attributes for first measure
                if (measureNumber === 1) {
                    // Determine clef based on instrument
                    const clef = this.getClefForInstrument(mlData.instrument);
                    
                    xml += `      <attributes>
        <divisions>4</divisions>
        <key>
          <fifths>${this.getKeyFifths(state.key)}</fifths>
          <mode>${state.scale === 'major' ? 'major' : 'minor'}</mode>
        </key>
        <time>
          <beats>${beatsPerBar}</beats>
          <beat-type>${beatType}</beat-type>
        </time>
        <clef>
          <sign>${clef.sign}</sign>
          <line>${clef.line}</line>
        </clef>
      </attributes>
`;
                }
                
                const notesInMeasure = notesByLineAndBar.get(m) || [];
                
                if (notesInMeasure.length > 0) {
                    // Sort notes by beat position
                    notesInMeasure.sort((a, b) => a.beatInBar - b.beatInBar);
                    
                    let currentBeat = 0;
                    
                    notesInMeasure.forEach(note => {
                        // Add rest if there's a gap
                        if (note.beatInBar > currentBeat) {
                            const restDuration = Math.round((note.beatInBar - currentBeat) * 4);
                            xml += `      <note>
        <rest/>
        <duration>${restDuration}</duration>
        <type>${this.getDurationType(note.beatInBar - currentBeat, beatsPerBar)}</type>
      </note>
`;
                        }
                        
                        // Add the note
                        const noteDuration = Math.round(note.duration * 4);
                        const pitch = this.parsePitch(note.pitch || note.displayName);
                        
                        xml += `      <note>
        <pitch>
          <step>${pitch.step}</step>
          ${pitch.alter ? `<alter>${pitch.alter}</alter>` : ''}
          <octave>${pitch.octave}</octave>
        </pitch>
        <duration>${noteDuration}</duration>
        <type>${this.getDurationType(note.duration, beatsPerBar)}</type>
      </note>
`;
                        
                        currentBeat = note.beatInBar + note.duration;
                    });
                    
                    // Fill remaining beats with rest if needed
                    if (currentBeat < beatsPerBar) {
                        const remainingDuration = Math.round((beatsPerBar - currentBeat) * 4);
                        xml += `      <note>
        <rest/>
        <duration>${remainingDuration}</duration>
        <type>${this.getDurationType(beatsPerBar - currentBeat, beatsPerBar)}</type>
      </note>
`;
                    }
                } else {
                    // Empty measure - add whole rest
                    xml += `      <note>
        <rest measure="yes"/>
        <duration>${beatsPerBar * 4}</duration>
      </note>
`;
                }
                
                xml += `    </measure>
`;
                measureNumber++;
            }
            
            xml += `  </part>
`;
            partNum++;
        });

        xml += `</score-partwise>`;

        return xml;
    }

    getKeyFifths(key) {
        const fifthsMap = {
            'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5, 'F#': 6,
            'C#': 7, 'F': -1, 'Bb': -2, 'Eb': -3, 'Ab': -4, 'Db': -5, 'Gb': -6
        };
        return fifthsMap[key] || 0;
    }
    
    getClefForInstrument(instrumentKey) {
        // Drumset uses percussion clef
        if (instrumentKey === 'drumset') {
            return { sign: 'percussion', line: 2 };
        }
        
        // Bass instruments use F clef (bass clef)
        const bassInstruments = ['acoustic_bass', 'electric_bass', 'synth_bass'];
        
        if (bassInstruments.includes(instrumentKey)) {
            return { sign: 'F', line: 4 };
        }
        
        // Most other instruments use G clef (treble clef)
        return { sign: 'G', line: 2 };
    }
    
    getChordKind(quality, extension) {
        // Convert chord quality and extension to MusicXML kind
        // Reference: https://www.musicxml.com/for-developers/musicxml-dtd/direction-elements/harmony-elements/
        
        if (quality === 'm' || quality === 'min') {
            if (extension === '7') return 'minor-seventh';
            if (extension === 'maj7') return 'minor-major-seventh';
            return 'minor';
        }
        
        if (quality === 'dim') {
            if (extension === '7') return 'diminished-seventh';
            return 'diminished';
        }
        
        if (quality === 'aug') {
            return 'augmented';
        }
        
        // Major chords
        if (extension === '7') return 'dominant';
        if (extension === 'maj7') return 'major-seventh';
        if (extension === '9') return 'dominant-ninth';
        if (extension === '11') return 'dominant-11th';
        if (extension === '13') return 'dominant-13th';
        if (extension === 'sus2') return 'suspended-second';
        if (extension === 'sus4') return 'suspended-fourth';
        
        // Default to major
        return 'major';
    }

    getDurationType(duration, beatsPerBar) {
        if (duration >= beatsPerBar) return 'whole';
        if (duration >= beatsPerBar / 2) return 'half';
        if (duration >= 1) return 'quarter';
        if (duration >= 0.5) return 'eighth';
        if (duration >= 0.25) return '16th';
        return '16th';
    }
    
    parsePitch(pitchString) {
        // Parse pitch like "C4", "F#5", "Bb3"
        // For drum names (Kick, Snare, etc), return a placeholder pitch
        const match = pitchString.match(/^([A-G])([#b]?)(\d+)$/);
        if (!match) {
            // If it's a drum name or invalid pitch, return placeholder
            return { step: 'C', alter: null, octave: 4, isDrum: true };
        }
        
        const [, step, accidental, octave] = match;
        let alter = null;
        
        if (accidental === '#') {
            alter = '1';
        } else if (accidental === 'b') {
            alter = '-1';
        }
        
        return { step, alter, octave: parseInt(octave), isDrum: false };
    }

    escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    downloadXML(xml, filename) {
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    import(event, state, callback) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xml = e.target.result;
                this.parseMusicXML(xml, state);
                if (callback) callback();
                alert('Sang indlæst succesfuldt!');
            } catch (error) {
                console.error('Error parsing MusicXML:', error);
                alert('Fejl ved indlæsning af fil');
            }
        };
        reader.readAsText(file);
    }

    parseMusicXML(xmlString, state) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

        // Parse key and time signature
        const key = xmlDoc.querySelector('key fifths');
        if (key) {
            const fifths = parseInt(key.textContent);
            state.key = this.getFifthsKey(fifths);
        }

        const mode = xmlDoc.querySelector('key mode');
        if (mode) {
            state.scale = mode.textContent === 'major' ? 'major' : 'minor';
        }

        const timeBeats = xmlDoc.querySelector('time beats');
        const timeBeatType = xmlDoc.querySelector('time beat-type');
        if (timeBeats && timeBeatType) {
            state.timeSignature = `${timeBeats.textContent}/${timeBeatType.textContent}`;
        }

        // Clear existing lines
        state.lines = [];

        // Parse measures
        const measures = xmlDoc.querySelectorAll('measure');
        let currentLine = null;
        let barInLine = 0;

        measures.forEach((measure, index) => {
            if (barInLine === 0) {
                currentLine = {
                    id: state.lines.length,
                    bars: [],
                    lyrics: '',
                    melodyLines: [] // Initialize empty
                };
                state.lines.push(currentLine);
            }

            // Parse bar
            const bar = { chords: [], lyrics: '', repeatStart: false, repeatEnd: false };
            
            // Get lyrics for each bar
            const words = measure.querySelector('words');
            if (words) {
                bar.lyrics = words.textContent;
            }

            // Parse notes
            const notes = measure.querySelectorAll('note');
            notes.forEach(note => {
                const rest = note.querySelector('rest');
                if (rest) return; // Skip rests

                const duration = note.querySelector('duration');
                if (!duration) return;

                // Try to get custom chord data from lyric field
                const lyric = note.querySelector('lyric text');
                if (lyric) {
                    try {
                        const chordData = JSON.parse(lyric.textContent);
                        const [beatsPerBar] = state.timeSignature.split('/').map(Number);
                        const chordDuration = parseInt(duration.textContent) / 4;

                        bar.chords.push({
                            root: chordData.root,
                            quality: chordData.quality || '',
                            extension: chordData.extension || '',
                            duration: chordDuration,
                            degree: chordData.degree || 0,
                            color: chordData.color
                        });
                    } catch (e) {
                        // Fallback to old parsing if JSON fails
                        const pitch = note.querySelector('pitch step');
                        const alter = note.querySelector('pitch alter');
                        const harmonic = note.querySelector('harmonic');
                        
                        if (pitch) {
                            let root = pitch.textContent;
                            if (alter) {
                                root += alter.textContent === '1' ? '#' : 'b';
                            }

                            let quality = '';
                            let extension = '';
                            
                            if (harmonic) {
                                const chordName = harmonic.textContent;
                                const parsed = this.parseChordName(chordName);
                                quality = parsed.quality;
                                extension = parsed.extension;
                            }

                            const [beatsPerBar] = state.timeSignature.split('/').map(Number);
                            const chordDuration = parseInt(duration.textContent) / 4;

                            bar.chords.push({
                                root,
                                quality,
                                extension,
                                duration: chordDuration,
                                degree: 0
                            });
                        }
                    }
                }
            });

            currentLine.bars.push(bar);
            barInLine++;

            if (barInLine >= state.barsPerLine) {
                barInLine = 0;
            }
        });

        // Parse custom melody data from miscellaneous field
        const melodyDataField = xmlDoc.querySelector('miscellaneous-field[name="melody-data"]');
        if (melodyDataField) {
            try {
                const melodyData = JSON.parse(melodyDataField.textContent);
                
                // Restore melody lines to their respective song lines
                melodyData.melodyLines.forEach(lineData => {
                    const line = state.lines[lineData.lineId];
                    if (line && lineData.melodyLines) {
                        line.melodyLines = lineData.melodyLines;
                        
                        // Update melodyLineCounter to ensure new lines get unique IDs
                        lineData.melodyLines.forEach(ml => {
                            const idNum = parseInt(ml.id.substring(1));
                            if (!isNaN(idNum) && idNum >= state.melodyLineCounter) {
                                state.melodyLineCounter = idNum + 1;
                            }
                        });
                    }
                });
            } catch (e) {
                console.error('Error parsing melody data:', e);
            }
        }

        // Update UI controls
        document.getElementById('key-select').value = state.key;
        document.getElementById('scale-select').value = state.scale;
        document.getElementById('time-signature').value = state.timeSignature;
    }

    getFifthsKey(fifths) {
        const keyMap = {
            0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#',
            7: 'C#', '-1': 'F', '-2': 'A#', '-3': 'D#', '-4': 'G#', '-5': 'C#', '-6': 'F#'
        };
        return keyMap[fifths] || 'C';
    }

    parseChordName(chordName) {
        let root = chordName[0];
        let index = 1;
        
        if (chordName[1] === '#' || chordName[1] === 'b') {
            root += chordName[1];
            index = 2;
        }

        const rest = chordName.substring(index);
        
        // Parse quality and extension
        let quality = '';
        let extension = '';
        
        if (rest.includes('m')) {
            quality = 'm';
        } else if (rest.includes('dim')) {
            quality = 'dim';
        } else if (rest.includes('aug')) {
            quality = 'aug';
        }
        
        extension = rest.replace('m', '').replace('dim', '').replace('aug', '');
        
        return { quality, extension };
    }
}

// Create global instance
window.MusicXMLExporter = new MusicXMLExporter();