"use client";

import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getToken, onMessage } from "firebase/messaging";
import { getMessagingIfSupported, db } from "./client";

export async function requestNotificationPermission(uid: string): Promise<string | null> {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return null; // unsupported browser (e.g. Safari < 16, or SSR)

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

  const token = await getToken(messaging, {
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    // Store the token on the user's doc so the server can target this device later
    await updateDoc(doc(db, "users", uid), {
      fcmTokens: arrayUnion(token),
    });
  }

  return token ?? null;
}

export async function removeNotificationToken(uid: string, token: string) {
  await updateDoc(doc(db, "users", uid), {
    fcmTokens: arrayRemove(token),
  });
}

// Foreground listener — fires when a push arrives while the tab is open and focused
export async function listenForForegroundMessages(callback: (payload: { notification?: { title?: string; body?: string }; data?: Record<string, string> }) => void) {
  const messaging = await getMessagingIfSupported();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}