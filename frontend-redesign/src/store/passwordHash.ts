/**
 * Password hashing for the browser-only demo.
 *
 * Passwords are never stored as-is or with a fast hash. Each one gets its own random salt and is
 * run through PBKDF2-HMAC-SHA256 with 600,000 iterations (the OWASP minimum for this algorithm),
 * using the browser's built-in Web Crypto. The real backend should use Argon2id instead (see the proposal).
 *
 * Stored format: pbkdf2-sha256$<iterations>$<salt base64>$<hash base64>
 */

const ALGORITHM = 'pbkdf2-sha256';
const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (text: string) => Uint8Array.from(atob(text), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    key,
    HASH_BITS,
  );
  return new Uint8Array(bits);
}

/** Compare without stopping at the first difference. */
function sameBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return `${ALGORITHM}$${ITERATIONS}$${toBase64(salt)}$${toBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, iterations, salt, hash] = stored.split('$');
  const count = Number(iterations);
  if (algorithm !== ALGORITHM || !Number.isInteger(count) || count < 1 || !salt || !hash) return false;
  try {
    return sameBytes(await derive(password, fromBase64(salt), count), fromBase64(hash));
  } catch {
    return false;
  }
}

/** A throwaway hash, so signing in with an unknown email takes as long as a wrong password. */
let decoy: Promise<string> | undefined;
export const verifyAgainstDecoy = async (password: string) => {
  decoy ??= hashPassword('decoy-password-never-used');
  await verifyPassword(password, await decoy);
};
