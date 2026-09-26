import api from "../api/api";

export async function fetchMeusBoletins() {
  const res = await api.get("/api/boletins/me");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchTodosBoletins() {
  const res = await api.get("/api/boletins");
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchBoletimById(id) {
  const res = await api.get(`/api/boletins/${id}`);
  return res.data;
}

export async function criarBoletim(payload) {
  const res = await api.post("/api/boletins", payload);
  return res.data;
}

export async function excluirBoletim(id) {
  const res = await api.delete(`/api/boletins/${id}`);
  return res.data;
}
