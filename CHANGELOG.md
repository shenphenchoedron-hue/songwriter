# Changelog - Songwriter

## Version 1.1.1 (2025-10-16)

### Rettelser
- **Progressionsstreg ved gentagelser**: Den røde progressionsstreg går nu korrekt tilbage til starten af en gentagelsessektion når den spilles anden gang

---

## Version 1.1.0 (2025-10-16)

### Rettelser
- **Gentagelser for melodilinjer**: Melodilinjer gentages nu korrekt når der bruges gentagelsestegn (`|:` og `:|`) på akkordlinjen
- **Tomme bars**: Tomme akkord-bars forbliver nu tomme og forskyder ikke efterfølgende akkorder eller melodier
- **Stop-funktionalitet**: Forbedret stop-funktion der korrekt stopper både soundfont-instrumenter og Tone.js lyde

### Nye Funktioner
- **Play/Stop toggle**: "Afspil alt" og "Afspil linje" knapper fungerer nu som toggle - klik igen for at stoppe afspilningen
- **Progressionsstreg**: Rød lodret streg viser hvor du er i afspilningen på akkordlinjerne, hopper automatisk til næste linje
- **Forbedret MusicXML**: Gem og load funktionalitet inkluderer nu alle data (akkorder, gentagelser, melodier, tekster, indstillinger)

### Tekniske Forbedringer
- Opdateret `collectMelodyNotes()` til at håndtere gentagelser korrekt
- Opdateret `processRepeats()` til at tilføje pauser for tomme bars
- Tilføjet `onProgress` callback til `AudioEngine.playSequence()` for progressionsstreg
- Forbedret `stopSequence()` til at stoppe alle instrumenter og Tone.js transport
- MusicXML eksport gemmer nu komplet state i `song-data` felt
- MusicXML import gendanner alle indstillinger korrekt

---

## Version 1.0.0 (Initial Release)

### Funktioner
- Akkordprogression builder med Circle of Fifths
- Melodilinjer med grid-baseret node-system
- Flere instrumenter (guitar, klaver, bas, trommer, etc.)
- MusicXML, MIDI og PDF eksport
- Gentagelsestegn support
- Tempo og takt-indstillinger
- Volumenkontrol per instrument