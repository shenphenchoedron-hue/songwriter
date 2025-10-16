# Guide til at Udgive en Ny Version af Songwriter på GitHub

## Metode 1: Brug VSCode's Git Interface (Anbefalet)

### Trin 1: Commit Dine Ændringer i VSCode

1. **Åbn Source Control panelet**:
   - Tryk `Cmd+Shift+G` (Mac) eller `Ctrl+Shift+G` (Windows/Linux)
   - Eller klik på Source Control ikonet i venstre sidebar (forgrenet ikon)

2. **Stage alle ændringer**:
   - Klik på `+` ikonet ved siden af "Changes" for at stage alle filer
   - Eller hover over individuelle filer og klik `+` for kun at stage dem

3. **Skriv commit besked**:
   I "Message" boksen øverst, skriv:
   ```
   Version 1.1.0 - Vigtige rettelser:
   - Melodilinjer gentages nu korrekt med gentagelsestegn
   - Play/Stop toggle funktionalitet på afspil-knapper
   - Rød progressionsstreg viser afspilningsposition
   - MusicXML gem/load inkluderer nu alle data
   - Tomme bars forbliver tomme og påvirker ikke timing
   ```

4. **Commit**:
   - Klik på "✓ Commit" knappen (eller tryk `Cmd+Enter` / `Ctrl+Enter`)

5. **Push til GitHub**:
   - Klik på "Sync Changes" knappen der dukker op
   - Eller klik på de tre prikker `...` → "Push"

### Trin 2: Opret Version Tag i VSCode

1. **Åbn Command Palette**:
   - Tryk `Cmd+Shift+P` (Mac) eller `Ctrl+Shift+P` (Windows/Linux)

2. **Søg efter "Git: Create Tag"**:
   - Skriv "create tag" og vælg "Git: Create Tag..."

3. **Indtast tag navn**:
   - Skriv: `v1.1.0`
   - Tryk Enter

4. **Push tagget**:
   - Åbn Command Palette igen (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Søg efter "Git: Push Tags"
   - Vælg "Git: Push Tags"
   - Eller brug terminalen i VSCode: `git push origin v1.1.0`

## Metode 2: Brug VSCode's Integrerede Terminal

Åbn terminalen i VSCode (`Ctrl+` ` eller View → Terminal) og kør:

```bash
# Tilføj alle ændrede filer
git add .

# Commit med en beskrivelse af ændringerne
git commit -m "Version 1.1.0 - Vigtige rettelser"

# Push til GitHub
git push origin main

# Opret og push tag
git tag v1.1.0
git push origin v1.1.0
```

## Trin 3: GitHub Actions Bygger Automatisk

Når du har pushed tagget `v1.1.0`, vil GitHub Actions automatisk:

1. **Bygge executables** for:
   - macOS (Apple Silicon - aarch64)
   - macOS (Intel - x86_64)
   - Linux (Ubuntu)
   - Windows

2. **Oprette en Draft Release** på GitHub med navnet "Songwriter v1.1.0"

3. **Uploade alle executables** til release'n som assets

## Trin 4: Publicer Release'n på GitHub

1. Gå til dit GitHub repository
2. Klik på "Releases" i højre sidebar
3. Du vil se en **Draft Release** for v1.1.0
4. Klik på "Edit"
5. Gennemse release notes og executables
6. Klik på "Publish release"

## Alternativ: Manuel Trigger af Workflow

Hvis du ikke vil bruge tags, kan du også manuelt trigge workflow'en:

1. Gå til dit GitHub repository
2. Klik på "Actions" tab
3. Vælg "Release" workflow i venstre sidebar
4. Klik på "Run workflow" knappen
5. Vælg branch (main) og klik "Run workflow"

## Download Executables

Efter release er publiceret, kan brugere downloade:
- **macOS**: `.dmg` fil
- **Linux**: `.AppImage` eller `.deb` fil
- **Windows**: `.msi` installer

## Troubleshooting

Hvis build fejler:
1. Tjek "Actions" tab på GitHub for fejlmeddelelser
2. Sørg for at alle filer er committed korrekt
3. Verificer at `dist` mappen oprettes korrekt med alle nødvendige filer

## Hurtig Kommando-Reference

```bash
# Alt i én kommando serie:
git add .
git commit -m "Version 1.1.0 - Vigtige opdateringer"
git push origin main
git tag v1.1.0
git push origin v1.1.0
```

Efter dette, vent ~10-20 minutter mens GitHub Actions bygger dine executables.