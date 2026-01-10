---
description: Daily development commands and common tasks for MonthWise
---

# Daily Development Workflow

## Starting Development

### 1. Launch Development Server

```bash
// turbo
npx expo start
```

### 2. Run Type Checking (in separate terminal)

```bash
// turbo
npx tsc --noEmit --watch
```

---

## Common Development Tasks

### Adding a New Database Table

1. Add table definition to `src/database/schema.ts`
2. Increment `SCHEMA_VERSION`
3. Add migration in `src/database/migrations.ts`
4. Create repository in `src/database/repositories/`
5. Add TypeScript types in `src/types/`
6. Test with fresh app install

### Adding a New Screen

1. Create screen file in `app/` (expo-router)
2. Create screen component in `src/screens/`
3. Add to navigation stack if needed
4. Wire up with store actions

### Adding a New Store Action

1. Define action type in store interface
2. Implement action logic
3. Call repository methods for persistence
4. Refresh relevant UI state

---

## Database Debugging

### View SQLite Database (Development)

```bash
// turbo
npx expo-sqlite-viewer
```

### Reset Database (Fresh Start)

1. Clear app data on device/simulator
2. Or delete the `.db` file from app storage
3. Restart app - database will reinitialize

---

## Building for Testing

### Create Development Build (Expo Dev Client)

```bash
// First time or after native changes
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Run On Physical Device

```bash
npx expo start --dev-client
```

---

## Pre-Commit Checklist

// turbo-all

```bash
# Type check
npx tsc --noEmit

# Lint check
npx expo lint

# Run tests
npm test
```

---

## Troubleshooting

### Metro Bundler Issues

```bash
npx expo start --clear
```

### TypeScript Errors After Pull

```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### SQLite Errors

- Check `PRAGMA foreign_keys = ON` is set
- Verify migration ran successfully
- Check for constraint violations in data
