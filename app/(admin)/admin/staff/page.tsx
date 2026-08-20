"use client";

import { useEffect, useState } from "react";
import { collection, doc, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Search, MoreVertical, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase/client";
import type { AppUser, UserRole } from "@/types";

const ROLE_OPTIONS: UserRole[] = [
  "SUPER_ADMIN",
  "OWNER",
  "MANAGER",
  "SUPERVISOR",
  "WORKER",
  "EMPLOYEE",
  "CLIENT",
  "CUSTOMER",
];

const ROLE_COLORS: Record<UserRole, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  OWNER: "bg-purple-100 text-purple-700 hover:bg-purple-100",
  MANAGER: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  SUPERVISOR: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  WORKER: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  EMPLOYEE: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  CLIENT: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  CUSTOMER: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

export default function StaffPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busyUid, setBusyUid] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleRoleChange(uid: string, role: UserRole) {
    setBusyUid(uid);
    try {
      await updateDoc(doc(db, "users", uid), { role });
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setBusyUid(null);
    }
  }

  async function handleToggleStatus(uid: string, currentStatus: "active" | "suspended") {
    setBusyUid(uid);
    try {
      await updateDoc(doc(db, "users", uid), {
        status: currentStatus === "active" ? "suspended" : "active",
      });
      toast.success(currentStatus === "active" ? "Account suspended" : "Account reactivated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusyUid(null);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-sm text-muted-foreground">Manage roles and account status</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="pl-8"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {loading ? "Loading…" : `${filtered.length} account${filtered.length === 1 ? "" : "s"}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No accounts found.</p>
          ) : (
            filtered.map((u) => {
              const initials = u.displayName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
              const isBusy = busyUid === u.uid;
              const suspended = u.status === "suspended";

              return (
                <div
                  key={u.uid}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50 ${suspended ? "opacity-60" : ""}`}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={u.photoURL ?? undefined} alt={u.displayName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.displayName}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>

                  <Badge variant="secondary" className={ROLE_COLORS[u.role]}>
                    {u.role}
                  </Badge>

                  {suspended && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
                      Suspended
                    </Badge>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button size="icon" variant="ghost" disabled={isBusy} />}>
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                        Change role
                      </DropdownMenuItem>
                      {ROLE_OPTIONS.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          disabled={role === u.role}
                          onClick={() => handleRoleChange(u.uid, role)}
                        >
                          {role}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(u.uid, u.status)}
                        className={suspended ? "" : "text-destructive focus:text-destructive"}
                      >
                        {suspended ? "Reactivate account" : "Suspend account"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}