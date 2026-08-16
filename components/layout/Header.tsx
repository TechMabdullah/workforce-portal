"use client";

import { useState } from "react";
import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup, // add this import
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/firebase/auth-helpers";
import { useRouter } from "next/navigation";

export function Header() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [notifCount] = useState(3); // wire up to real unread count later

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initials = appUser?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 border-b bg-background sticky top-0 z-40 flex items-center gap-4 px-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search…" className="pl-8 h-9" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {notifCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              {notifCount}
            </Badge>
          )}
        </Button>
<DropdownMenu>
  <DropdownMenuTrigger
    render={<button className="flex items-center gap-2 rounded-full" />}
  >
    <Avatar className="h-8 w-8">
      <AvatarImage src={appUser?.photoURL ?? undefined} alt={appUser?.displayName ?? "User avatar"} />
      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
    </Avatar>
  </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
    <DropdownMenuLabel className="flex flex-col">
      <span className="font-medium">{appUser?.displayName}</span>
      <span className="text-xs text-muted-foreground font-normal">{appUser?.email}</span>
    </DropdownMenuLabel>
  </DropdownMenuGroup>
  <DropdownMenuSeparator />
  <DropdownMenuGroup>
    <DropdownMenuItem onClick={() => router.push("/settings")}>Profile & Settings</DropdownMenuItem>
  </DropdownMenuGroup>
  <DropdownMenuSeparator />
  <DropdownMenuGroup>
    <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
      Sign out
    </DropdownMenuItem>
  </DropdownMenuGroup>
</DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}