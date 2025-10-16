# 📚 GitHub & VSCode Guide - For Begyndere

En komplet guide til at bruge Git, GitHub og VSCode sammen med dit Songwriter projekt.

---

## 📖 Indholdsfortegnelse

1. [Hvad Er Git og GitHub?](#hvad-er-git-og-github)
2. [Daglig Workflow](#daglig-workflow)
3. [Arbejd Fra Flere Computere](#arbejd-fra-flere-computere)
4. [Lav En Ny Release](#lav-en-ny-release)
5. [Almindelige Situationer](#almindelige-situationer)
6. [VSCode Git Knapper](#vscode-git-knapper)
7. [Terminal Kommandoer (Reference)](#terminal-kommandoer-reference)

---

## 🎯 Hvad Er Git og GitHub?

### Git (Lokal Version Kontrol)
**Tænk på det som:** "Undo/Redo for hele dit projekt"

- 📸 Gem snapshots (commits) af din kode
- 🔄 Gå tilbage til tidligere versioner
- 📊 Se hvad der ændrede sig
- 💾 Arbejd offline

### GitHub (Cloud Backup & Deling)
**Tænk på det som:** "Dropbox for programmører + Gratis Build-Servere"

- ☁️ Backup af din kode i skyen
- 🔄 Sync mellem flere computere
- 🌍 Del med andre
- 🤖 Automatiske builds (Windows, macOS, Linux)

---

## 🔄 Daglig Workflow

### 📝 Når Du Arbejder Med Kode:

#### 1. Åbn VSCode
```
Cmd + Shift + G  (Åbn Source Control)
```

#### 2. Lav Dine Ændringer
- Rediger filer som normalt
- VSCode markerer ændrede filer automatisk

#### 3. Se Ændringer
**Source Control panel viser:**
- 📄 Ændrede filer (med M for Modified)
- ➕ Nye filer (med U for Untracked)
- ➖ Slettede filer (med D for Deleted)

#### 4. Commit (Gem Snapshot)
```
1. Skriv besked i "Message" feltet:
   "Tilføjede ny feature" eller "Rettede bug i audio.js"

2. Klik ✓ Commit knappen

3. Hvis den spørger "Stage changes?":
   → Klik "Yes" eller "Always"
```

#### 5. Push (Upload Til GitHub)
```
Klik ↑ knappen (Sync Changes)
eller
Klik "..." → Push
```

**Færdig! Dine ændringer er nu på GitHub!** ✅

---

## 🏢 Arbejd Fra Flere Computere

### 🏠 Setup På Arbejds-Computer (Første Gang):

#### 1. Installer Node.js, Rust, Git
- Samme proces som på din Mac

#### 2. Clone Projektet
**Terminal:**
```bash
cd ~/Documents
git clone https://github.com/shenphenchoedron-hue/songwriter.git
cd songwriter
```

**Eller i VSCode:**
```
Cmd + Shift + P
→ Git: Clone
→ Indtast: https://github.com/shenphenchoedron-hue/songwriter.git
→ Vælg mappe
```

#### 3. Åbn Projektet
```bash
code .
```

✅ **Du har nu samme projekt på arbejdet!**

---

### 🔄 Daglig Sync Mellem Computere:

#### Morgen På Arbejdet:
```
1. Åbn VSCode
2. Source Control → Pull (↓ knap)
3. ✅ Får ændringer fra hjemme
4. Start arbejde
```

#### Slut På Arbejdet:
```
1. Commit dine ændringer
2. Push (↑ knap)
3. ✅ Ændringer uploaded til GitHub
```

#### Aften Hjemme:
```
1. Åbn VSCode
2. Pull (↓ knap)
3. ✅ Får ændringer fra arbejdet
4. Fortsæt arbejde
```

**Altid Pull først, Push til sidst!** 📤📥

---

## 🚀 Lav En Ny Release (Auto-Build Til Alle Platforme)

### Når Du Vil Udgive En Ny Version:

#### 1. Commit Alle Ændringer
```
Source Control → Commit → Push
```

#### 2. Opret Tag (Version)
**Terminal:**
```bash
git tag -a v1.1.0 -m "Beskrivelse af hvad der er nyt"
git push origin v1.1.0
```

**Eller i VSCode:**
```
Source Control → "..." menu → Create Tag
→ Indtast: v1.1.0
→ Push tag
```

#### 3. GitHub Actions Bygger Automatisk!
```
GitHub kører automatisk builds til:
- Windows (.exe, .msi)
- macOS (.dmg - Apple Silicon + Intel)
- Linux (.deb, .AppImage)

Tid: ~15-20 minutter
```

#### 4. Download Installere
```
GitHub → Releases tab
→ Find v1.1.0
→ Download assets (6 filer)
```

---

## 🆘 Almindelige Situationer

### ⚠️ "Your branch is behind 'origin/main'"

**Hvad betyder det?**
- GitHub har nyere ændringer end din lokale kode
- Nogen (måske dig fra arbejdet) har pushed nye ændringer

**Løsning:**
```
1. Source Control → Pull (↓)
2. VSCode henter nye ændringer
3. ✅ Nu er du up to date
4. Fortsæt arbejde
```

---

### ⚠️ "Your branch is ahead of 'origin/main'"

**Hvad betyder det?**
- Du har commits lokalt som ikke er uploaded

**Løsning:**
```
1. Source Control → Push (↑)
2. ✅ Commits uploaded til GitHub
```

---

### ⚠️ Merge Conflict

**Hvad betyder det?**
- Du og arbejds-computeren ændrede samme linje
- Git ved ikke hvilken version der er korrekt

**Løsning:**
```
1. VSCode viser konflikt markeret
2. Vælg "Accept Current" eller "Accept Incoming"
3. Eller rediger manuelt
4. Commit løsningen
5. Push
```

**Tip:** Pull altid FØR du starter arbejde - undgår de fleste konflikter!

---

### 📴 Arbejd Offline

**Scenario:** Ingen internet

**Du kan STADIG:**
```
1. Åbn VSCode ✅
2. Lav ændringer ✅
3. Commit ✅ (gemmes lokalt)
4. Push ❌ (kræver internet)
```

**Når internet er tilbage:**
```
1. Push alle commits sammen
2. ✅ Synkroniseret!
```

---

## 🎨 VSCode Git Knapper (Visuel Guide)

### Source Control Panel Layout:
```
┌─────────────────────────────────────────┐
│ SOURCE CONTROL                          │
├─────────────────────────────────────────┤
│ [Message feld]                          │
│ Beskrivelse af ændringer...             │
├─────────────────────────────────────────┤
│ [✓ Commit]  [↑ Push]  [↓ Pull]  [...]  │
│   ↑           ↑         ↑         ↑     │
│   Gem       Upload   Download   Mere    │
├─────────────────────────────────────────┤
│ Changes (5)                             │
│   M  app.js                             │
│   M  audio.js                           │
│   U  newfile.js                         │
└─────────────────────────────────────────┘
```

### Fil Status Ikoner:
- **M** = Modified (ændret)
- **U** = Untracked (ny fil)
- **D** = Deleted (slettet)
- **C** = Conflict (konflikt)

---

## 🔧 Terminal Kommandoer (Reference)

### Grundlæggende Git Kommandoer:

#### Se Status:
```bash
git status
```

#### Pull (Download):
```bash
git pull
```

#### Add Filer:
```bash
git add .                    # Alle filer
git add app.js              # Specifik fil
```

#### Commit:
```bash
git commit -m "Din besked her"
```

#### Push (Upload):
```bash
git push
```

#### Se Commits:
```bash
git log                      # Alle commits
git log --oneline           # Kort format
```

---

### Release Tags:

#### Opret Tag:
```bash
git tag -a v1.1.0 -m "Release beskrivelse"
```

#### Push Tag:
```bash
git push origin v1.1.0
```

#### Se Alle Tags:
```bash
git tag
```

#### Slet Tag (Lokalt):
```bash
git tag -d v1.1.0
```

---

## 📦 Build & Release Process

### Lokal Build (Kun macOS):
```bash
npm run build
```
Output: `src-tauri/target/release/bundle/`

### Cross-Platform Build (Alle Platforme):

#### 1. Tag En Version:
```bash
git tag -a v1.0.0 -m "First release"
git push origin v1.0.0
```

#### 2. GitHub Actions Bygger Automatisk
- Gå til: https://github.com/DIT-BRUGERNAVN/songwriter/actions
- Se progress (~15-20 min)

#### 3. Download Fra Releases:
- Gå til: https://github.com/DIT-BRUGERNAVN/songwriter/releases
- Find v1.0.0
- Download assets

---

## 🎯 Quick Reference

### Daglig Workflow:
```
1. Pull (↓)     ← Start af dagen
2. Arbejd       ← Lav ændringer
3. Commit (✓)   ← Gem snapshot
4. Push (↑)     ← Upload til GitHub
```

### Mellem Computere:
```
Hjemme:  Commit → Push
           ↓
        GitHub
           ↓
Arbejde: Pull → Arbejd → Commit → Push
           ↓
        GitHub
           ↓
Hjemme:  Pull → Fortsæt
```

### Ny Release:
```
1. Commit + Push alle ændringer
2. git tag -a v1.x.x -m "Beskrivelse"
3. git push origin v1.x.x
4. Vent på GitHub Actions
5. Download fra Releases
```

---

## 💡 Tips & Tricks

### ✅ Best Practices:

1. **Commit ofte** - Små, hyppige commits er bedre end store
2. **Beskrivende beskeder** - "Tilføjede MIDI export" i stedet for "Update"
3. **Pull først** - Altid pull før du starter arbejde
4. **Push ved dag-slut** - Del dine ændringer
5. **Test før release** - Kør `npm run dev` før tag

### 🎨 Commit Besked Eksempler:

**Gode beskeder:**
- ✅ "Tilføjede auto-load for drum samples"
- ✅ "Rettede volume mute bug"
- ✅ "Opdaterede README med nye instruktioner"

**Dårlige beskeder:**
- ❌ "update"
- ❌ "fix"
- ❌ "changes"

### 🔍 Se Ændringer Før Commit:

**I Source Control:**
- Klik på en fil
- VSCode viser diff (før/efter)
- Rød = slettet
- Grøn = tilføjet

---

## 🌐 GitHub Web Interface

### Vigtige Sider:

**Main Page:**
```
https://github.com/shenphenchoedron-hue/songwriter
→ Se kode, README, commits
```

**Actions (Build Status):**
```
https://github.com/shenphenchoedron-hue/songwriter/actions
→ Se GitHub Actions builds køre
```

**Releases (Downloads):**
```
https://github.com/shenphenchoedron-hue/songwriter/releases
→ Download installere for alle platforme
```

**Issues (Bug Reports):**
```
https://github.com/shenphenchoedron-hue/songwriter/issues
→ Track bugs og feature requests
```

---

## 🆘 Hjælp & Support

### Hvis Git/GitHub Problemer:

**Check Status:**
```bash
git status
```

**Force Pull (Hvis Stuck):**
```bash
git fetch origin
git reset --hard origin/main
```
⚠️ **Advarsel:** Mister lokale uncommitted ændringer!

### Hvis VSCode Git Ikke Virker:

**Genstart VSCode:**
```
Cmd + Q → Genåbn VSCode
```

**Check Git Er Installeret:**
```bash
git --version
```

**Check Git Config:**
```bash
git config --global user.name
git config --global user.email
```

---

## 📱 VSCode Extensions (Valgfri Men Nyttige)

### Anbefalede Extensions:

1. **GitLens** - Avanceret Git visualization
   - Se hvem ændrede hvilken linje
   - Git blame annotations
   - File history

2. **GitHub Pull Requests** - GitHub integration
   - Se issues direkte i VSCode
   - Review pull requests

**Installer:**
```
Cmd + Shift + X → Søg "GitLens" → Install
```

---

## 🎓 Git Terminologi (Ordbog)

| Term | Dansk | Forklaring |
|------|-------|------------|
| **Repository** | Depot | Din projekt-mappe (lokal eller på GitHub) |
| **Commit** | Gem snapshot | Et gemt øjebliksbillede af koden |
| **Push** | Upload | Send commits til GitHub |
| **Pull** | Download | Hent commits fra GitHub |
| **Clone** | Kopier | Download projekt første gang |
| **Branch** | Gren | Parallel version af koden |
| **Merge** | Flet | Sammenflet to versioner |
| **Tag** | Mærkat | Version nummer (v1.0.0) |
| **Remote** | Fjern | GitHub serveren |
| **Origin** | Oprindelse | Standard navn for remote |

---

## 🚀 Avancerede Kommandoer (Når Du Er Klar)

### Branching (Arbejdsgrene):

**Opret ny branch:**
```bash
git checkout -b feature-name
```

**Skift branch:**
```bash
git checkout main
```

**Merge branch:**
```bash
git checkout main
git merge feature-name
```

### Undo Ændringer:

**Før commit:**
```bash
git restore app.js          # Discard ændringer i én fil
git restore .               # Discard alle ændringer
```

**Efter commit (lokalt):**
```bash
git reset HEAD~1            # Undo sidste commit (behold ændringer)
git reset --hard HEAD~1     # Undo sidste commit (slet ændringer)
```

⚠️ **Aldrig reset efter push! Andre kan have hentet din kode!**

---

## 📊 GitHub Actions Workflow

### Hvordan Det Virker:

**Din Workflow Fil:** `.github/workflows/release.yml`

**Trigger:**
- Når du pusher et tag (v1.0.0, v1.1.0, etc.)
- Eller manuelt via GitHub web

**Hvad Den Gør:**
1. Checker din kode ud
2. Installer Node + Rust på 3 platforme (parallelt):
   - macOS runner → Bygger macOS apps
   - Windows runner → Bygger Windows apps  
   - Linux runner → Bygger Linux apps
3. Kopierer filer til `dist/`
4. Kører Tauri build
5. Uploader installere til GitHub Releases

**Gratis tier:** 2000 minutter/måned (nok til mange releases!)

---

## 💬 Spørgsmål & Svar

### Q: Hvad hvis jeg laver en fejl?
**A:** Git gør det nemt at rulle tilbage:
```bash
git log                    # Find commit ID
git checkout COMMIT-ID     # Gå tilbage
```

### Q: Kan andre se min kode?
**A:** Ja, det er et public repository (open source). Det er godt!
- Andre kan rapportere bugs
- Andre kan bidrage
- Din GPL-3.0 license beskytter dig

### Q: Hvad hvis GitHub er nede?
**A:** Du kan arbejde normalt offline:
- Commit lokalt
- Push når GitHub er oppe igen

### Q: Kan jeg slette noget fra GitHub?
**A:** Ja, men version history bevares altid.
- Slet filer → Commit → Push
- Filen forsvinder, men findes i historikken

### Q: Koster GitHub noget?
**A:** NEJ! Gratis for:
- Public repositories
- GitHub Actions (2000 min/måned)
- Unlimited storage for kode

---

## 🎯 Cheat Sheet (Print Denne!)

### Oftest Brugte Kommandoer:

```bash
# Check status
git status

# Pull (start of dag)
git pull

# Add filer
git add .

# Commit
git commit -m "Beskrivelse"

# Push (slut of dag)
git push

# Ny release
git tag -a v1.x.x -m "Release notes"
git push origin v1.x.x

# Se log
git log --oneline

# Discard ændringer
git restore .
```

### VSCode Shortcuts:

```
Cmd + Shift + G    → Source Control
Cmd + Shift + P    → Command Palette
Cmd + `            → Terminal
```

---

## 📞 Hvor Får Du Hjælp?

### Dokumentation:
- Git: https://git-scm.com/doc
- GitHub: https://docs.github.com
- Tauri: https://tauri.app/v2/guides

### Community:
- GitHub Discussions: På dit repository
- Stack Overflow: Søg efter fejlbeskeder
- Tauri Discord: https://discord.com/invite/tauri

---

## ✅ Success Checklist

Efter at have læst denne guide, skulle du kunne:

- [ ] Commit ændringer i VSCode
- [ ] Push til GitHub
- [ ] Pull fra GitHub
- [ ] Arbejde fra flere computere
- [ ] Oprette releases med tags
- [ ] Se GitHub Actions builds
- [ ] Download cross-platform installere
- [ ] Arbejde offline og sync senere

**Held og lykke med dit Songwriter projekt!** 🎵🎸🥁

---

*Denne guide er lavet til Songwriter projektet - et open source song composition tool.*
*Licens: GPL-3.0 | Copyright (C) 2025 Lone Hansen*