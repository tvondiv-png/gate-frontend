import api from "../api/api";

export const carregarDashboardUsuario = async () => {
  const res = await api.get("/api/user/dashboard/me");
  return res.data;
};
