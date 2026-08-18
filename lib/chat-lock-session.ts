"use client";

const STORAGE_KEY = "kkgs_unlocked_chats";

function getUnlockedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function isChatUnlockedThisSession(chatId: string): boolean {
  return getUnlockedSet().has(chatId);
}

export function markChatUnlockedThisSession(chatId: string): void {
  const set = getUnlockedSet();
  set.add(chatId);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
}