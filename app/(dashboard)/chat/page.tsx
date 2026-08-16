"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { MessageSquarePlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Chat } from "@/types";

export default function ChatListPage() {
  const { firebaseUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(
      collection(db, "chats"),
      where("participantIds", "array-contains", firebaseUser.uid),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Chat));
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseUser]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Chat</h1>
          <p className="text-sm text-muted-foreground">Direct messages and group channels</p>
        </div>
        <Link href="/chat/new">
          <Button size="sm">
            <MessageSquarePlus className="h-4 w-4 mr-1" /> New
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Conversations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : chats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          ) : (
            chats.map((c) => (
              <Link
                key={c.id}
                href={`/chat/${c.id}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{c.isGroup ? "G" : "DM"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {c.isGroup ? c.groupName ?? "Group Chat" : "Direct Message"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{c.lastMessage ?? "No messages yet"}</p>
                </div>
                {c.lastMessageAt && (
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDistanceToNow((c.lastMessageAt as unknown as Timestamp).toDate(), { addSuffix: true })}
                  </span>
                )}
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}