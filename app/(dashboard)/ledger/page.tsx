"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { Wallet, TrendingUp, TrendingDown, Plus, Loader2, Trash2 } from "lucide-react";
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
import { WorkerPicker } from "@/components/orders/WorkerPicker";
import { db } from "@/lib/firebase/client";
import { useRole } from "@/hooks/useRole";
import type { FinancialLedger, LedgerEntityType } from "@/types";
import { formatCurrency } from "@/lib/format";

export default function LedgerListPage() {
  const { isAdmin } = useRole();
  const [ledgers, setLedgers] = useState<FinancialLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [entityType, setEntityType] = useState<LedgerEntityType>("CUSTOMER");
  const [entityId, setEntityId] = useState("");
  const [initialAmount, setInitialAmount] = useState("");

  useEffect(() => {
    const q = query(collection(db, "financial_ledgers"), orderBy("remainingBalance", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLedgers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FinancialLedger));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleCreate() {
    if (!entityId) {
      toast.error("Enter a customer ID, or select a worker");
      return;
    }
    setSubmitting(true);
    try {
      const amount = Number(initialAmount) || 0;
      await addDoc(collection(db, "financial_ledgers"), {
        entityType,
        entityId,
        totalCreditAmount: amount,
        paidAmount: 0,
        remainingBalance: amount,
        transactions: [],
      });
      toast.success("Ledger created");
      setOpen(false);
      setEntityId("");
      setInitialAmount("");
      setEntityType("CUSTOMER");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ledger");
    } finally {
      setSubmitting(false);
    }
  }


  const totalOutstanding = ledgers.reduce((sum, l) => sum + l.remainingBalance, 0);
  const totalCollected = ledgers.reduce((sum, l) => sum + l.paidAmount, 0);

  async function handleDelete(e: React.MouseEvent, ledgerId: string) {
  e.preventDefault(); // stop the Link from navigating
  e.stopPropagation();
  if (!confirm("Delete this ledger? This cannot be undone.")) return;
  try {
    await deleteDoc(doc(db, "financial_ledgers", ledgerId));
    toast.success("Ledger deleted");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to delete ledger");
  }
}

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-sm text-muted-foreground">You don&apos;t have access to the financial ledger.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Financial Ledger</h1>
          <p className="text-sm text-muted-foreground">Loans and customer credit balances</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="h-4 w-4 mr-1" /> New Ledger
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Ledger</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Entity Type</Label>
                <select
                  className="w-full h-9 rounded-md border px-3 text-sm bg-background"
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value as LedgerEntityType);
                    setEntityId(""); // reset so a stale worker UID doesn't leak into customer mode
                  }}
                >
                  <option value="CUSTOMER">Customer</option>
                  <option value="WORKER">Worker</option>
                </select>
              </div>

              {entityType === "WORKER" ? (
                <div className="space-y-1">
                  <Label>Worker</Label>
                  <WorkerPicker value={entityId} onChange={setEntityId} />
                </div>
              ) : (
                <div className="space-y-1">
                  <Label>Customer ID</Label>
                  <Input
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    placeholder="Customer's UID, or a chosen customer reference"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label>Initial Credit / Loan Amount (optional)</Label>
                <Input
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Ledger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-semibold">{formatCurrency(totalOutstanding)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-24" /> : <div className="text-2xl font-semibold">{formatCurrency(totalCollected)}</div>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">All Ledgers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : ledgers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ledgers yet.</p>
          ) : (
            ledgers.map((l) => {
              const overdue = l.remainingBalance > 0 && l.paidAmount === 0;
              return (
                <Link
  key={l.id}
  href={`/ledger/${l.id}`}
  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
>
  <div className="flex items-center gap-3 min-w-0">
    <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
    <div className="min-w-0">
      <p className="text-sm font-medium truncate">Entity: {l.entityId}</p>
      <p className="text-xs text-muted-foreground">
        {l.entityType} · Paid {formatCurrency(l.paidAmount)} of {formatCurrency(l.totalCreditAmount)}
      </p>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0">
    {overdue && (
      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100">
        Overdue
      </Badge>
    )}
    <span className="text-sm font-semibold">{formatCurrency(l.remainingBalance)}</span>
    <Button size="icon" variant="ghost" onClick={(e) => handleDelete(e, l.id)}>
      <Trash2 className="h-3.5 w-3.5 text-destructive" />
    </Button>
  </div>
</Link>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}