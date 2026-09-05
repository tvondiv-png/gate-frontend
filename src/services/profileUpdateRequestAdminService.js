import api from "../api/api";

export const listAdminProfileUpdateRequests = async () => {
  const res = await api.get("/api/profile-update-requests/admin");
  return res.data;
};

export const approveProfileUpdateRequest = async (id, payload) => {
  const res = await api.put(`/api/profile-update-requests/admin/${id}/approve`, payload);
  return res.data;
};

export const rejectProfileUpdateRequest = async (id, payload) => {
  const res = await api.put(`/api/profile-update-requests/admin/${id}/reject`, payload);
  return res.data;
};