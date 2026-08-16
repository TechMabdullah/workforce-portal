"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { requestNotificationPermission, listenForForegroundMessages } from "@/lib/firebase/messaging-helpers";

export function useFcmToken() {
  const { firebaseUser } = useAuth();

  useEffect(() => {
    if (!firebaseUser) return;

    requestNotificationPermission(firebaseUser.uid).catch(() => {
      // Silently ignore — user may have denied permission, or browser doesn't support it
    });

    let unsubscribe: (() => void) | undefined;
    listenForForegroundMessages((payload) => {
      const { title, body } = payload.notification ?? {};
      toast(title ?? "New notification", { description: body });
    }).then((unsub) => {
      unsubscribe = unsub;
    });

    return () => unsubscribe?.();
  }, [firebaseUser]);
}