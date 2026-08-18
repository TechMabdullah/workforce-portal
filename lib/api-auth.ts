import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, adminDb } from "@/lib/firebase/admin";
import type { UserRole } from "@/types";

export async function requireAuth(request: NextRequest) {
  try {
    const decoded = await verifyIdToken(request.headers.get("authorization"));
    return { uid: decoded.uid, error: null as NextResponse | null };
  } catch {
    return { uid: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
}

export async function requireRole(uid: string, allowedRoles: UserRole[]) {
  const userDoc = await adminDb.collection("users").doc(uid).get();
  if (!userDoc.exists) {
    return { authorized: false, error: NextResponse.json({ error: "User not found" }, { status: 403 }) };
  }
  const role = userDoc.data()?.role as UserRole;
  if (!allowedRoles.includes(role)) {
    return { authorized: false, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { authorized: true, error: null as NextResponse | null };
}