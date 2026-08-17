"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Send, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSignalIdentity } from "@/hooks/useSignalIdentity";
import { sendMessage, markMessageRead } from "@/lib/chat-helpers";
import { decryptFromUser } from "@/lib/crypto/signal-session";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";
import { SafetyNumberDialog } from "@/components/chat/SafetyNumberDialog";

type DecryptedMessage = ChatMessage & { plaintext: string };

export default function ChatThreadPage() {
 const { chatId } = useParams<{ chatId: string }>();
  const { firebaseUser } = useAuth();
  const { store, ready: identityReady } = useSignalIdentity();

  const [otherUid, setOtherUid] = useState<string | null>(null);
  const [otherDisplayName, setOtherDisplayName] = useState("this person");

console.log("otherUid:", otherUid, "identityReady:", identityReady); // ← add this line
  const [rawMessages, setRawMessages] = useState<ChatMessage[]>([]);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [safetyDialogOpen, setSafetyDialogOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Resolve the other participant's uid + display name for this 1-on-1 chat
  useEffect(() => {
  if (!chatId || !firebaseUser) {
    console.log("[otherUid effect] Skipping — chatId or firebaseUser missing", { chatId, firebaseUser });
    return;
  }

  console.log("[otherUid effect] STARTING getDoc for chatId:", chatId);

  const chatDocPromise = getDoc(doc(db, "chats", chatId));
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("getDoc timed out after 8s")), 8000)
  );

  Promise.race([chatDocPromise, timeoutPromise])
    .then(async (snap: any) => {
      console.log("[otherUid effect] getDoc RESOLVED. exists:", snap.exists(), "data:", snap.data());
      const participantIds: string[] = snap.data()?.participantIds ?? [];
      console.log("[otherUid effect] participantIds:", participantIds);
      const other = participantIds.find((id) => id !== firebaseUser.uid) ?? null;
      console.log("[otherUid effect] Resolved other uid:", other);
      setOtherUid(other);
      if (other) {
        const otherSnap = await getDoc(doc(db, "users", other));
        setOtherDisplayName(otherSnap.data()?.displayName ?? "this person");
      }
    })
    .catch((err) => {
      console.error("[otherUid effect] FAILED:", err);
    });
}, [chatId, firebaseUser]);

  // Listen for raw (encrypted) messages
  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
      setRawMessages(msgs);

      if (firebaseUser) {
        msgs.forEach((m) => {
          if (m.senderId !== firebaseUser.uid && !m.readBy.includes(firebaseUser.uid)) {
            markMessageRead(chatId, m.id, firebaseUser.uid);
          }
        });
      }
    });
    return () => unsub();
  }, [chatId, firebaseUser]);

  // Decrypt sequentially, in order — Double Ratchet requires processing messages
  // in send order, and each decrypted result is cached so it's never re-decrypted.
  useEffect(() => {
    if (!identityReady || !otherUid) return;
    let cancelled = false;

    async function decryptAll() {
      const results: DecryptedMessage[] = [];
      for (const m of rawMessages) {
        if (cancelled) return;
        if (m.encrypted && m.messageType !== undefined) {
          try {
            const plaintext = await decryptFromUser(m.senderId, store, m.id, m.content, m.messageType);
            results.push({ ...m, plaintext });
          } catch {
            results.push({ ...m, plaintext: "⚠️ Could not decrypt this message" });
          }
        } else {
          results.push({ ...m, plaintext: m.content }); // legacy/plaintext fallback
        }
      }
      if (!cancelled) setMessages(results);
    }

    decryptAll();
    return () => {
      cancelled = true;
    };
  }, [rawMessages, identityReady, otherUid, store]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !firebaseUser || !chatId || !otherUid) return;
    const content = input;
    setInput("");
    setSendError(null);
    try {
      await sendMessage(chatId, firebaseUser.uid, otherUid, store, content);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send — encryption setup issue");
      setInput(content); // restore so they don't lose what they typed
    }
  }

  if (!identityReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8.5rem)] gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Setting up encryption…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" /> End-to-end encrypted
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground gap-1"
          onClick={() => setSafetyDialogOpen(true)}
        >
          <ShieldCheck className="h-3 w-3" /> Verify
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        <AnimatePresence initial={false}>
          {messages.map((m) => {
            const isMine = m.senderId === firebaseUser?.uid;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={cn("flex", isMine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                    isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}
                >
                  <p>{m.plaintext}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {m.createdAt ? format((m.createdAt as unknown as Timestamp).toDate(), "h:mm a") : ""}
                    {isMine && m.readBy.length > 1 && " · Read"}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {sendError && <p className="text-xs text-destructive px-2 pb-1">{sendError}</p>}

      <div className="flex items-center gap-2 border-t p-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1"
        />
        <Button size="icon" onClick={handleSend} disabled={!input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {otherUid && firebaseUser && (
        <SafetyNumberDialog
          open={safetyDialogOpen}
          onOpenChange={setSafetyDialogOpen}
          myUid={firebaseUser.uid}
          otherUid={otherUid}
          otherDisplayName={otherDisplayName}
        />
      )}
    </div>
  );
}