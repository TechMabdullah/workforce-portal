"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "@/lib/nav-config";
import { useRole } from "@/hooks/useRole";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { role, hasRole } = useRole();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (role && hasRole(...item.roles))
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="hidden md:flex flex-col border-r bg-background h-screen sticky top-0 shrink-0"
    >
      <div className="h-14 flex items-center px-4 border-b shrink-0">
        {!collapsed && <span className="font-semibold text-sm truncate">KKGS Portal</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {visibleItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted/50",
                active ? "bg-muted font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="h-10 flex items-center justify-center border-t text-muted-foreground hover:bg-muted/50 transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </motion.aside>
  );
}