"use client";

import { base64ToBuf } from "./signal-codec";

// Deterministic per-pair fingerprint, generated the same way regardless of which
// side computes it — sorted by uid so both people always get an identical result.
export async function computeSafetyNumber(
  myUid: string,
  myIdentityKeyB64: string,
  otherUid: string,
  otherIdentityKeyB64: string
): Promise<string> {
  const [firstUid, firstKey, secondUid, secondKey] =
    myUid < otherUid
      ? [myUid, myIdentityKeyB64, otherUid, otherIdentityKeyB64]
      : [otherUid, otherIdentityKeyB64, myUid, myIdentityKeyB64];

  const combined = `${firstUid}:${firstKey}:${secondUid}:${secondKey}`;
  const digestBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(combined));
  const digestBytes = new Uint8Array(digestBuf);

  // Render as groups of 5 digits, WhatsApp-style, using the first 30 bytes of the hash
  let numeric = "";
  for (let i = 0; i < 30; i += 2) {
    const chunk = ((digestBytes[i] << 8) | digestBytes[i + 1]) % 100000;
    numeric += chunk.toString().padStart(5, "0");
  }

  return numeric.match(/.{1,5}/g)!.join(" ");
}