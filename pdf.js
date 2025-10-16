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
// PDF Export using browser print functionality
class PDFExporter {
    export(state) {
        // Create a print-friendly version of the song
        const printWindow = window.open('', '_blank');
        const html = this.generatePrintHTML(state);
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load, then print
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    generatePrintHTML(state) {
        const [beatsPerBar] = state.timeSignature.split('/').map(Number);
        
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Song - Print</title>
    <style>
        @page {
            size: A4;
            margin: 20mm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            color: #000;
            background: white;
            margin: 0;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 24pt;
        }
        
        .header .metadata {
            margin-top: 10px;
            font-size: 11pt;
            color: #666;
        }
        
        .song-line {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .line-number {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 10pt;
            color: #666;
        }
        
        .bars-row {
            display: flex;
            min-height: 50px;
            margin-bottom: 5px;
            position: relative;
        }
        
        .bar {
            flex: 1;
            border-left: 2px solid #000;
            padding: 5px 10px;
            position: relative;
            min-height: 40px;
        }
        
        .bar:first-child {
            border-left: 3px solid #000;
        }
        
        .bar:last-child {
            border-right: 3px solid #000;
        }
        
        .bar.repeat-start {
            border-left: 4px double #000;
        }
        
        .bar.repeat-end {
            border-right: 4px double #000;
        }
        
        .repeat-dots {
            position: absolute;
            top: 15px;
            display: block !important;
            width: 8px;
        }
        
        .repeat-dots-start {
            left: 5px;
        }
        
        .repeat-dots-end {
            right: 5px;
        }
        
        .repeat-dots .dot {
            width: 6px;
            height: 6px;
            background: #000;
            border-radius: 50%;
            margin: 4px 0;
            display: block;
        }
        
        .lyrics-row {
            display: flex;
        }
        
        .lyrics-cell {
            flex: 1;
            font-size: 11pt;
            font-style: italic;
            color: #333;
            text-align: center;
            padding: 5px;
        }
        
        .chord-line {
            position: relative;
            min-height: 25px;
            padding-top: 3px;
        }
        
        .chord {
            position: absolute;
            font-weight: bold;
            font-size: 14pt;
            white-space: nowrap;
            top: 0;
        }
        
        .beat-marker {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 1px;
            background: #999;
            opacity: 0.3;
        }
        
        .lyrics-row {
            display: flex;
            margin-top: 10px;
        }
        
        .lyrics-cell {
            flex: 1;
            font-size: 11pt;
            font-style: italic;
            color: #333;
            min-height: 20px;
            padding: 5px;
            text-align: center;
        }
        
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9pt;
            color: #999;
            padding: 10px;
            border-top: 1px solid #ccc;
        }
        
        @media print {
            body {
                padding: 0;
            }
            
            .no-print {
                display: none;
            }
            
            /* Force repeat marks to be visible */
            .repeat-dots,
            .repeat-dots .dot {
                display: block !important;
                visibility: visible !important;
            }
            
            .bar.repeat-start {
                border-left: 4px double #000 !important;
            }
            
            .bar.repeat-end {
                border-right: 4px double #000 !important;
            }
        }
        
        /* Ensure dots are always visible */
        .repeat-dots {
            z-index: 100;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎵 Sang</h1>
        <div class="metadata">
            Toneart: ${state.key} ${state.scale === 'major' ? 'Dur' : 'Mol'} | 
            Takt: ${state.timeSignature} | 
            Oprettet: ${new Date().toLocaleDateString('da-DK')}
        </div>
    </div>
    
    <div class="song-content">
`;

        // Generate each line
        state.lines.forEach((line, lineIndex) => {
            html += `
        <div class="song-line">
            <div class="line-number">Linje ${lineIndex + 1}</div>
            <div class="bars-row">
`;

            // Generate bars with positioned chords
            line.bars.forEach((bar, barIndex) => {
                const repeatStartClass = bar.repeatStart ? ' repeat-start' : '';
                const repeatEndClass = bar.repeatEnd ? ' repeat-end' : '';
                
                console.log('PDF Bar', barIndex, 'repeatStart:', bar.repeatStart, 'repeatEnd:', bar.repeatEnd);
                
                html += `
                <div class="bar${repeatStartClass}${repeatEndClass}">
`;
                
                // Add repeat start dots
                if (bar.repeatStart) {
                    html += `<div class="repeat-dots repeat-dots-start"><div class="dot"></div><div class="dot"></div></div>`;
                }
                
                // Add repeat end dots
                if (bar.repeatEnd) {
                    html += `<div class="repeat-dots repeat-dots-end"><div class="dot"></div><div class="dot"></div></div>`;
                }
                
                html += `<div class="chord-line">
`;

                // Add chords positioned based on their beat position
                let currentBeat = 0;
                if (bar.chords.length > 0) {
                    bar.chords.forEach(chord => {
                        const chordName = `${chord.root}${chord.quality}${chord.extension}`;
                        const position = (currentBeat / beatsPerBar) * 100;
                        
                        html += `
                        <span class="chord" style="left: ${position}%;">
                            ${chordName}
                        </span>
`;
                        currentBeat += chord.duration;
                    });
                }

                html += `
                    </div>
`;

                // Add beat markers (subtle vertical lines inside chord-line)
                for (let i = 1; i < beatsPerBar; i++) {
                    const position = (i / beatsPerBar) * 100;
                    html += `<div class="beat-marker" style="left: ${position}%;"></div>`;
                }

                html += `
                </div>
`;
            });

            html += `
            </div>
            <div class="lyrics-row">
`;
            
            // Add lyrics for each bar
            line.bars.forEach((bar) => {
                html += `<div class="lyrics-cell">${bar.lyrics || '&nbsp;'}</div>`;
            });
            
            html += `
            </div>
        </div>
`;
        });

        html += `
    </div>
    
    <div class="footer">
        Genereret af Songwriter Web App - ${new Date().toLocaleString('da-DK')}
    </div>
</body>
</html>
`;

        return html;
    }

    // Alternative: Export as data URL for download
    exportAsDataURL(state) {
        const html = this.generatePrintHTML(state);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'song.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Create global instance
window.PDFExporter = new PDFExporter();