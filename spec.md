# dimi

## Overview
A mobile-first web application that connects music producers and artists, allowing producers to share beats and artists to record vocals over them.

## Visual Design & Branding
- Primary logo featuring a diamond-shaped audio waveform with gradient colors (blue, violet, and silver tones)
- Color theme based on the logo's gradient: blue (#4A90E2), violet (#8E44AD), and silver (#BDC3C7) tones
- Logo displayed prominently in header, splash screen, and used as favicon
- Cohesive theme applied across all UI components and global styles

## User Roles
Users must choose between two roles during sign-up:
- **Producer**: Can upload and manage beats, share them to the public feed
- **Artist**: Can browse beats, record vocals over them, and save finished tracks

## Core Features

### Authentication & User Management
- User registration with role selection (Producer or Artist)
- User profiles displaying role and basic information

### Producer Features
- Upload audio files (beats) to personal library
- Edit beat metadata (title, description)
- Delete uploaded beats
- Share beats to public home feed
- Manage shared/unshared status of beats

### Artist Features
- Browse public home feed of shared beats
- Play beats inline with audio controls
- Record vocals using device microphone while beat plays
- Save recorded tracks to personal library
- Playback saved tracks

### Home Feed
- Display all publicly shared beats from producers
- Audio player for each beat with play/pause controls
- Beat information (title, producer name)
- Optional: Like and comment functionality on beats

### Navigation
- Two main sections: Home (public feed) and Profile (user's content)
- Mobile-first responsive design

## Data Storage (Backend)
- User accounts with role information
- Beat files and metadata (title, description, producer, share status)
- Recorded tracks and metadata (artist, original beat reference)
- Optional: Likes and comments on beats

## Technical Requirements
- Mobile-optimized interface
- Audio recording capability using device microphone
- Audio playback controls
- File upload and storage for audio files
- English language interface
