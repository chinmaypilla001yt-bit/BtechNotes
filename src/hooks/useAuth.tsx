import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";

import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { ensureUserProfile } from "@/lib/firestore";
import { friendlyError } from "@/lib/format";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    let active = true;
    const unsubscribe = onAuthStateChanged(
      getFirebaseAuth(),
      (nextUser) => {
        if (!active) return;
        setUser(nextUser);
        setLoading(false);
      },
      (err) => {
        if (!active) return;
        setError(friendlyError(err, "We couldn't verify your session."));
        setLoading(false);
      },
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      configured: isFirebaseConfigured,
      error,
      async signInWithGoogle() {
        setError(null);
        try {
          const result = await signInWithPopup(getFirebaseAuth(), googleProvider());
          await ensureUserProfile(result.user);
        } catch (err) {
          const message = friendlyError(err, "Google sign-in failed. Please try again.");
          setError(message);
          throw new Error(message);
        }
      },
      async logout() {
        await signOut(getFirebaseAuth());
      },
    }),
    [user, loading, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Authenticated UID, or null. */
export function useUid() {
  return useAuth().user?.uid ?? null;
}
