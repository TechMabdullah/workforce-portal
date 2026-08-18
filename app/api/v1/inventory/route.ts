import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { inventoryCreateSchema } from "@/lib/validation/schemas";
import { ratelimit } from "@/lib/rate-limit";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const snap = await adminDb.collection("inventory").orderBy("title", "asc").get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const roleCheck = await requireRole(uid!, ["SUPER_ADMIN", "OWNER", "MANAGER", "SUPERVISOR"]);
  if (!roleCheck.authorized) {
    return roleCheck.error ?? NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = inventoryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const ref = await adminDb.collection("inventory").add({
    ...parsed.data,
    imageUrls: [],
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id }, { status: 200 });
}