import type { User } from "@/types";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { simpleHash, useStore } from "./useStore";

const SESSION_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export interface AuthContextValue {
  currentUser: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  verifyPin: (pin: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * AuthProvider doit envelopper l'app DANS StoreProvider pour accéder au store.
 * Tous les composants enfants partagent le même currentUser.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useStore();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    setCurrentUser(null);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (currentUser) {
      timeoutRef.current = setTimeout(logout, SESSION_TIMEOUT_MS);
    }
  }, [currentUser, logout]);

  useEffect(() => {
    if (!currentUser) return;
    const events = ["mousemove", "keydown", "click", "touchstart"];
    const handler = () => resetTimer();
    for (const e of events) window.addEventListener(e, handler);
    resetTimer();
    return () => {
      for (const e of events) window.removeEventListener(e, handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [currentUser, resetTimer]);

  const login = useCallback(
    (username: string, password: string): boolean => {
      const hash = simpleHash(password);
      // Recherche de l'utilisateur dans le store
      const user = state.users.find(
        (u) => u.username === username && u.passwordHash === hash,
      );
      if (user) {
        // Correction: s'assurer que l'utilisateur admin a toujours role='admin'
        const resolvedUser: User =
          user.username === "admin" && user.role !== "admin"
            ? { ...user, role: "admin" }
            : user;
        setCurrentUser(resolvedUser);
        dispatch({
          type: "ADD_AUDIT",
          payload: {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: resolvedUser.id,
            action: "LOGIN",
            details: `Connexion reussie pour ${resolvedUser.username} (role: ${resolvedUser.role})`,
          },
        });
        return true;
      }
      return false;
    },
    [state.users, dispatch],
  );

  const verifyPin = useCallback(
    (pin: string): boolean => {
      return pin === state.settings.adminPin;
    },
    [state.settings.adminPin],
  );

  const value: AuthContextValue = { currentUser, login, logout, verifyPin };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth — lit le contexte d'auth partagé.
 * Doit être utilisé dans <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
