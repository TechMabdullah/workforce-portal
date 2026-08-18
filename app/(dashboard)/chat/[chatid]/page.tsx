"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { collection, doc, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { Send, Lock, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { sendMessage, markMessageRead, deleteChatWithMessages } from "@/lib/chat-helpers";
import { isChatUnlockedThisSession } from "@/lib/chat-lock-session";
import { PasscodeGate } from "@/components/chat/PasscodeGate";
import { ManageLockDialog } from "@/components/chat/ManageLockDialog";
import { cn } from "@/lib/utils";
import type { Chat, ChatMessage } from "@/types";

export default function ChatThreadPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { isAdmin } = useRole();

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [manageLockOpen, setManageLockOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId) return;
    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      const chatData = snap.exists() ? ({ id: snap.id, ...snap.data() } as Chat) : null;
      setChat(chatData);
      // Check session-unlock status once we know whether it's actually locked
      if (chatData?.passcodeHash) {
        setUnlocked(isChatUnlockedThisSession(chatId));
      } else {
        setUnlocked(true); // no passcode set — nothing to unlock
      }
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChatMessage);
      setMessages(msgs);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !firebaseUser || !chatId) return;
    const content = input;
    setInput("");
    await sendMessage(chatId, firebaseUser.uid, content);
  }

  async function handleDelete() {
    if (!chatId) return;
    if (!confirm("Delete this entire chat and all its messages? This cannot be undone.")) return;
    setDeleteBusy(true);
    try {
      await deleteChatWithMessages(chatId);
      toast.success("Chat deleted");
      router.push("/chat");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete chat");
      setDeleteBusy(false);
    }
  }

  const isLocked = !!chat?.passcodeHash;

  // Show the passcode entry screen if it's locked and this session hasn't unlocked it yet
  if (chat && isLocked && !unlocked) {
    return (
      <PasscodeGate
        chatId={chatId}
        correctHash={chat.passcodeHash!}
        onUnlock={() => setUnlocked(true)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-2xl mx-auto">
      {isAdmin && (
        <div className="flex items-center justify-end gap-1 px-2 pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setManageLockOpen(true)}
          >
            <Lock className="h-3.5 w-3.5" />
            {isLocked ? "Manage Lock" : "Lock Chat"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleteBusy}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      )}

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
                  <p>{m.content}</p>
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

      {chatId && (
        <ManageLockDialog
          open={manageLockOpen}
          onOpenChange={setManageLockOpen}
          chatId={chatId}
          isCurrentlyLocked={isLocked}
        />
      )}
    </div>
  );
}