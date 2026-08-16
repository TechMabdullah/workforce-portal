"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { completeMagicLinkSignIn } from "@/lib/firebase/auth-helpers";

export default function VerifyPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        await completeMagicLinkSignIn(window.location.href);
        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Sign-in link is invalid or expired");
      }
    }
    run();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
      {error ? (
        <>
          <p className="text-destructive font-medium">{error}</p>
          <a href="/login" className="text-sm text-primary hover:underline">
            Back to login
          </a>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
    </div>
  );
}