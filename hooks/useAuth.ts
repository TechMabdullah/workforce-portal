"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { AppUser } from "@/types";

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  appUser: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!user) {
        setAppUser(null);
        setLoading(false);
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;

    const unsubUser = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      setAppUser(snap.exists() ? (snap.data() as AppUser) : null);
      setLoading(false);
    });

    return () => unsubUser();
  }, [firebaseUser]);

  // Pure .ts alternative to JSX (<AuthContext.Provider value={...}>{children}</AuthContext.Provider>)
  return React.createElement(
    AuthContext.Provider,
    { value: { firebaseUser, appUser, loading } },
    children
  );
}

export const useAuth = () => useContext(AuthContext);