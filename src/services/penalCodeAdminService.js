import api from "../api/api";

export async function fetchPenalCodeAdmin(params = {}) {
  const { data } = await api.get("/api/penal-code/admin", { params });
  return data;
}

export async function createPenalCodeAdmin(payload) {
  const { data } = await api.post("/api/penal-code/admin", payload);
  return data;
}

export async function updatePenalCodeAdmin(id, payload) {
  const { data } = await api.put(`/api/penal-code/admin/${id}`, payload);
  return data;
}

export async function toggleActivePenalCodeAdmin(id) {
  const { data } = await api.patch(`/api/penal-code/admin/${id}/toggle-active`);
  return data;
}

export async function toggleHighlightPenalCodeAdmin(id) {
  const { data } = await api.patch(`/api/penal-code/admin/${id}/toggle-highlight`);
  return data;
}

export async function deletePenalCodeAdmin(id) {
  const { data } = await api.delete(`/api/penal-code/admin/${id}`);
  return data;
}