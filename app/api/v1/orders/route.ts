import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { orderCreateSchema } from "@/lib/validation/schemas";
import { ratelimit } from "@/lib/rate-limit";
import { Timestamp } from "firebase-admin/firestore";
import { sendPushToUser } from "@/lib/notify";

export async function GET(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const snap = await adminDb.collection("orders").orderBy("dueDate", "asc").limit(50).get();
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ orders }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const roleCheck = await requireRole(uid!, ["SUPER_ADMIN", "OWNER", "MANAGER", "SUPERVISOR"]);
  if (!roleCheck.authorized) return roleCheck.error;

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = orderCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const ref = await adminDb.collection("orders").add({
    ...parsed.data,
    createdBy: uid,
    status: "pending",
    dueDate: Timestamp.fromDate(new Date(parsed.data.dueDate)),
  });

  await sendPushToUser(
  parsed.data.assignedWorkerId,
  "New order assigned",
  parsed.data.title,
  `/orders/${ref.id}`
);

  return NextResponse.json({ id: ref.id }, { status: 200 });
}