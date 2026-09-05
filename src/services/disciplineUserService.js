import api from "../api/api";

export const listarMeusProcessosDisciplinares = async () => {
  const res = await api.get("/api/discipline/my/cases");
  return res.data;
};

export const buscarMeuProcessoDisciplinar = async (id) => {
  const res = await api.get(`/api/discipline/my/cases/${id}`);
  return res.data;
};

export const confirmarCienciaProcesso = async (id) => {
  const res = await api.post(`/api/discipline/my/cases/${id}/ciencia`);
  return res.data;
};

export const enviarManifestacaoProcesso = async (id, payload) => {
  const res = await api.post(`/api/discipline/my/cases/${id}/manifestacao`, payload);
  return res.data;
};