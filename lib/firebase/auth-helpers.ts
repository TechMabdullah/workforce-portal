"use client";

import {
  //signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut as firebaseSignOut,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider, facebookProvider } from "./client";
import type { AppUser, UserRole } from "@/types";

// ---- Shared: create the Firestore user doc on first login ----
// ---- Shared: create the Firestore user doc on first login ----
export async function ensureUserDoc(user: User, defaultRole: UserRole = "WORKER") {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    const newUser = {
      uid: user.uid,
      email: user.email ?? "",
      phoneNumber: user.phoneNumber ?? null, // null instead of undefined — Firestore rejects undefined
      displayName: user.displayName ?? user.email?.split("@")[0] ?? "New User",
      photoURL: user.photoURL ?? null, // same fix here
      role: defaultRole,
      status: "active",
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, newUser);
  }
  return ref;
}

// ---- Google (redirect) ----
export async function signInWithGoogleRedirect() {
  await signInWithPopup(auth, googleProvider);
  // Browser navigates away here — nothing after this line runs until redirect back
}

// ---- Facebook (redirect) ----
export async function signInWithFacebookRedirect() {
  await signInWithPopup(auth, facebookProvider);
}

// ---- Call this once when the login page mounts, to catch the user coming back ----
export async function handleRedirectResult() {
  const result = await getRedirectResult(auth);
  if (result?.user) {
    await ensureUserDoc(result.user);
    return result.user;
  }
  return null;
}

// ---- 3. Email Magic Link (passwordless) ----
const MAGIC_LINK_EMAIL_KEY = "kkgs_magic_link_email";

export async function sendMagicLink(email: string) {
  const actionCodeSettings = {
    url: `${window.location.origin}/verify`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(MAGIC_LINK_EMAIL_KEY, email);
}

export async function completeMagicLinkSignIn(currentUrl: string) {
  if (!isSignInWithEmailLink(auth, currentUrl)) {
    throw new Error("Invalid or expired sign-in link");
  }

  let email = window.localStorage.getItem(MAGIC_LINK_EMAIL_KEY);
  if (!email) {
    // Fallback: user opened the link on a different device
    email = window.prompt("Confirm your email to complete sign-in");
  }
  if (!email) throw new Error("Email is required to complete sign-in");

  const result = await signInWithEmailLink(auth, email, currentUrl);
  window.localStorage.removeItem(MAGIC_LINK_EMAIL_KEY);
  await ensureUserDoc(result.user);
  return result.user;
}

// ---- 4. Email + Password ----
export async function signInWithPassword(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(result.user);
  return result.user;
}

export async function signUpWithPassword(email: string, password: string, displayName: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await ensureUserDoc(result.user);
  // Store the chosen display name
  await setDoc(doc(db, "users", result.user.uid), { displayName }, { merge: true });
  return result.user;
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email);
}

// ---- 5. Phone OTP (2FA / verification) ----
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function setupRecaptcha(containerId: string) {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
    });
  }
  return recaptchaVerifier;
}

export async function sendOtp(phoneNumber: string, containerId: string): Promise<ConfirmationResult> {
  const verifier = setupRecaptcha(containerId);
  // phoneNumber must be E.164 format, e.g. +923001234567
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function verifyOtp(confirmationResult: ConfirmationResult, code: string) {
  const result = await confirmationResult.confirm(code);
  await ensureUserDoc(result.user);
  return result.user;
}

// ---- Sign out ----
export async function signOut() {
  await firebaseSignOut(auth);
}