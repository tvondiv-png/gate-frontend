import { createContext, useContext, useState } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (loginValue, senha) => {
    const res = await api.post("/api/auth/login", {
      login: loginValue,
      senha
    });

    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);

    return res.data.user; // 🔑 FUNDAMENTAL
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
