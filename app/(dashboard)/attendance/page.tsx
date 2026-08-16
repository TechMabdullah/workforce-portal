"use client";

import { useState } from "react";
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelfieCapture } from "@/components/attendance/SelfieCapture";
import { useGeolocation } from "@/hooks/useGeoLocation";
import { isWithinGeofence, distanceInMeters, BUSINESS_LOCATION } from "@/lib/geofence";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import type { AttendanceStatus } from "@/types";

export default function AttendancePage() {
  const { firebaseUser } = useAuth();
  const { getLocation, loading: geoLoading } = useGeolocation();
  const [photo, setPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [clockedInId, setClockedInId] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  async function handleClockIn() {
    if (!firebaseUser) return;
    if (!photo) {
      toast.error("Please capture a selfie first");
      return;
    }

    setSubmitting(true);
    try {
      const coords = await getLocation();
      const dist = distanceInMeters(coords, BUSINESS_LOCATION);
      setDistance(dist);

      if (!isWithinGeofence(coords)) {
        toast.error(`You're ${Math.round(dist)}m away from the site — outside allowed range`);
        setSubmitting(false);
        return;
      }

      const now = new Date();
      const status: AttendanceStatus = now.getHours() >= 9 ? "late" : "on-time"; // simple example rule

      const ref = await addDoc(collection(db, "attendance"), {
        workerId: firebaseUser.uid,
        timestampIn: serverTimestamp(),
        geoCoordinates: coords,
        locationName: "Main Site", // swap for reverse-geocoded name later
        verificationPhotoUrl: photo, // TODO: replace with hosted URL once storage provider is added
        status,
      });

      setClockedInId(ref.id);
      toast.success("Clocked in successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Clock-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleClockOut() {
    if (!clockedInId) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "attendance", clockedInId), {
        timestampOut: serverTimestamp(),
      });
      toast.success("Clocked out successfully");
      setClockedInId(null);
      setPhoto(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Clock-out failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Attendance</h1>
        <p className="text-sm text-muted-foreground">Clock in with location + photo verification</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Location & Selfie
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!clockedInId ? (
            <>
              <SelfieCapture onCapture={setPhoto} />

              {distance !== null && (
                <p className="text-xs text-muted-foreground">
                  Last check: {Math.round(distance)}m from site
                </p>
              )}

              <Button
                className="w-full"
                onClick={handleClockIn}
                disabled={submitting || geoLoading || !photo}
              >
                {(submitting || geoLoading) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Clock In
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Clocked in
              </div>
              <Button className="w-full" variant="outline" onClick={handleClockOut} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Clock Out
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}