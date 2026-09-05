import api from "../api/api";

export async function fetchPenalCode(params = {}) {
  const res = await api.get("/api/penal-code", { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchPenalCodeStats() {
  const res = await api.get("/api/penal-code/stats");
  return res.data;
}

export async function fetchPenalCodeHighlights() {
  const res = await api.get("/api/penal-code/highlights");
  return Array.isArray(res.data) ? res.data : [];
}