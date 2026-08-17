"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { toast } from "sonner";
import { Loader2, User, Bell, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { signOut, resetPassword } from "@/lib/firebase/auth-helpers";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { firebaseUser, appUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(appUser?.displayName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(appUser?.phoneNumber ?? "");
  const [saving, setSaving] = useState(false);

  // Notification toggles — stored locally for now; wire to FCM topic subscriptions later
  const [notifOrders, setNotifOrders] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifAnnouncements, setNotifAnnouncements] = useState(true);

  async function handleSaveProfile() {
  if (!firebaseUser) return;
  setSaving(true);
  try {
    await setDoc(
      doc(db, "users", firebaseUser.uid),
      {
        displayName,
        phoneNumber,
      },
      { merge: true } // creates the doc if missing, updates fields if it exists — self-healing
    );
    toast.success("Profile updated");
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Failed to update profile");
  } finally {
    setSaving(false);
  }
}

  async function handlePasswordReset() {
    if (!appUser?.email) return;
    try {
      await resetPassword(appUser.email);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    }
  }

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  const initials = appUser?.displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={appUser?.photoURL ?? undefined} alt={appUser?.displayName ?? "User avatar"} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{appUser?.email}</p>
              <Badge variant="secondary" className="mt-1">{appUser?.role}</Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-1">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+923001234567" />
          </div>

          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "New order assignments", state: notifOrders, setState: setNotifOrders },
            { label: "Chat messages", state: notifChat, setState: setNotifChat },
            { label: "Company announcements", state: notifAnnouncements, setState: setNotifAnnouncements },
          ].map((n) => (
            <label key={n.label} className="flex items-center justify-between text-sm cursor-pointer">
              <span>{n.label}</span>
              <input
                type="checkbox"
                checked={n.state}
                onChange={(e) => n.setState(e.target.checked)}
                className="h-4 w-4"
              />
            </label>
          ))}
          <p className="text-xs text-muted-foreground pt-1">
            Push notification delivery requires Firebase Cloud Messaging setup (not yet configured).
          </p>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" onClick={handlePasswordReset} className="w-full justify-start">
            Send password reset email
          </Button>
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full justify-start text-destructive hover:text-destructive"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}