import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAuth, requireRole } from "@/lib/api-auth";
import { ledgerTransactionSchema } from "@/lib/validation/schemas";
import { ratelimit } from "@/lib/rate-limit";
import { Timestamp } from "firebase-admin/firestore";
import { randomUUID } from "crypto";

export async function GET(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const roleCheck = await requireRole(uid!, ["SUPER_ADMIN", "OWNER"]);
  if (!roleCheck.authorized) return roleCheck.error;

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const snap = await adminDb.collection("financial_ledgers").orderBy("remainingBalance", "desc").get();
  const ledgers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ ledgers }, { status: 200 });
}

// POST expects a query param ?ledgerId=... and adds a transaction to it
export async function POST(request: NextRequest) {
  const { uid, error } = await requireAuth(request);
  if (error) return error;

  const roleCheck = await requireRole(uid!, ["SUPER_ADMIN", "OWNER"]);
  if (!roleCheck.authorized) return roleCheck.error;

  const { success } = await ratelimit.limit(uid!);
  if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });

  const ledgerId = request.nextUrl.searchParams.get("ledgerId");
  if (!ledgerId) {
    return NextResponse.json({ error: "ledgerId query param is required" }, { status: 422 });
  }

  const body = await request.json();
  const parsed = ledgerTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  }

  const ledgerRef = adminDb.collection("financial_ledgers").doc(ledgerId);
  const ledgerSnap = await ledgerRef.get();
  if (!ledgerSnap.exists) {
    return NextResponse.json({ error: "Ledger not found" }, { status: 404 });
  }

  const ledger = ledgerSnap.data()!;
  const isRepayment = parsed.data.type === "REPAYMENT";
  const newPaidAmount = isRepayment ? ledger.paidAmount + parsed.data.amount : ledger.paidAmount;
  const newTotalCredit = !isRepayment ? ledger.totalCreditAmount + parsed.data.amount : ledger.totalCreditAmount;

  const transaction = {
    id: randomUUID(),
    date: Timestamp.now(),
    amount: parsed.data.amount,
    type: parsed.data.type,
    note: parsed.data.note,
    createdBy: uid,
  };

  await ledgerRef.update({
    transactions: [...(ledger.transactions ?? []), transaction],
    paidAmount: newPaidAmount,
    totalCreditAmount: newTotalCredit,
    remainingBalance: newTotalCredit - newPaidAmount,
  });

  return NextResponse.json({ transaction }, { status: 200 });
}