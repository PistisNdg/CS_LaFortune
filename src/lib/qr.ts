import { createHmac, timingSafeEqual } from 'crypto';

const QR_PREFIX = 'CSF1';

function getQrSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('QR_SECRET doit contenir au moins 32 caractères');
  }
  return secret;
}

/** Signature HMAC tronquée (16 octets) encodée en base64url. */
export function signQrPublicId(qrPublicId: string): string {
  const digest = createHmac('sha256', getQrSecret()).update(qrPublicId).digest();
  return digest.subarray(0, 16).toString('base64url');
}

export function buildQrPayload(qrPublicId: string): string {
  return `${QR_PREFIX}.${qrPublicId}.${signQrPublicId(qrPublicId)}`;
}

export type QrVerificationResult =
  | { ok: true; qrPublicId: string }
  | { ok: false; reason: 'FORMAT' | 'SIGNATURE' };

export function verifyQrPayload(payload: string): QrVerificationResult {
  const parts = payload.trim().split('.');
  if (parts.length !== 3 || parts[0] !== QR_PREFIX) {
    return { ok: false, reason: 'FORMAT' };
  }

  const qrPublicId = parts[1]!;
  const signature = parts[2]!;
  const expected = signQrPublicId(qrPublicId);

  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'SIGNATURE' };
    }
  } catch {
    return { ok: false, reason: 'SIGNATURE' };
  }

  return { ok: true, qrPublicId };
}

export function generateQrPublicId(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let result = '';
  const random = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[random[i]! % chars.length]!;
  }
  return result;
}
