"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Order, OrderPriority, OrderStatus } from "@/types";
import { WorkerPicker } from "@/components/orders/WorkerPicker";
import Link from "next/link";

const PRIORITY_COLORS: Record<OrderPriority, string> = {
  low: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  medium: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  high: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  urgent: "bg-red-100 text-red-700 hover:bg-red-100",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  "in-progress": "bg-blue-100 text-blue-700 hover:bg-blue-100",
  completed: "bg-green-100 text-green-700 hover:bg-green-100",
  rejected: "bg-red-100 text-red-700 hover:bg-red-100",
};

export default function OrdersPage() {
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedWorkerId, setAssignedWorkerId] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("medium");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("dueDate", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Order));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleCreate() {
    if (!firebaseUser || !title || !assignedWorkerId || !dueDate) {
      toast.error("Fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, "orders"), {
        assignedWorkerId,
        createdBy: firebaseUser.uid,
        title,
        description,
        priority,
        status: "pending" as OrderStatus,
        dueDate: Timestamp.fromDate(new Date(dueDate)),
        attachmentUrls: [],
      });
      toast.success("Order created");
      setOpen(false);
      setTitle("");
      setDescription("");
      setAssignedWorkerId("");
      setDueDate("");
      setPriority("medium");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">Work orders and task delegation</p>
        </div>

        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="h-4 w-4 mr-1" /> New Order
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Order</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-1">
                <Label>Assigned Worker</Label>
                <WorkerPicker value={assignedWorkerId} onChange={setAssignedWorkerId} />
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <select
                    className="w-full h-9 rounded-md border px-3 text-sm bg-background"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as OrderPriority)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Order
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">All Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            orders.map((o) => (
            <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
            >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">{o.title}</span>
                  <span className="text-xs text-muted-foreground">
                    Due {o.dueDate ? format((o.dueDate as unknown as Timestamp).toDate(), "MMM d") : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className={PRIORITY_COLORS[o.priority]}>
                    {o.priority}
                  </Badge>
                  <Badge variant="secondary" className={STATUS_COLORS[o.status]}>
                    {o.status}
                  </Badge>
                </div>
              </Link>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}