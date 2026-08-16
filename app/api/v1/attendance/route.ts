import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth } from "@/lib/api-auth";
import { attendanceCreateSchema } from "@/lib/validation/schemas";
import { ratelimit } from "@/lib/rate-limit";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const workerId = request.nextUrl.searchParams.get("workerId") ?? uid;
  const snap = await adminDb
    .collection("attendance")
    .where("workerId", "==", workerId)
    .orderBy("timestampIn", "desc")
    .limit(50)
    .get();

  const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ records }, { status: 200 });
}

export async function POST(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const body = await request.json();
  const parsed = attendanceCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  // Workers can only clock in for themselves
  if (parsed.data.workerId !== uid) {
    return NextResponse.json({ error: "Cannot clock in for another worker" }, { status: 403 });
  }

  const hour = new Date().getHours();
  const status = hour >= 9 ? "late" : "on-time";

  const ref = await adminDb.collection("attendance").add({
    ...parsed.data,
    timestampIn: FieldValue.serverTimestamp(),
    status,
  });

  return NextResponse.json({ id: ref.id }, { status: 200 });
}