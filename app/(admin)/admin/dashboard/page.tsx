"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { DollarSign, Users, ShoppingCart, Boxes as BoxesIcon } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/firebase/client";
import { formatCurrency } from "@/lib/format";
import type { Order, InventoryItem, FinancialLedger, AppUser } from "@/types";

const PIE_COLORS = ["#16a34a", "#2563eb", "#f59e0b", "#ef4444"];

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [ledgers, setLedgers] = useState<FinancialLedger[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, "orders"), (snap) => setOrders(snap.docs.map((d) => d.data() as Order)));
    const unsubInventory = onSnapshot(collection(db, "inventory"), (snap) => setInventory(snap.docs.map((d) => d.data() as InventoryItem)));
    const unsubLedgers = onSnapshot(collection(db, "financial_ledgers"), (snap) => setLedgers(snap.docs.map((d) => d.data() as FinancialLedger)));
    const unsubUsers = onSnapshot(query(collection(db, "users"), where("status", "==", "active")), (snap) => setUsers(snap.docs.map((d) => d.data() as AppUser)));
    return () => {
      unsubOrders(); unsubInventory(); unsubLedgers(); unsubUsers();
    };
  }, []);

  const totalOutstanding = ledgers.reduce((sum, l) => sum + l.remainingBalance, 0);
  const lowStockCount = inventory.filter((i) => i.quantity <= i.reorderThreshold).length;

  const monthlyOrders = Array.from({ length: 12 }, (_, i) => ({ month: format(new Date(2026, i, 1), "MMM"), count: 0 }));
  orders.forEach((o) => {
    const d = (o.dueDate as unknown as { toDate?: () => Date })?.toDate?.();
    if (d) monthlyOrders[d.getMonth()].count += 1;
  });

  const statusCounts: Record<string, number> = { pending: 0, "in-progress": 0, completed: 0, rejected: 0 };
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1; });
  const statusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back — here&apos;s what&apos;s happening today.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{formatCurrency(totalOutstanding)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{users.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{orders.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <BoxesIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-semibold">{lowStockCount}</div></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Orders This Year</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyOrders}>
                <defs>
                  <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="count" stroke="#16a34a" fill="url(#fillOrders)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Order Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70}>
                      {statusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {statusData.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {d.name}
                      </span>
                      <span>{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}