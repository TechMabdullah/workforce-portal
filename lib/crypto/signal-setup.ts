"use client";

import { KeyHelper } from "@privacyresearch/libsignal-protocol-typescript";
import { collection, doc, setDoc, getDoc, addDoc, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SignalProtocolStore } from "./signal-store";
import { bufToBase64 } from "./signal-codec";

const PREKEY_BATCH_SIZE = 20;
const PREKEY_LOW_WATERMARK = 5; // replenish when fewer than this remain

// Generates identity + signed prekey once per device, and tops up the one-time
// prekey pool. Safe to call on every login. Checks BOTH local storage and Firestore —
// local keys can exist without the Firestore upload having succeeded (e.g. an earlier
// run generated keys locally but the app closed/errored before the upload ran), so
// trusting local storage alone can leave Firestore permanently missing the public key.
export async function ensureSignalIdentity(uid: string, store: SignalProtocolStore) {
  console.log("[ensureSignalIdentity] START for uid:", uid);
  let identityKeyPair = await store.getIdentityKeyPair();
  let registrationId = await store.getLocalRegistrationId();

  const hasLocalKeys = !!identityKeyPair && registrationId !== undefined;
  console.log("[ensureSignalIdentity] hasLocalKeys:", hasLocalKeys);

  let hasCloudKeys = false;
  if (hasLocalKeys) {
    const userSnap = await getDoc(doc(db, "users", uid));
    hasCloudKeys = !!userSnap.data()?.signalIdentityKey;
    console.log("[ensureSignalIdentity] hasCloudKeys:", hasCloudKeys);
  }

  const needsSetup = !hasLocalKeys || !hasCloudKeys;
  console.log("[ensureSignalIdentity] needsSetup:", needsSetup);

  if (needsSetup) {
    if (!hasLocalKeys) {
      console.log("[ensureSignalIdentity] Generating new local identity...");
      identityKeyPair = await KeyHelper.generateIdentityKeyPair();
      registrationId = KeyHelper.generateRegistrationId();
      await store.setIdentityKeyPair(identityKeyPair);
      await store.setLocalRegistrationId(registrationId);
    } else {
      console.log("[ensureSignalIdentity] Reusing existing local identity, re-uploading to Firestore...");
    }

    const signedPreKeyId = 1;
    const signedPreKey = await KeyHelper.generateSignedPreKey(identityKeyPair!, signedPreKeyId);
    await store.storeSignedPreKey(signedPreKeyId, signedPreKey.keyPair);

    console.log("[ensureSignalIdentity] Uploading public keys to Firestore...");
    await setDoc(
      doc(db, "users", uid),
      {
        signalIdentityKey: bufToBase64(identityKeyPair!.pubKey),
        signalRegistrationId: registrationId,
        signalSignedPreKey: {
          keyId: signedPreKeyId,
          publicKey: bufToBase64(signedPreKey.keyPair.pubKey),
          signature: bufToBase64(signedPreKey.signature),
        },
      },
      { merge: true }
    );
    console.log("[ensureSignalIdentity] Upload SUCCESS");
  }

  console.log("[ensureSignalIdentity] Checking prekey pool...");
  await replenishPreKeysIfLow(uid, store);
  console.log("[ensureSignalIdentity] DONE");
}

async function replenishPreKeysIfLow(uid: string, store: SignalProtocolStore) {
  const preKeysRef = collection(db, "users", uid, "preKeys");
  const snap = await getDocs(query(preKeysRef, limit(PREKEY_LOW_WATERMARK)));
  if (snap.size >= PREKEY_LOW_WATERMARK) return; // plenty left, nothing to do

  const startId = Date.now() % 1_000_000;

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