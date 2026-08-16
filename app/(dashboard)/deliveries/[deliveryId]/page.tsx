"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, onSnapshot, updateDoc, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SelfieCapture } from "@/components/attendance/SelfieCapture";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Delivery, DeliveryStatus } from "@/types";

const STATUS_FLOW: DeliveryStatus[] = ["dispatched", "in-transit", "delivered"];

export default function DeliveryDetailPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (!deliveryId) return;
    const unsub = onSnapshot(doc(db, "deliveries", deliveryId), (snap) => {
      setDelivery(snap.exists() ? ({ id: snap.id, ...snap.data() } as Delivery) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [deliveryId]);

  async function updateStatus(status: DeliveryStatus) {
    if (!delivery) return;

    if (status === "delivered" && !proofPhoto) {
      toast.error("Capture proof-of-delivery photo before marking delivered");
      return;
    }

    setUpdating(true);
    try {
      await updateDoc(doc(db, "deliveries", delivery.id), {
        status,
        ...(status === "delivered" && proofPhoto ? { proofOfDeliveryUrl: proofPhoto } : {}),
      });
      toast.success(`Marked as ${status}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  const canUpdate =
    delivery && firebaseUser && (isStaff || delivery.assignedWorkerId === firebaseUser.uid);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!delivery) {
    return <p className="text-sm text-muted-foreground">Delivery not found.</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Deliveries
      </button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {delivery.deliveryAddress}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {delivery.timestamp ? format((delivery.timestamp as unknown as Timestamp).toDate(), "MMM d, yyyy h:mm a") : "—"}
            </p>
          </div>
          <Badge variant="secondary">{delivery.status}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {canUpdate && delivery.status !== "delivered" && delivery.status !== "failed" && (
            <div className="space-y-3 pt-2 border-t">
              {delivery.status === "in-transit" && !delivery.proofOfDeliveryUrl && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Proof of Delivery</p>
                  <SelfieCapture onCapture={setProofPhoto} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {STATUS_FLOW.filter((s) => s !== delivery.status).map((s) => (
                  <Button key={s} size="sm" variant="outline" disabled={updating} onClick={() => updateStatus(s)}>
                    {updating && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                    Mark {s}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  disabled={updating}
                  onClick={() => updateStatus("failed")}
                >
                  Mark failed
                </Button>
              </div>
            </div>
          )}

          {delivery.proofOfDeliveryUrl && (
            <div className="pt-2 border-t space-y-2">
              <p className="text-sm font-medium">Proof of Delivery</p>
              <img src={delivery.proofOfDeliveryUrl} alt="Proof of delivery" className="rounded-md max-w-sm" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}