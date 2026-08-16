"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  signInWithGoogleRedirect,
  signInWithFacebookRedirect,
  signInWithPassword,
  signUpWithPassword,
  resetPassword,
  sendMagicLink,
  sendOtp,
  verifyOtp,
} from "@/lib/firebase/auth-helpers";
import type { ConfirmationResult } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Magic link state
  const [magicEmail, setMagicEmail] = useState("");
  const [magicSent, setMagicSent] = useState(false);

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  async function handleGoogle() {
    setLoading(true);
    try {
      await signInWithGoogleRedirect();
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleFacebook() {
    setLoading(true);
    try {
      await signInWithFacebookRedirect();
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Facebook sign-in failed");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithPassword(email, password, displayName);
      } else {
        await signInWithPassword(email, password);
      }
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      toast.success("Password reset email sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendMagicLink(magicEmail);
      setMagicSent(true);
      toast.success("Check your email for the sign-in link");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send link");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await sendOtp(phone, "recaptcha-container");
      setConfirmation(result);
      toast.success("OTP sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmation) return;
    setLoading(true);
    try {
      await verifyOtp(confirmation, otp);
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-6 bg-background border rounded-xl p-6 shadow-sm">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">KKGS Portal</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>

        {/* Social buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={handleGoogle} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Google
          </Button>
          <Button variant="outline" onClick={handleFacebook} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Facebook
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="magic">Magic Link</TabsTrigger>
            <TabsTrigger value="phone">Phone OTP</TabsTrigger>
          </TabsList>

          {/* Email + Password */}
          <TabsContent value="password">
            <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
              {isSignUp && (
                <div className="space-y-1">
                  <Label htmlFor="displayName">Full name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? "Create account" : "Sign in"}
              </Button>
              <div className="flex justify-between text-xs text-muted-foreground">
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="hover:underline">
                  {isSignUp ? "Already have an account? Sign in" : "New here? Sign up"}
                </button>
                {!isSignUp && (
                  <button type="button" onClick={handleForgotPassword} className="hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
            </form>
          </TabsContent>

          {/* Magic Link */}
          <TabsContent value="magic">
            {magicSent ? (
              <p className="text-sm text-muted-foreground pt-2">
                Link sent to <strong>{magicEmail}</strong>. Open it on this device to finish signing in.
              </p>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="magicEmail">Email</Label>
                  <Input id="magicEmail" type="email" value={magicEmail} onChange={(e) => setMagicEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send sign-in link
                </Button>
              </form>
            )}
          </TabsContent>

          {/* Phone OTP */}
          <TabsContent value="phone">
            {!confirmation ? (
              <form onSubmit={handleSendOtp} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+923001234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
                <div id="recaptcha-container" />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2">
                <div className="space-y-1">
                  <Label htmlFor="otp">Enter 6-digit code</Label>
                  <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}