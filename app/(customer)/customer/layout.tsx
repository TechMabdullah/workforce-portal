"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wallet, ListTodo, MessageSquare, LogOut } from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth-helpers";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Balance", href: "/customer/dashboard", icon: Wallet },
  { label: "Orders", href: "/customer/orders", icon: ListTodo },
  { label: "Chat", href: "/customer/chat", icon: MessageSquare },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <AuthGuard>
      <div className="min-h-screen flex flex-col bg-muted/30">
        <header className="h-14 border-b bg-background flex items-center px-4 justify-between">
          <span className="font-semibold text-sm">KKGS Portal</span>
          <span className="text-sm text-muted-foreground">{appUser?.displayName}</span>
        </header>
        <main className="flex-1 p-4 pb-20 max-w-lg mx-auto w-full">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 border-t bg-background flex">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={handleSignOut}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </nav>
      </div>
    </AuthGuard>
  );
}