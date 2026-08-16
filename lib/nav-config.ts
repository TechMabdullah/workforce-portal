import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ClipboardCheck,
  ListTodo,
  MessageSquare,
  Boxes,
  Truck,
  Wallet,
  Newspaper,
  CalendarDays,
  Settings,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[]; // omit = visible to all authenticated roles
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "SUPERVISOR", "WORKER", "EMPLOYEE"] },
  { label: "Orders", href: "/orders", icon: ListTodo },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Inventory", href: "/inventory", icon: Boxes, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "SUPERVISOR", "CLIENT", "CUSTOMER"] },
  { label: "Deliveries", href: "/deliveries", icon: Truck },
  { label: "Ledger", href: "/ledger", icon: Wallet },
  { label: "News", href: "/news", icon: Newspaper },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

// Bottom tab bar (mobile) uses a trimmed subset
export const MOBILE_TABS: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/orders", icon: ListTodo },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { label: "Profile", href: "/settings", icon: Settings },
];