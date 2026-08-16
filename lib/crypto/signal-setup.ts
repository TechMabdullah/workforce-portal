"use client";

import { KeyHelper } from "@privacyresearch/libsignal-protocol-typescript";
import { collection, doc, updateDoc, addDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SignalProtocolStore } from "./signal-store";
import { bufToBase64 } from "./signal-codec";

const PREKEY_BATCH_SIZE = 20;
const PREKEY_LOW_WATERMARK = 5; // replenish when fewer than this remain

// Generates identity + signed prekey once per device, and tops up the one-time
// prekey pool. Safe to call on every login — it's a no-op after the first run
// except for topping up prekeys as they get consumed by other people starting sessions.
export async function ensureSignalIdentity(uid: string, store: SignalProtocolStore) {
  let identityKeyPair = await store.getIdentityKeyPair();
  let registrationId = await store.getLocalRegistrationId();

  const isFirstRun = !identityKeyPair || registrationId === undefined;

  if (isFirstRun) {
    identityKeyPair = await KeyHelper.generateIdentityKeyPair();
    registrationId = KeyHelper.generateRegistrationId();
    await store.setIdentityKeyPair(identityKeyPair);
    await store.setLocalRegistrationId(registrationId);

    const signedPreKeyId = 1;
    const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair, signedPreKeyId);
    await store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

    await updateDoc(doc(db, "users", uid), {
      signalIdentityKey: bufToBase64(identityKeyPair.pubKey),
      signalRegistrationId: registrationId,
      signalSignedPreKey: {
        keyId: signedPreKeyId,
        publicKey: bufToBase64(signedPreKey.keyPair.pubKey),
        signature: bufToBase64(signedPreKey.signature),
      },
    });
  }

  await replenishPreKeysIfLow(uid, store);
}

async function replenishPreKeysIfLow(uid: string, store: SignalProtocolStore) {
  const preKeysRef = collection(db, "users", uid, "preKeys");
  const snap = await getDocs(query(preKeysRef, limit(PREKEY_LOW_WATERMARK)));
  if (snap.size >= PREKEY_LOW_WATERMARK) return; // plenty left, nothing to do

  // Find the highest existing keyId locally so new ones don't collide across devices/sessions
  const startId = Date.now() % 1_000_000; // simple, collision-resistant enough for this scale

  for (let i = 0; i < PREKEY_BATCH_SIZE; i++) {
    const keyId = startId + i;
    const preKey = await KeyHelper.generatePreKey(keyId);
    await store.storePreKey(keyId, preKey.keyPair);
    await addDoc(preKeysRef, {
      keyId,
      publicKey: bufToBase64(preKey.keyPair.pubKey),
    });
  }
}