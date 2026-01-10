# MonthWise

A minimal, offline-first monthly expenditure tracking app built with React Native (Expo).

## Features

- 📊 **Year Overview**: See all 12 months at a glance with spending summaries
- 💰 **Allowance Tracking**: Set monthly allowance from multiple income sources
- 📝 **Expense Management**: Add, edit, and categorize expenses
- 📤 **Export/Import**: Backup and restore data as JSON
- 🔒 **Offline First**: All data stored locally via SQLite

## Tech Stack

- **Framework**: [Expo](https://expo.dev/) (SDK 54)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Database**: [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/)
- **UI**: Custom components with dark theme

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MonthWise

# Install dependencies
npm install

# Start development server
npx expo start
```

### Running on Devices

```bash
# Android
npx expo run:android

# iOS (macOS only)
npx expo run:ios
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── database/        # SQLite schema and repositories
├── screens/         # Screen components
├── services/        # Business logic
├── stores/          # Zustand state management
├── theme/           # Colors, typography, spacing
├── types/           # TypeScript interfaces
└── utils/           # Utility functions
```

## Testing

```bash
npm test
```

## Documentation

- [Database Schema](docs/SCHEMA.md)

## License

MIT
