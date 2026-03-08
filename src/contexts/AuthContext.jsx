import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔁 RECONSTRUIR USUÁRIO AO RECARREGAR
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/api/auth/me")
      .then(res => {
        setUser(res.data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (loginValue, senha) => {
    const res = await api.post("/api/auth/login", {
      login: loginValue,
      senha
    });

    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);

    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
