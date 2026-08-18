"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

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
  content: string,
  type: "text" | "image" | "file" = "text"
) {
  await addDoc(collection(db, "chats", chatId, "messages"), {
    senderId,
    content,
    type,
    createdAt: serverTimestamp(),
    readBy: [senderId],
  });

  await updateDoc(doc(db, "chats", chatId), {
    lastMessage: type === "text" ? content : `[${type}]`,
    lastMessageAt: serverTimestamp(),
  });
}

export async function markMessageRead(chatId: string, messageId: string, userId: string) {
  await updateDoc(doc(db, "chats", chatId, "messages", messageId), {
    readBy: arrayUnion(userId),
  });
}

// Admin-only — deletes every message in the chat, then the chat doc itself.
export async function deleteChatWithMessages(chatId: string) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const messagesSnap = await getDocs(messagesRef);

  const docs = messagesSnap.docs;
  for (let i = 0; i < docs.length; i += 450) {
    const batch = writeBatch(db);
    docs.slice(i, i + 450).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, "chats", chatId));
}