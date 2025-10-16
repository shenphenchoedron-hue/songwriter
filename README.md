# 🎵 Songwriter - Open Source Song Composition Tool

A powerful chord progression builder and melody editor with auto-loading drum samples, built with Tauri for cross-platform desktop deployment.

## ✨ Features

- **Circle of Fifths** interface for chord selection
- **Chord progression** builder with multiple scales
- **Grid-based melody editor** with multiple instruments
- **Real-time audio playback** with Soundfont-player and Tone.js
- **Auto-loading drum samples** (12 built-in samples)
- **Volume control** with mute functionality
- **MIDI export/import** support
- **MusicXML** support
- **PDF export** capability
- **Repeat sections** for song structure

## 🚀 Development

### Prerequisites

- Node.js (v20+)
- Rust
- Tauri CLI

### Run Development Mode

**Terminal 1 - Start Server:**
```bash
node server.js
```

**Terminal 2 - Start Tauri:**
```bash
npm run dev
```

### Build Desktop App

```bash
npm run build
```

Output: `src-tauri/target/release/bundle/`

## 📦 Cross-Platform Builds

This project uses GitHub Actions to automatically build for:
- **macOS** (Apple Silicon & Intel)
- **Windows** (x64)
- **Linux** (Debian/Ubuntu & AppImage)

### Create a Release:

1. Tag a version:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. GitHub Actions automatically builds for all platforms

3. Download installers from GitHub Releases page

## 🎹 Instruments

Built-in instruments:
- Acoustic Guitar
- Electric Guitar
- Piano
- Bass (Acoustic, Electric, Synth)
- Flute
- Violin
- Drumset (with auto-loaded samples)

## 🥁 Drum Samples

12 built-in drum samples that load automatically:
- Kick, Snare, Snare Rim
- HiHat, HiHat Open
- Tom 1, Tom 2, Floor Tom
- Crash, Ride
- Cowbell, Clap

Custom samples can still be loaded via the "Load Custom Samples" button.

## 📄 License

GPL-3.0 License - See [LICENSE.md](LICENSE.md)

Copyright (C) 2025 Lone Hansen

## 🙏 Credits

Built with:
- [Tauri](https://tauri.app/) - Desktop framework
- [Soundfont-player](https://github.com/danigb/soundfont-player) - Audio playback
- [Tone.js](https://tonejs.github.io/) - Drum samples

## 🛠️ Technical Details

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Rust (via Tauri)
- **Audio:** Web Audio API, Soundfont-player, Tone.js
- **Bundle Size:** ~5-10MB (significantly smaller than Electron)

## 📞 Support

For issues or questions, please create an issue on GitHub.