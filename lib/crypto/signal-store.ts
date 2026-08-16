"use client";

const DB_NAME = "kkgs-signal-store";
const STORE_NAME = "signal";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Implements the StorageType interface required by SessionBuilder/SessionCipher.
// All key material here is device-local — nothing in this file ever touches Firestore.
export class SignalProtocolStore {
  async getIdentityKeyPair() {
    return idbGet<{ pubKey: ArrayBuffer; privKey: ArrayBuffer }>("identityKey");
  }

  async getLocalRegistrationId() {
    return idbGet<number>("registrationId");
  }

  async isTrustedIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean> {
    const trusted = await idbGet<ArrayBuffer>(`identityKey-${identifier}`);
    if (!trusted) return true; // trust on first use (TOFU) — standard for Signal-style apps
    return bufEquals(trusted, identityKey);
  }

  async loadIdentityKey(identifier: string) {
    return idbGet<ArrayBuffer>(`identityKey-${identifier}`);
  }

  async saveIdentity(identifier: string, identityKey: ArrayBuffer): Promise<boolean> {
    const existing = await idbGet<ArrayBuffer>(`identityKey-${identifier}`);
    await idbSet(`identityKey-${identifier}`, identityKey);
    return existing !== undefined && !bufEquals(existing, identityKey); // true = identity changed
  }

  async loadPreKey(keyId: number | string) {
    const res = await idbGet<{ pubKey: ArrayBuffer; privKey: ArrayBuffer }>(`preKey-${keyId}`);
    return res;
  }

  async storePreKey(keyId: number | string, keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }) {
    await idbSet(`preKey-${keyId}`, keyPair);
  }

  async removePreKey(keyId: number | string) {
    await idbDelete(`preKey-${keyId}`);
  }

  async loadSignedPreKey(keyId: number | string) {
    return idbGet<{ pubKey: ArrayBuffer; privKey: ArrayBuffer }>(`signedPreKey-${keyId}`);
  }

  async storeSignedPreKey(keyId: number | string, keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }) {
    await idbSet(`signedPreKey-${keyId}`, keyPair);
  }

  async removeSignedPreKey(keyId: number | string) {
    await idbDelete(`signedPreKey-${keyId}`);
  }

  async loadSession(identifier: string) {
    return idbGet<string>(`session-${identifier}`);
  }

  async storeSession(identifier: string, record: string) {
    await idbSet(`session-${identifier}`, record);
  }

  async removeSession(identifier: string) {
    await idbDelete(`session-${identifier}`);
  }

  async removeAllSessions(identifier: string) {
    await idbDelete(`session-${identifier}`);
  }

  // ---- Local-only helpers (not part of StorageType, used by our setup/session code) ----
  async setIdentityKeyPair(keyPair: { pubKey: ArrayBuffer; privKey: ArrayBuffer }) {
    await idbSet("identityKey", keyPair);
  }

  async setLocalRegistrationId(id: number) {
    await idbSet("registrationId", id);
  }

  // Cache of successfully decrypted plaintext, keyed by Firestore message id.
  // Never re-decrypt a message once it's in here — ratchet keys are single-use.
  async getDecryptedCache(messageId: string) {
    return idbGet<string>(`decrypted-${messageId}`);
  }

  async setDecryptedCache(messageId: string, plaintext: string) {
    await idbSet(`decrypted-${messageId}`, plaintext);
  }
}

function bufEquals(a: ArrayBuffer, b: ArrayBuffer): boolean {
  if (a.byteLength !== b.byteLength) return false;
  const x = new Uint8Array(a);
  const y = new Uint8Array(b);
  for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false;
  return true;
}