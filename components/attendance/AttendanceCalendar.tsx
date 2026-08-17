"use client";

import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  getDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Attendance, AttendanceStatus } from "@/types";

interface AttendanceCalendarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
  records: Attendance[]; // one entry per day this record belongs to
}

const STATUS_STYLES: Record<AttendanceStatus, { icon: "check" | "cross"; className: string }> = {
  "on-time": { icon: "check", className: "bg-green-100 text-green-700" },
  overtime: { icon: "check", className: "bg-green-100 text-green-700" },
  late: { icon: "check", className: "bg-amber-100 text-amber-700" },
  absent: { icon: "cross", className: "bg-red-100 text-red-700" },
};

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function AttendanceCalendar({ month, onMonthChange, records }: AttendanceCalendarProps) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingBlanks = getDay(monthStart); // 0 = Sunday

  // Map each day (yyyy-MM-dd) to its attendance record, if any
  const recordByDay = new Map<string, Attendance>();
  records.forEach((r) => {
    if (!r.timestampIn) return;
    const dateObj = (r.timestampIn as unknown as { toDate: () => Date }).toDate();
    const key = format(dateObj, "yyyy-MM-dd");
    recordByDay.set(key, r);
  });

  function prevMonth() {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }
  function nextMonth() {
    onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium">{format(month, "MMMM yyyy")}</p>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="text-[11px] text-muted-foreground font-medium py-1">
            {label}
          </div>
        ))}

        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const record = recordByDay.get(key);
          const style = record ? STATUS_STYLES[record.status] : null;
          const today = isToday(day);
          const inMonth = isSameMonth(day, month);

          return (
            <div
              key={key}
              className={cn(
                "aspect-square rounded-md flex flex-col items-center justify-center gap-0.5 text-xs",
                !inMonth && "opacity-40",
                today && "ring-1 ring-primary",
                style ? style.className : "bg-muted/40 text-muted-foreground"
              )}
            >
              <span className="leading-none">{format(day, "d")}</span>
              {style && (
                style.icon === "check" ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-green-100 inline-flex items-center justify-center">
            <Check className="h-2 w-2 text-green-700" />
          </span>
          On-time
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-amber-100 inline-flex items-center justify-center">
            <Check className="h-2 w-2 text-amber-700" />
          </span>
          Late
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-100 inline-flex items-center justify-center">
            <X className="h-2 w-2 text-red-700" />
          </span>
          Absent
        </span>
      </div>
    </div>
  );
}