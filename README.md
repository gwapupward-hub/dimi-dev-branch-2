# DIMI – Mobile-First Music Creation Studio
Record. Collaborate. Protect. Publish.

---

## Overview
DIMI is a mobile-first digital audio workstation engineered for artists and producers who want a fast, intuitive way to record vocals over beats, comp takes, mix, and export—without needing a laptop. DIMI blends the simplicity of voice-notes with the power of desktop DAWs like Cakewalk, while staying hyper-focused on the features creators actually use.

This platform bridges creators and producers in one streamlined workflow: browse beats, record vocals, comp your best takes, add basic FX, export, and publish.

---

## Core Features

### 🎙 Mobile Recording Engine
- Ultra-low latency monitoring
- Sample-accurate vocal-to-beat alignment
- Auto-trim silence
- Multiple takes per session
- Take lanes + swipe-to-comp
- Real-time waveform + volume meter
- Haptic feedback + clipping detection

### 🎧 Multi-Track Editing
- Drag, trim, split, duplicate
- Simple fade-in/fade-out gestures
- Region-based editing
- Undo/redo stack

### 🎚 Mixing Essentials
- Track volume + pan
- Reverb, EQ, and compression presets
- Vocal/beat volume balance controls
- Printable mixdown previews

### 🎵 Beat Library
- Producers upload beats
- Artists can preview, bookmark, and record instantly
- Optional tagging for mood, genre, BPM, key

### 🛡 Private Proof Vault (Optional Add-On)
A creator-protection module for timestamped proof of authorship:
- Encrypted file storage
- Hash-verify panel
- Unique hybrid identifiers
- Secure audit trail
- Court-defensible timestamping

---

## Tech Stack

**Frontend**
- React + TypeScript
- Vite (Build tooling)
- Tailwind CSS + shadcn/ui components
- React Router (Navigation)
- Web Audio API
- Custom DSP utilities with Audio Worklets

**Backend**
- Motoko (Internet Computer smart contracts)
- Internet Computer Protocol (ICP)
- Custom blob storage modules for large files
- Internet Identity authentication

**Audio Processing**
- Web Audio API
- OfflineAudioContext rendering
- Audio Worklets for real-time processing
- Dynamic buffer slicing + comping
- Custom effects chain (reverb, EQ, compression)
- Pitch detection (CREPE algorithm)
- Multi-stem management

---

## Project Structure

```
dimi/
│
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   └── ui/         # shadcn/ui components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   │   └── audioEngine/  # Audio processing
│   │   ├── main.tsx        # App entry point
│   │   └── App.tsx         # Root component
│   ├── index.html
│   └── tailwind.config.js
│
├── backend/
│   ├── main.mo                # Main canister
│   ├── authorization/         # Access control
│   │   └── access-control.mo
│   ├── blob-storage/          # File storage modules
│   │   ├── Storage.mo
│   │   └── Mixin.mo
│   └── invite-links/          # Invite system
│       └── invite-links-module.mo
│
├── docs/
│   └── spec.md
│
├── dfx.json              # ICP configuration
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- DFX (Internet Computer SDK)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Internet Computer Replica
```bash
dfx start --background
```

### 3. Deploy Canisters Locally
```bash
dfx deploy
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

### 6. Deploy to Internet Computer Mainnet
```bash
npm run deploy:ic
```

---

## Roadmap

### Phase 1 – MVP
- Full recording flow
- Beat uploader + artist recorder
- Basic mixing tools
- Export to WAV/MP3

### Phase 2 – Collaboration Layer
- Producer/artist profiles
- Beat marketplace
- Project sharing

### Phase 3 – Advanced Tools
- Stems export
- Advanced EQ + FX racks
- Real-time pitch correction
- Expanded Proof Vault integrations

---

## Vision
DIMI puts creators back in control of their work—no middlemen, no gatekeepers. A studio that fits in your hand and protects the art you make.

**Talent shouldn't need permission to shine.**
