import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, getToken, setToken, setUnauthorizedHandler } from "@/lib/api";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const qc = useQueryClient();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    setToken(null);
    qc.clear();
    setUser(null);
  }, [qc]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    (async () => {
      if (getToken()) {
        try {
          setUser(await api("/auth/me"));
        } catch {}
      }
      setReady(true);
    })();
  }, [logout]);

  const login = async (email, password) => {
    const r = await api("/auth/login", { method: "POST", body: { email: email.trim(), password } });
    setToken(r.access_token);
    setUser(r.user);
  };

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{ready ? children : null}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
