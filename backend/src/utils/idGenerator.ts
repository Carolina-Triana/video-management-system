import { randomBytes } from "crypto";

/**
 * Generates a unique video ID with format "v_" followed by 8 alphanumeric characters.
 * Uses cryptographically secure random generation.
 *
 * @returns A video ID string (e.g., "v_aB3xY9Zq")
 */
export function generateVideoId(): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const charsLength = chars.length;

  // Generate 8 random bytes (we only need 8 characters, but using more bytes for better randomness)
  const randomBytesBuffer = randomBytes(8);

  let id = "v_";
  for (let i = 0; i < 8; i++) {
    // Use modulo to map byte value to character index
    const randomIndex = randomBytesBuffer[i] % charsLength;
    id += chars[randomIndex];
  }

  return id;
}
