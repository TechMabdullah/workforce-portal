import type { UserRole } from "@/types";

export function getPostLoginRedirect(role: UserRole | undefined): string {
  if (role === "SUPER_ADMIN" || role === "OWNER") return "/admin/dashboard";
  if (role === "CLIENT" || role === "CUSTOMER") return "/customer/dashboard";
  return "/dashboard";
}