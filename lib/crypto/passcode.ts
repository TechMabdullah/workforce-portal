"use client";

// Not cryptographic security — this is a UI privacy-screen lock (same category as
// WhatsApp's Chat Lock), not an access-control boundary. Firestore data underneath
// is governed by the normal security rules, unaffected by this passcode.
export async function hashPasscode(passcode: string, chatId: string): Promise<string> {
  const data = new TextEncoder().encode(`${chatId}:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}