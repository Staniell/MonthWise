---
description: EAS build, update, and submission workflow for MonthWise
---

# EAS Build Workflow

## Pre-Build Checklist

1. Ensure all changes are committed
2. Increment version numbers:
   - `app.json`: `version`, `android.versionCode`, `ios.buildNumber`
   - `android/app/build.gradle`: `versionCode`, `versionName`
3. Verify `newArchEnabled` setting in `app.json`

---

## Build Commands

### Preview Build (Internal Testing)

```bash
// turbo
eas build --platform android --profile preview
```

### Production Build (User Distribution)

```bash
// turbo
eas build --platform android --profile production --non-interactive
```

---

## OTA Updates (JS-Only Changes)

For JavaScript/TypeScript changes that don't require a native rebuild:

```bash
// turbo
eas update --branch production --message "Brief description of changes"
```

**Note**: OTA updates do NOT require incrementing `versionCode`.

---

## Post-Build Steps

1. Download APK from [Expo Dashboard](https://expo.dev)
2. Verify file size is ~57 MB (ARM-only optimization)
3. Test on physical device before distribution

---

## Distribution Options

### Direct APK (No Store)

1. Get download link from Expo Dashboard
2. Share link with users
3. Users must enable "Unknown Sources" to install

### Google Play Store

1. Change `eas.json` production profile to `"buildType": "app-bundle"`
2. Build with production profile
3. Submit via `eas submit --platform android`

---

## Troubleshooting

### Build Fails

```bash
// turbo
eas build:inspect --platform android --profile production
```

### Version Mismatch

Ensure `app.json` and `build.gradle` have matching:

- `version` ↔ `versionName`
- `android.versionCode` ↔ `versionCode`
