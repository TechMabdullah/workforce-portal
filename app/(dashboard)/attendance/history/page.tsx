"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";
import { startOfMonth, endOfMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceCalendar } from "@/components/attendance/AttendanceCalendar";
import { WorkerPicker } from "@/components/orders/WorkerPicker";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import type { Attendance } from "@/types";

export default function AttendanceHistoryPage() {
  const { firebaseUser } = useAuth();
  const { isStaff } = useRole();
  const [month, setMonth] = useState(() => new Date());
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>("");
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  const targetWorkerId = isStaff ? selectedWorkerId || firebaseUser?.uid : firebaseUser?.uid;

  useEffect(() => {
    if (!targetWorkerId) return;

    async function fetchMonth() {
      setLoading(true);
      try {
        const monthStart = startOfMonth(month);
        const monthEnd = endOfMonth(month);

        const q = query(
          collection(db, "attendance"),
          where("workerId", "==", targetWorkerId),
          where("timestampIn", ">=", Timestamp.fromDate(monthStart)),
          where("timestampIn", "<=", Timestamp.fromDate(monthEnd)),
          orderBy("timestampIn", "asc")
        );
        const snap = await getDocs(q);
        setRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Attendance));
      } finally {
        setLoading(false);
      }
    }

    fetchMonth();
  }, [targetWorkerId, month]);

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div>
        <h1 className="text-xl font-semibold">Attendance History</h1>
        <p className="text-sm text-muted-foreground">
          {isStaff ? "Team attendance calendar" : "Your attendance calendar"}
        </p>
      </div>

      {isStaff && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Viewing</p>
          <WorkerPicker value={selectedWorkerId || firebaseUser?.uid || ""} onChange={setSelectedWorkerId} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <AttendanceCalendar month={month} onMonthChange={setMonth} records={records} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}