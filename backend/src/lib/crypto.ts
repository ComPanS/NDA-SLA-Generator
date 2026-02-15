import crypto from 'crypto';

const ENC_PREFIX = 'enc:v1:';
let cachedKey: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.DOC_ENC_KEY;
  if (!raw) {
    throw new Error('DOC_ENC_KEY is not set');
  }

  // Support base64 or hex encoded 32-byte key
  const tryBase64 = () => {
    const buf = Buffer.from(raw, 'base64');
    return buf.length === 32 ? buf : null;
  };
  const tryHex = () => {
    const buf = Buffer.from(raw, 'hex');
    return buf.length === 32 ? buf : null;
  };

  const key = tryBase64() || tryHex();
  if (!key) {
    throw new Error('DOC_ENC_KEY must be 32 bytes (base64 or hex)');
  }
  cachedKey = key;
  return key;
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

export function encryptString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (isEncrypted(value)) return value;
  const key = loadKey();
  const iv = crypto.randomBytes(12); // recommended length for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, ciphertext, authTag]).toString('base64');
  return `${ENC_PREFIX}${payload}`;
}

export function decryptString(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!isEncrypted(value)) return value;
  const key = loadKey();
  const payload = value.slice(ENC_PREFIX.length);
  const buf = Buffer.from(payload, 'base64');
  if (buf.length < 12 + 16) {
    throw new Error('Invalid encrypted payload');
  }
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(12, buf.length - 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  return plaintext;
}
