// app/(dashboard)/layout.tsx
"use client";

import { AuthGuard } from "@/components/layout/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { useFcmToken } from "@/hooks/useFcmToken"; // add this import

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useFcmToken(); // add this line

  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
          <Footer />
        </div>
      </div>
      <BottomNav />
    </AuthGuard>
  );
}