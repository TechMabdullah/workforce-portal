"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, ListTodo, Wallet, Boxes } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const METRICS = [
  { label: "Today's Attendance", value: "—", icon: ClipboardCheck },
  { label: "Open Orders", value: "—", icon: ListTodo },
  { label: "Outstanding Balance", value: "—", icon: Wallet },
  { label: "Low Stock Items", value: "—", icon: Boxes },
];

export default function DashboardPage() {
  const { appUser, firebaseUser, loading } = useAuth();
  const displayName = appUser?.displayName || firebaseUser?.displayName || "there";

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <h1 className="text-xl font-semibold">
           {loading ? <Skeleton className="h-6 w-48" /> : `Welcome back, ${displayName}`}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Here&apos;s what&apos;s happening today.</p>
      </motion.div>
      

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m, i) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? <Skeleton className="h-8 w-16" /> : <div className="text-2xl font-bold">{m.value}</div>}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Latest Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}