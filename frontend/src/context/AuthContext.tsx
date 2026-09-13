import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, clearToken } from "../api/client";

type User = { id: number; email: string; name: string; last_name: string };

type AuthContextType = {
  user: User | null;
  loading: boolean; // true while we check for an existing saved session
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, lastName: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On every app open, if a token was saved from a previous session, validate it
  // silently against the backend. If it's still good, the user lands straight on
  // Today with no login screen. If it's expired/invalid, we clear it and show login.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((me) => setUser(me))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    await api.login(email, password);
    const me = await api.getMe();
    setUser(me);
  }

  async function register(email: string, password: string, name: string, lastName: string) {
    await api.register(email, password, name, lastName);
    await login(email, password);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
