"use client";

import { useAuth } from "./useAuth";
import type { UserRole } from "@/types";

export function useRole() {
  const { appUser } = useAuth();

  const hasRole = (...roles: UserRole[]) =>
    !!appUser && roles.includes(appUser.role);

  const isAdmin = hasRole("SUPER_ADMIN", "OWNER");
  const isStaff = hasRole("SUPER_ADMIN", "OWNER", "MANAGER", "SUPERVISOR");
  const isWorker = hasRole("WORKER", "EMPLOYEE");
  const isClient = hasRole("CLIENT", "CUSTOMER");

  return { role: appUser?.role ?? null, hasRole, isAdmin, isStaff, isWorker, isClient };
}