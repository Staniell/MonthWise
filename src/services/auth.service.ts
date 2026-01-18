// Authentication service for password hashing and biometric authentication
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

/**
 * Hash a password using SHA-256
 */
export async function hashPassword(password: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
  return digest;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricAvailability(): Promise<{
  available: boolean;
  types: LocalAuthentication.AuthenticationType[];
}> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

  return {
    available: hasHardware && isEnrolled,
    types,
  };
}

/**
 * Authenticate using biometrics (fingerprint or face)
 */
export async function authenticateWithBiometric(promptMessage: string = "Authenticate to continue"): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: "Use password",
      cancelLabel: "Cancel",
      disableDeviceFallback: true, // Don't fall back to device passcode
    });

    return result.success;
  } catch (error) {
    console.error("Biometric authentication error:", error);
    return false;
  }
}

/**
 * Show password prompt and verify
 * Returns a promise that resolves to true if password is correct
 */
export function promptForPassword(
  passwordHash: string,
  onVerify: (password: string) => Promise<boolean>,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.prompt(
      "Enter Password",
      "Please enter your security password",
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        {
          text: "Verify",
          onPress: async (password?: string) => {
            if (!password) {
              resolve(false);
              return;
            }
            const isValid = await onVerify(password);
            resolve(isValid);
          },
        },
      ],
      "secure-text",
    );
  });
}

/**
 * Get human-readable biometric type name
 */
export function getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return "Face ID";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return "Fingerprint";
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return "Iris";
  }
  return "Biometric";
}

export const AuthService = {
  hashPassword,
  verifyPassword,
  checkBiometricAvailability,
  authenticateWithBiometric,
  promptForPassword,
  getBiometricTypeName,
};
