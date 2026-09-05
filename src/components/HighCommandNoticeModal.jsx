import { useEffect, useState } from "react";
import api from "../api/api";

export default function HighCommandNoticeModal() {
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);

  const carregar = async () => {
    try {
      const res = await api.get("/api/high-command-notices/active");
      setNotice(res.data || null);
    } catch (err) {
      console.error("Erro ao buscar comunicado do alto comando:", err);
      setNotice(null);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const responder = async (decisao) => {
    if (!notice?._id) return;

    try {
      setLoading(true);
      await api.post(`/api/high-command-notices/${notice._id}/respond`, { decisao });
      setNotice(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao responder comunicado");
    } finally {
      setLoading(false);
    }
  };

  if (!notice) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          width: "min(760px, 92vw)",
          background: "#0f172a",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 22,
          padding: 24,
          color: "#fff",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)"
        }}
      >
        <div style={{ marginBottom: 10, color: "#f0c14b", fontWeight: 800, letterSpacing: ".08em" }}>
          ALERTA DO ALTO COMANDO
        </div>

        <h2 style={{ marginTop: 0 }}>{notice.titulo}</h2>

        <p style={{ color: "#d7e1f1", lineHeight: 1.6 }}>
          {notice.mensagem}
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button
            onClick={() => responder("MANTER")}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: 0,
              background: "#1d4ed8",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {loading ? "Processando..." : "Manter comunicado"}
          </button>

          <button
            onClick={() => responder("APAGAR")}
            disabled={loading}
            style={{
              padding: "12px 16px",
              borderRadius: 14,
              border: 0,
              background: "#dc2626",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            {loading ? "Processando..." : "Apagar comunicado"}
          </button>
        </div>
      </div>
    </div>
  );
}