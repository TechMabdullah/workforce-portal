"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Order } from "@/types";

export default function CustomerOrdersPage() {
  const { firebaseUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;
    const q = query(collection(db, "orders"), where("createdBy", "==", firebaseUser.uid), orderBy("dueDate", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseUser]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Your Orders</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <Skeleton className="h-14 w-full" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-md px-3 py-2 border">
                <div>
                  <p className="text-sm font-medium">{o.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due {o.dueDate ? format((o.dueDate as unknown as Timestamp).toDate(), "MMM d, yyyy") : ""}
                  </p>
                </div>
                <Badge variant="secondary">{o.status}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}