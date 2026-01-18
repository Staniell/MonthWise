// Password hashing and verification service
import * as Crypto from "expo-crypto";

/**
 * Hash a password using SHA-256
 * In production, consider using bcrypt or argon2 via a native module
 */
export async function hashPassword(password: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
  return hash;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(password);
  return inputHash === storedHash;
}

export const AuthService = {
  hashPassword,
  verifyPassword,
};
