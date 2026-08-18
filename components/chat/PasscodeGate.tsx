"use client";

import { useState } from "react";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { hashPasscode } from "@/lib/crypto/passcode";
import { markChatUnlockedThisSession } from "@/lib/chat-lock-session";

interface PasscodeGateProps {
  chatId: string;
  correctHash: string;
  onUnlock: () => void;
}

export function PasscodeGate({ chatId, correctHash, onUnlock }: PasscodeGateProps) {
  const [passcode, setPasscode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setChecking(true);
    setError(false);
    const enteredHash = await hashPasscode(passcode, chatId);
    if (enteredHash === correctHash) {
      markChatUnlockedThisSession(chatId);
      onUnlock();
    } else {
      setError(true);
      setPasscode("");
    }
    setChecking(false);
  }

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-8.5rem)] max-w-xs mx-auto gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">This chat is locked</p>
        <p className="text-xs text-muted-foreground mt-1">Enter the passcode to view it</p>
      </div>
      <form onSubmit={handleSubmit} className="w-full space-y-2">
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          className={error ? "border-destructive" : ""}
        />
        {error && <p className="text-xs text-destructive">Incorrect passcode</p>}
        <Button type="submit" className="w-full" disabled={!passcode || checking}>
          {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Unlock
        </Button>
      </form>
    </div>
  );
}