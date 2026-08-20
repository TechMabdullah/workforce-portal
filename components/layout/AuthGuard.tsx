"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPostLoginRedirect } from "@/lib/redirect";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { firebaseUser, appUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!firebaseUser) {
      router.replace("/login");
      return;
    }
    if (!appUser) return; // still syncing from Firestore

    const correctPath = getPostLoginRedirect(appUser.role);

    // If a customer/admin somehow lands on the generic staff dashboard, or vice versa,
    // bounce them to the shell that matches their role
    const isOnCorrectShell =
      (correctPath === "/dashboard" && pathname.startsWith("/dashboard")) ||
      (correctPath === "/admin/dashboard" && pathname.startsWith("/admin")) ||
      (correctPath === "/customer/dashboard" && pathname.startsWith("/customer"));

    if (!isOnCorrectShell) {
      router.replace(correctPath);
    }
  }, [loading, firebaseUser, appUser, pathname, router]);

  if (loading || !firebaseUser || !appUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}