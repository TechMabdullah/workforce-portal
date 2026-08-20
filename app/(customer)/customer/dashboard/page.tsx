"use client";

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/format";
import type { FinancialLedger } from "@/types";

export default function CustomerDashboardPage() {
  const { firebaseUser } = useAuth();
  const [ledgers, setLedgers] = useState<FinancialLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, "financial_ledgers"), where("entityId", "==", firebaseUser.uid));
    const unsub = onSnapshot(q, (snap) => {
      setLedgers(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as FinancialLedger));
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseUser]);

  const totalOwed = ledgers.reduce((sum, l) => sum + l.remainingBalance, 0);
  const totalPaid = ledgers.reduce((sum, l) => sum + l.paidAmount, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Your Balance</h1>
        <p className="text-sm text-muted-foreground">Account summary</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Wallet className="h-4 w-4" /> Amount Owed
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <Skeleton className="h-9 w-32" /> : <div className="text-3xl font-semibold">{formatCurrency(totalOwed)}</div>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Paid</CardTitle>
            <TrendingDown className="h-3.5 w-3.5 text-green-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-20" /> : <div className="text-lg font-semibold">{formatCurrency(totalPaid)}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Accounts</CardTitle>
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-7 w-10" /> : <div className="text-lg font-semibold">{ledgers.length}</div>}
          </CardContent>
        </Card>
      </div>

      {!loading && ledgers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center pt-8">No ledger on file yet.</p>
      )}
    </div>
  );
}