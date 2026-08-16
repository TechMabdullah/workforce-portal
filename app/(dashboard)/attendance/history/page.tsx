"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from "firebase/firestore";
import { format, startOfWeek, startOfMonth, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Attendance, AttendanceStatus } from "@/types";

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  "on-time": "bg-green-100 text-green-700 hover:bg-green-100",
  late: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100",
  absent: "bg-red-100 text-red-700 hover:bg-red-100",
  overtime: "bg-blue-100 text-blue-700 hover:bg-blue-100",
};

type RangeKey = "day" | "week" | "month";

export default function AttendanceHistoryPage() {
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("week");

  useEffect(() => {
    if (!firebaseUser) return;

    async function fetchRecords() {
      setLoading(true);
      try {
        const now = new Date();
        const rangeStart =
          range === "day" ? startOfDay(now) : range === "week" ? startOfWeek(now) : startOfMonth(now);

        // Staff sees everyone's attendance; workers see only their own
        const constraints = [
          where("timestampIn", ">=", Timestamp.fromDate(rangeStart)),
          orderBy("timestampIn", "desc"),
          limit(100),
        ];

        const q = isStaff
          ? query(collection(db, "attendance"), ...constraints)
          : query(collection(db, "attendance"), where("workerId", "==", firebaseUser!.uid), ...constraints);

        const snap = await getDocs(q);
        setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance));
      } finally {
        setLoading(false);
      }
    }

    fetchRecords();
  }, [firebaseUser, isStaff, range]);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Attendance History</h1>
        <p className="text-sm text-muted-foreground">
          {isStaff ? "Team attendance records" : "Your attendance records"}
        </p>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as RangeKey)}>
        <TabsList>
          <TabsTrigger value="day">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
        </TabsList>

        <TabsContent value={range} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : records.length === 0 ? (
                <p className="text-sm text-muted-foreground">No records for this period.</p>
              ) : (
                records.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {r.timestampIn ? format((r.timestampIn as unknown as Timestamp).toDate(), "MMM d, h:mm a") : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.timestampOut
                          ? `Out: ${format((r.timestampOut as unknown as Timestamp).toDate(), "h:mm a")}`
                          : "Still clocked in"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.locationName}</span>
                      <Badge variant="secondary" className={STATUS_COLORS[r.status]}>
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}