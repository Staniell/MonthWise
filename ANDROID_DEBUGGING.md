# Android Debugging Guide for MonthWise

This project uses `react-native-worklets` which requires a **Development Build** (Custom Dev Client) instead of the standard Expo Go app.

## Prerequisites

1.  **USB Debugging**: Enable Developer Options on your Android device and turn on "USB Debugging".
2.  **Android SDK**: Ensure you have Android Studio and the Android SDK Platform-Tools (adb) installed.
    - Verify by running `adb devices` in your terminal. You should see your device listed.
3.  **Java (JDK)**: Ensure you have JDK 17 installed (required for modern React Native builds).

## Initial Setup (One-time)

You need to build and install the custom development app on your device.

1.  Connect your Android device via USB.
2.  Run the following command in your terminal:

    ```bash
    npm run android:debug
    ```

    _(Note: This runs `npx expo run:android`)_

3.  This will:
    - Generate the `android` native project folder (prebuild).
    - Compile the native Android app.
    - Install "MonthWise (Dev)" on your device.
    - Start the Metro bundler.

## Daily Debugging

Once the app is installed on your phone:

1.  Start the development server:
    ```bash
    npx expo start --dev-client
    ```
2.  Open the "MonthWise" app on your phone.
3.  It should automatically connect to your computer's server.
    - If not, shake the device (or run `adb shell input keyevent 82`) to open the Dev Menu and select "Reload".

## Troubleshooting

- **"Could not connect to development server"**: Ensure your phone and computer are on the same Wi-Fi, or better yet, use USB tethering or `adb reverse tcp:8081 tcp:8081`.
- **Build Failures**: If the initial build fails, try running `npx expo prebuild --clean` to regenerate the android folder, then try again.
