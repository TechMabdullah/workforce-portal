"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy } from "firebase/firestore";
import { toast } from "sonner";
import { Plus, Loader2, AlertTriangle, Pencil, Trash2 } from "lucide-react";
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
import { useRole } from "@/hooks/useRole";
import type { InventoryItem } from "@/types";
import { formatCurrency } from "@/lib/format";

const emptyForm = {
  sku: "",
  title: "",
  description: "",
  quantity: 0,
  unitPrice: 0,
  category: "",
  reorderThreshold: 5,
};

export default function InventoryPage() {
  const { isStaff } = useRole();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("title", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as InventoryItem));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(item: InventoryItem) {
    setEditingId(item.id);
    setForm({
      sku: item.sku,
      title: item.title,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      category: item.category,
      reorderThreshold: item.reorderThreshold,
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.title || !form.sku) {
      toast.error("SKU and title are required");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "inventory", editingId), {
          ...form,
          imageUrls: [],
          updatedAt: serverTimestamp(),
        });
        toast.success("Item updated");
      } else {
        await addDoc(collection(db, "inventory"), {
          ...form,
          imageUrls: [],
          updatedAt: serverTimestamp(),
        });
        toast.success("Item added");
      }
      setOpen(false);
      setForm(emptyForm);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this item?")) return;
    try {
      await deleteDoc(doc(db, "inventory", id));
      toast.success("Item deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete item");
    }
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">Stock levels and product catalog</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" onClick={openCreate} />}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Item" : "Add Item"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>SKU</Label>
                    <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Category</Label>
                    <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      value={form.unitPrice}
                      onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Reorder At</Label>
                    <Input
                      type="number"
                      value={form.reorderThreshold}
                      onChange={(e) => setForm({ ...form, reorderThreshold: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSave} disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? "Save Changes" : "Add Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Stock</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inventory items yet.</p>
          ) : (
            items.map((item) => {
              const lowStock = item.quantity <= item.reorderThreshold;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {lowStock && (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-100 gap-1">
                          <AlertTriangle className="h-3 w-3" /> Low stock
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      SKU: {item.sku} · {item.category || "Uncategorized"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.quantity} units</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    {isStaff && (
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}