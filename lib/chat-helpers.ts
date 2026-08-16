"use client";

import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { encryptForUser } from "@/lib/crypto/signal-session";
import type { SignalProtocolStore } from "@/lib/crypto/signal-store";

export async function getOrCreateDirectChat(uidA: string, uidB: string): Promise<string> {
  const chatId = [uidA, uidB].sort().join("_");
  const chatRef = doc(db, "chats", chatId);
  const snap = await getDoc(chatRef);

  if (!snap.exists()) {
    await setDoc(chatRef, {
      isGroup: false,
      participantIds: [uidA, uidB],
      createdAt: serverTimestamp(),
    });
  }

  return chatId;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  recipientUid: string,
  store: SignalProtocolStore,
  plaintext: string,
  type: "text" | "image" | "file" = "text"
) {
  const { content, messageType } = await encryptForUser(recipientUid, store, plaintext);

  const docRef = await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    content,
    messageType,
    encrypted: true,
    type,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });

  // Cache our own sent plaintext immediately — we already know it, no need to decrypt later
  await store.setDecryptedCache(docRef.id, plaintext);

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: "🔒 New message",
    lastMessageAt: serverTimestamp(),
  });
}

export async function markMessageRead(chatId: string, messageId: string, userId: string) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    readBy: arrayUnion(userId),
  });
}