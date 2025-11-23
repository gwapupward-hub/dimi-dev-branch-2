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
- React Native / Expo
- TypeScript
- Web Audio API
- Custom DSP utilities

**Backend**
- Node.js
- Fastify / Express
- PostgreSQL
- S3 or Supabase Blob Storage
- JWT auth

**Audio Processing**
- Web Audio API
- OfflineAudioContext rendering
- Dynamic buffer slicing + comping

---

## Suggested Project Structure

```
dimi/
│
├── app/
│   ├── components/
│   ├── screens/
│   ├── hooks/
│   ├── audio/
│   │   ├── engine/
│   │   ├── recorder/
│   │   ├── dsp/
│   │   └── comping/
│   ├── context/
│   └── utils/
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── db/
│   └── tests/
│
├── docs/
│   ├── spec.md
│   ├── api.md
│   ├── audio-engine.md
│   └── future-roadmap.md
│
└── README.md
```

---

## Setup Instructions

### 1. Install Dependencies
```
npm install
```

### 2. Start Mobile App
```
npx expo start
```

### 3. Start Backend
```
cd backend
npm install
npm run dev
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
