import api from "../api/api";

export const fetchProfileUpdateMetadata = async () => {
  const res = await api.get("/api/profile-update-requests/metadata");
  return res.data;
};

export const listMyProfileUpdateRequests = async () => {
  const res = await api.get("/api/profile-update-requests/mine");
  return res.data;
};

export const createProfileUpdateRequest = async (payload) => {
  const res = await api.post("/api/profile-update-requests", payload);
  return res.data;
};