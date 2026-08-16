"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Order, OrderStatus } from "@/types";

const STATUS_FLOW: OrderStatus[] = ["pending", "in-progress", "completed"];

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    const unsub = onSnapshot(doc(db, "orders", orderId), (snap) => {
      setOrder(snap.exists() ? ({ id: snap.id, ...snap.data() } as Order) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [orderId]);

  async function updateStatus(status: OrderStatus) {
    if (!order) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), { status });
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  const canUpdate =
    order && firebaseUser && (isStaff || order.assignedWorkerId === firebaseUser.uid);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-muted-foreground">Order not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Orders
      </button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg">{order.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Due {order.dueDate ? format((order.dueDate as unknown as Timestamp).toDate(), "MMM d, yyyy") : "—"}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{order.priority}</Badge>
            <Badge variant="secondary">{order.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">{order.description || "No description provided."}</p>

          {canUpdate && order.status !== "completed" && order.status !== "rejected" && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              {STATUS_FLOW.filter((s) => s !== order.status).map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant="outline"
                  disabled={updating}
                  onClick={() => updateStatus(s)}
                >
                  {updating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  Mark {s}
                </Button>
              ))}
              {isStaff && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={updating}
                  onClick={() => updateStatus("rejected")}
                >
                  Reject
                </Button>
              )}
            </div>
          )}

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Progress evidence (photo/video) uploads will attach here once a storage provider is wired up.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}