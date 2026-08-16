"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Loader2, Truck } from "lucide-react";
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
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Delivery, DeliveryStatus } from "@/types";

const STATUS_COLORS: Record<DeliveryStatus, string> = {
  dispatched: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  "in-transit": "bg-blue-100 text-blue-700 hover:bg-blue-100",
  delivered: "bg-green-100 text-green-700 hover:bg-green-100",
  failed: "bg-red-100 text-red-700 hover:bg-red-100",
};

export default function DeliveriesPage() {
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [orderId, setOrderId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [assignedWorkerId, setAssignedWorkerId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    if (!firebaseUser) return;

    // Staff sees every delivery; non-staff only sees deliveries assigned to them
    // (matches the Firestore security rules, which reject unfiltered list queries for non-staff)
    const q = isStaff
      ? query(collection(db, "deliveries"), orderBy("timestamp", "desc"))
      : query(
          collection(db, "deliveries"),
          where("assignedWorkerId", "==", firebaseUser.uid),
          orderBy("timestamp", "desc")
        );

    const unsub = onSnapshot(q, (snap) => {
      setDeliveries(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Delivery));
      setLoading(false);
    });
    return () => unsub();
  }, [firebaseUser, isStaff]);

  async function handleCreate() {
    if (!assignedWorkerId || !deliveryAddress || !customerId) {
      toast.error("Fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "deliveries"), {
        orderId: orderId || null,
        customerId,
        assignedWorkerId,
        deliveryAddress,
        status: "dispatched" as DeliveryStatus,
        timestamp: serverTimestamp(),
      });
      toast.success("Delivery dispatched");
      setOpen(false);
      setOrderId("");
      setCustomerId("");
      setAssignedWorkerId("");
      setDeliveryAddress("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create delivery");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Deliveries</h1>
          <p className="text-sm text-muted-foreground">Dispatch and track delivery status</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" /> New Delivery
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dispatch Delivery</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Related Order ID (optional)</Label>
                  <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Customer ID</Label>
                  <Input value={customerId} onChange={(e) => setCustomerId(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Assigned Driver / Worker</Label>
                  <WorkerPicker value={assignedWorkerId} onChange={setAssignedWorkerId} />
                </div>
                <div className="space-y-1">
                  <Label>Delivery Address</Label>
                  <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Dispatch
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {isStaff ? "All Deliveries" : "Your Deliveries"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : deliveries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deliveries yet.</p>
          ) : (
            deliveries.map((d) => (
              <Link
                key={d.id}
                href={`/deliveries/${d.id}`}
                className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{d.deliveryAddress}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.timestamp ? format((d.timestamp as unknown as Timestamp).toDate(), "MMM d, yyyy h:mm a") : ""}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className={STATUS_COLORS[d.status]}>
                  {d.status}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}