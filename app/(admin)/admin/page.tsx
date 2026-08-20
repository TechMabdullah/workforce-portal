"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ListTodo, ClipboardCheck, Boxes, Truck, Wallet, Users, LogOut,
} from "lucide-react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth-helpers";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: ListTodo },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { label: "Inventory", href: "/inventory", icon: Boxes },
  { label: "Deliveries", href: "/deliveries", icon: Truck },
  { label: "Ledger", href: "/ledger", icon: Wallet },
  { label: "Staff", href: "/admin/staff", icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { appUser } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initials = appUser?.displayName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <aside className="w-60 border-r bg-background flex flex-col shrink-0">
          <div className="h-14 flex items-center px-4 border-b">
            <span className="font-semibold text-sm">KKGS Admin</span>
          </div>
          <nav className="flex-1 py-3 px-2 space-y-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                    active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground hover:text-foreground border-t"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-background flex items-center justify-end px-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={appUser?.photoURL ?? undefined} alt={appUser?.displayName} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}