"use client";

import {
  SessionBuilder,
  SessionCipher,
  SignalProtocolAddress,
} from "@privacyresearch/libsignal-protocol-typescript";
import { collection, doc, getDoc, getDocs, query, limit, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SignalProtocolStore } from "./signal-store";
import { bufToBase64, base64ToBuf } from "./signal-codec";
import type { AppUser } from "@/types";

function addressFor(uid: string): SignalProtocolAddress {
  return new SignalProtocolAddress(uid, 1); // deviceId hardcoded to 1 — single device per account
}

// Converts a "binary string" (each char code = one raw byte — the format
// libsignal-protocol-typescript uses for encrypted message bodies) into an ArrayBuffer.
function binaryStringToBuf(binaryString: string): ArrayBuffer {
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Converts an ArrayBuffer into that same "binary string" format for feeding back into libsignal.
function bufToBinaryString(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => String.fromCharCode(b))
    .join("");
}

// Atomically claims (and deletes) one of the recipient's one-time prekeys, so it can
// never be reused by a second concurrent session — a core Signal Protocol guarantee.
async function claimOneTimePreKey(uid: string): Promise<{ keyId: number; publicKey: string } | null> {
  const preKeysRef = collection(db, "users", uid, "preKeys");
  const snap = await getDocs(query(preKeysRef, limit(5)));
  for (const docSnap of snap.docs) {
    const claimed = await runTransaction(db, async (tx) => {
      const fresh = await tx.get(docSnap.ref);
      if (!fresh.exists()) return null;
      tx.delete(docSnap.ref);
      return fresh.data() as { keyId: number; publicKey: string };
    });
    if (claimed) return claimed;
  }
  return null; // no one-time prekey available — falls back to signed-prekey-only session
}

async function ensureSessionWith(uid: string, store: SignalProtocolStore) {
  const address = addressFor(uid);
  const existing = await store.loadSession(address.toString());
  if (existing) return; // session already established — X3DH only needs to run once

  const userSnap = await getDoc(doc(db, "users", uid));
  const user = userSnap.data() as AppUser | undefined;
  if (!user?.signalIdentityKey || !user.signalRegistrationId || !user.signalSignedPreKey) {
    throw new Error("This person hasn't set up encrypted messaging yet");
  }

  const oneTimePreKey = await claimOneTimePreKey(uid);

  const preKeyBundle = {
    identityKey: base64ToBuf(user.signalIdentityKey),
    registrationId: user.signalRegistrationId,
    signedPreKey: {
      keyId: user.signalSignedPreKey.keyId,
      publicKey: base64ToBuf(user.signalSignedPreKey.publicKey),
      signature: base64ToBuf(user.signalSignedPreKey.signature),
    },
    ...(oneTimePreKey
      ? { preKey: { keyId: oneTimePreKey.keyId, publicKey: base64ToBuf(oneTimePreKey.publicKey) } }
      : {}),
  };

  const builder = new SessionBuilder(store, address);
  await builder.processPreKey(preKeyBundle);
}

export async function encryptForUser(
  uid: string,
  store: SignalProtocolStore,
  plaintext: string
): Promise<{ content: string; messageType: number }> {
  await ensureSessionWith(uid, store);
  const address = addressFor(uid);
  const cipher = new SessionCipher(store, address);
  const encoded = new TextEncoder().encode(plaintext);
  const result = await cipher.encrypt(encoded.buffer);

  // result.body is a binary string (one byte per char code), NOT base64 —
  // convert it to a real buffer first, then base64-encode that for safe storage in Firestore.
  const bodyBuf = binaryStringToBuf(result.body as string);
  return { content: bufToBase64(bodyBuf), messageType: result.type };
}

// Decrypts a message exactly once, caching the plaintext so reloads/re-renders
// never attempt to decrypt the same ciphertext twice (which breaks ratchet state).
export async function decryptFromUser(
  senderUid: string,
  store: SignalProtocolStore,
  messageId: string,
  content: string,
  messageType: number
): Promise<string> {
  const cached = await store.getDecryptedCache(messageId);
  if (cached !== undefined) return cached;

  const address = addressFor(senderUid);
  const cipher = new SessionCipher(store, address);

  // content is base64 (what we stored) — decode it back to a buffer, then to the
  // binary-string format libsignal's decrypt functions expect as input.
  const bodyBuf = base64ToBuf(content);
  const bodyBinaryString = bufToBinaryString(bodyBuf);

  const plaintextBuf =
    messageType === 3
      ? await cipher.decryptPreKeyWhisperMessage(bodyBinaryString, "binary")
      : await cipher.decryptWhisperMessage(bodyBinaryString, "binary");

  const plaintext = new TextDecoder().decode(plaintextBuf);
  await store.setDecryptedCache(messageId, plaintext);
  return plaintext;
}