"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { SignalProtocolStore } from "@/lib/crypto/signal-store";
import { ensureSignalIdentity } from "@/lib/crypto/signal-setup";

export function useSignalIdentity() {
  const { firebaseUser } = useAuth();
  const [store] = useState(() => new SignalProtocolStore());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!firebaseUser) {
        if (!cancelled) setReady(false);
        return;
      }
      if (!cancelled) setReady(false);
      try {
        await ensureSignalIdentity(firebaseUser.uid, store);
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error(err);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [firebaseUser, store]);

  return { store, ready };
}