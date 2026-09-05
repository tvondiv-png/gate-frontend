import axios from "axios";
import { emitToast } from "../lib/toastBus";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false
});

// 🔐 Injeta o token JWT em toda requisição
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* =========================================================
   Sessão expirada / token inválido (401)

   Endpoints de autenticação são tratados pelos próprios
   componentes (Login, AuthContext), então são ignorados aqui.
========================================================= */

let redirecionando = false;

function ehRotaDeAuth(url = "") {
  return (
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/me")
  );
}

function estaNaTelaDeLogin() {
  const p = window.location.pathname;
  return p.startsWith("/login") || p.startsWith("/entrar");
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";

    if (
      status === 401 &&
      !ehRotaDeAuth(url) &&
      !estaNaTelaDeLogin() &&
      !redirecionando
    ) {
      redirecionando = true;
      localStorage.removeItem("token");

      emitToast({
        type: "warning",
        message: "Sua sessão expirou. Entre novamente."
      });

      setTimeout(() => {
        window.location.assign("/login");
      }, 1200);
    }

    return Promise.reject(error);
  }
);

export default api;
