# MoviesHub - Movie Streaming Platform

A YouTube-like movie streaming web application with dark theme, built with React and Firebase.

## Features

- **Admin Panel**: Upload, edit, and manage movies
- **Multiple Video Sources**: Support for 4 alternative embed sources
- **Download Options**: 480p, 720p, 1080p, 4K quality downloads
- **Search Functionality**: Find movies with related suggestions
- **Responsive Design**: Mobile-first responsive design
- **Ad Integration**: Support for Monetag/Adsterra ads
- **Firebase Backend**: Real-time database and authentication

## Setup Instructions

### 1. Firebase Configuration

1. Create a new Firebase project
2. Enable Firestore Database and Authentication
3. Copy your Firebase config and update `src/services/firebase.js`

### 2. Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
