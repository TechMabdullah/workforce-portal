"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase/client";
import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface WorkerPickerProps {
  value: string;
  onChange: (uid: string) => void;
}

export function WorkerPicker({ value, onChange }: WorkerPickerProps) {
  const [workers, setWorkers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkers() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "users"),
          where("role", "in", ["WORKER", "EMPLOYEE"]),
          where("status", "==", "active")
        );
        const snap = await getDocs(q);
        setWorkers(snap.docs.map((d) => d.data() as AppUser));
      } finally {
        setLoading(false);
      }
    }
    fetchWorkers();
  }, []);

  const selected = workers.find((w) => w.uid === value);

  return (

      <DropdownMenu>
  <DropdownMenuTrigger
    render={<Button variant="outline" className="w-full justify-between font-normal" />}
  >
    {loading ? (
      <span className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading workers…
      </span>
    ) : selected ? (
      selected.displayName
    ) : (
      <span className="text-muted-foreground">Select a worker</span>
    )}
    <ChevronsUpDown className="h-4 w-4 opacity-50" />
  </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-64 overflow-y-auto">
        {workers.length === 0 && !loading && (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No active workers found</div>
        )}
        {workers.map((w) => (
          <DropdownMenuItem key={w.uid} onClick={() => onChange(w.uid)} className="flex items-center justify-between">
            <span>{w.displayName}</span>
            {value === w.uid && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}