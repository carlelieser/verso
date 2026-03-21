# Quickstart: Daily Journal App

**Branch**: `001-daily-journal-app` | **Date**: 2026-03-20

## Prerequisites

- Node.js >= 20
- Expo CLI (`npx expo`)
- iOS Simulator (Xcode 16+) or Android Emulator (NDK >= 24.0.8215888)
- EAS CLI for development builds (`npm install -g eas-cli`)
- Supabase account (free tier) for auth and sync backend

## Setup

### 1. Install Dependencies

```bash
# Core
npx expo install expo-sqlite expo-notifications expo-print \
  expo-sharing expo-image-manipulator expo-image-picker \
  expo-location expo-secure-store expo-file-system \
  expo-document-picker expo-av

# UI framework
npm install heroui-native uniwind tailwind-variants tailwind-merge
npx expo install react-native-reanimated react-native-gesture-handler \
  react-native-worklets react-native-safe-area-context \
  react-native-screens react-native-svg @gorhom/bottom-sheet

# Database
npm install drizzle-orm @supabase/supabase-js
npm install -D drizzle-kit babel-plugin-inline-import

# Sync
npm install @powersync/react-native @powersync/drizzle-driver

# Rich text editor
npm install react-native-enriched

# Voice dictation
npm install whisper.rn @fugood/react-native-audio-pcm-stream \
  react-native-fs

# Calendar and charts
npm install react-native-calendars react-native-gifted-charts

# Export
npm install react-native-view-shot
```

### 2. Configure app.json

```json
{
  "expo": {
    "plugins": [
      ["expo-sqlite", { "useSQLCipher": true }],
      [
        "expo-notifications",
        {
          "sounds": []
        }
      ]
    ],
    "ios": {
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Used for voice dictation",
        "NSLocationWhenInUseUsageDescription": "Used to tag entries with your location",
        "NSPhotoLibraryUsageDescription": "Used to embed photos in entries"
      }
    },
    "android": {
      "permissions": [
        "RECORD_AUDIO",
        "ACCESS_FINE_LOCATION",
        "SCHEDULE_EXACT_ALARM",
        "READ_MEDIA_IMAGES"
      ]
    }
  }
}
```

### 3. Configure Metro

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');
config.resolver.assetExts.push('bin', 'mil');

module.exports = withUniwindConfig(config);
```

### 4. Configure Babel

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['inline-import'],
  };
};
```

### 5. Configure Drizzle

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
```

### 6. Generate Development Build

```bash
# Generate native projects
npx expo prebuild

# Build dev client (iOS)
npx expo run:ios

# Build dev client (Android)
npx expo run:android
```

## Verify Setup

After the dev build launches:

1. App opens to an empty journal list screen
2. Tap "New Journal" — can create and name a journal
3. Open the journal — editor loads with clean blank page
4. Type text and apply bold formatting — renders inline
5. Tap dictation button — microphone permission prompt appears
6. Navigate to calendar — empty calendar renders
7. Navigate to insights — empty state with encouragement message

## Development Workflow

```bash
# Generate migrations after schema changes
npx drizzle-kit generate

# Start development server
npx expo start --dev-client

# Run tests
npm test

# Type check
npx tsc --noEmit

# Lint
npx eslint src/
```

## Environment Variables

Create `.env` at project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_POWERSYNC_URL=https://your-instance.powersync.com
```

Store the SQLCipher encryption key in `expo-secure-store` at first
launch — never hardcode it or store in environment variables.
