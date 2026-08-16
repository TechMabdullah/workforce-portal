"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, deleteDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/format";
import type { FinancialLedger, TransactionType } from "@/types";

const TYPE_COLORS: Record<TransactionType, string> = {
  LOAN: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  REPAYMENT: "bg-green-100 text-green-700 hover:bg-green-100",
  CREDIT_PURCHASE: "bg-blue-100 text-blue-700 hover:bg-blue-100",
};

export default function LedgerDetailPage() {
  const { ledgerId } = useParams<{ ledgerId: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [ledger, setLedger] = useState<FinancialLedger | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("REPAYMENT");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!ledgerId) return;
    const unsub = onSnapshot(doc(db, "financial_ledgers", ledgerId), (snap) => {
      setLedger(snap.exists() ? ({ id: snap.id, ...snap.data() } as FinancialLedger) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [ledgerId]);

  async function handleAddTransaction() {
    if (!ledger || !firebaseUser || !amount) {
      toast.error("Enter an amount");
      return;
    }
    const numAmount = Number(amount);
    if (numAmount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }

    setSubmitting(true);
    try {
      const transaction = {
        id: crypto.randomUUID(),
        date: Timestamp.now(),
        amount: numAmount,
        type,
        note,
        createdBy: firebaseUser.uid,
      };

      // Repayments reduce balance; loans/credit purchases increase total owed
      const isRepayment = type === "REPAYMENT";
      const newPaidAmount = isRepayment ? ledger.paidAmount + numAmount : ledger.paidAmount;
      const newTotalCredit = !isRepayment ? ledger.totalCreditAmount + numAmount : ledger.totalCreditAmount;
      const newRemaining = newTotalCredit - newPaidAmount;

      await updateDoc(doc(db, "financial_ledgers", ledger.id), {
        transactions: arrayUnion(transaction),
        paidAmount: newPaidAmount,
        totalCreditAmount: newTotalCredit,
        remainingBalance: newRemaining,
      });

      toast.success("Transaction recorded");
      setOpen(false);
      setAmount("");
      setNote("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record transaction");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteLedger() {
    if (!ledger) return;
    if (!confirm("Delete this ledger and all its transaction history? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "financial_ledgers", ledger.id));
      toast.success("Ledger deleted");
      router.push("/ledger");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete ledger");
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!ledger) {
    return <p className="text-sm text-muted-foreground">Ledger not found.</p>;
  }

  const sortedTransactions = [...(ledger.transactions ?? [])].sort(
    (a, b) => (b.date as unknown as Timestamp).toMillis() - (a.date as unknown as Timestamp).toMillis()
  );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Ledgers
      </button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">Entity: {ledger.entityId}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{ledger.entityType}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                <Plus className="h-4 w-4 mr-1" /> Record Transaction
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label>Type</Label>
                    <select
                      className="w-full h-9 rounded-md border px-3 text-sm bg-background"
                      value={type}
                      onChange={(e) => setType(e.target.value as TransactionType)}
                    >
                      <option value="REPAYMENT">Repayment</option>
                      <option value="LOAN">Loan</option>
                      <option value="CREDIT_PURCHASE">Credit Purchase</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Note</Label>
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTransaction} disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={handleDeleteLedger}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center border-y py-3">
            <div>
              <p className="text-xs text-muted-foreground">Total Credit</p>
              <p className="text-lg font-semibold">{formatCurrency(ledger.totalCreditAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(ledger.paidAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold text-red-600">{formatCurrency(ledger.remainingBalance)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Transaction History</p>
            {sortedTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
            ) : (
              sortedTransactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={TYPE_COLORS[t.type]}>
                        {t.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format((t.date as unknown as Timestamp).toDate(), "MMM d, yyyy h:mm a")}
                      </span>
                    </div>
                    {t.note && <p className="text-xs text-muted-foreground mt-1">{t.note}</p>}
                  </div>
                  <span className={t.type === "REPAYMENT" ? "text-green-600 font-medium" : "font-medium"}>
                    {t.type === "REPAYMENT" ? "-" : "+"}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}