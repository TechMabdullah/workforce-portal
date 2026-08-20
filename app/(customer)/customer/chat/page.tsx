"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { getOrCreateDirectChat } from "@/lib/chat-helpers";

export default function CustomerChatPage() {
  const { firebaseUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
  if (!firebaseUser) return;

  async function setup(uid: string) {
    const staffSnap = await getDocs(
      query(collection(db, "users"), where("role", "in", ["SUPER_ADMIN", "OWNER"]), limit(1))
    );
    const staffUid = staffSnap.docs[0]?.id;
    if (!staffUid) {
      setError(true);
      return;
    }
    const id = await getOrCreateDirectChat(uid, staffUid);
    router.replace(`/customer/chat/${id}`);
  }

  setup(firebaseUser.uid);
}, [firebaseUser, router]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-center px-4">
        <p className="text-sm text-muted-foreground">No staff account available to chat with yet.</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}