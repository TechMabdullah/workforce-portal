"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { getOrCreateDirectChat } from "@/lib/chat-helpers";
import type { AppUser } from "@/types";

export default function NewChatPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map((d) => d.data() as AppUser).filter((u) => u.uid !== firebaseUser?.uid));
      setLoading(false);
    }
    if (firebaseUser) fetchUsers();
  }, [firebaseUser]);

  async function startChat(otherUid: string) {
    if (!firebaseUser) return;
    setStarting(otherUid);
    const chatId = await getOrCreateDirectChat(firebaseUser.uid, otherUid);
    router.push(`/chat/${chatId}`);
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Start a conversation</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">People</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            users.map((u) => (
              <button
                key={u.uid}
                onClick={() => startChat(u.uid)}
                disabled={starting === u.uid}
                className="w-full flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {u.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.displayName}</p>
                  <p className="text-xs text-muted-foreground">{u.role}</p>
                </div>
                {starting === u.uid && <Loader2 className="h-4 w-4 animate-spin" />}
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}