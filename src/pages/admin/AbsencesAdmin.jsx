import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const badgeClass = (status) => {
  if (status === "Aprovada") return "success";
  if (status === "Rejeitada") return "danger";
  if (status === "Pendente") return "warning";
  return "info";
};

export default function AbsencesAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [list, setList] = useState([]);
  const [comentarios, setComentarios] = useState({});

  const load = async () => {
    const res = await api.get("/api/absences");
    setList(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const rejeitar = async (id) => {
    const comentario = comentarios[id] || "";

    if (!comentario.trim()) {
      toast.warning("Informe o comentário");
      return;
    }

    await api.post(`/api/absences/${id}/reject`, { comentario });
    setComentarios((prev) => ({ ...prev, [id]: "" }));
    load();
  };

  const resumo = useMemo(() => {
    return {
      total: list.length,
      pendentes: list.filter((x) => x.status === "Pendente").length,
      aprovadas: list.filter((x) => x.status === "Aprovada").length,
      rejeitadas: list.filter((x) => x.status === "Rejeitada").length
    };
  }, [list]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Ausências Policiais</h1>
          <p>Analise, aprove, rejeite e gerencie solicitações de ausência.</p>
        </div>

        <button className="admin-module-btn blue" onClick={load}>
          Recarregar
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Pendentes</small>
          <strong>{resumo.pendentes}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Aprovadas</small>
          <strong>{resumo.aprovadas}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Rejeitadas</small>
          <strong>{resumo.rejeitadas}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Solicitações</h2>
            <span>Controle administrativo de ausências registradas.</span>
          </div>
        </div>

        <div className="admin-module-card-list">
          {list.length === 0 && (
            <div className="admin-module-empty">Nenhuma ausência registrada.</div>
          )}

          {list.map((a) => (
            <div key={a._id} className="admin-module-card">
              <div className="admin-module-card-top">
                <strong>
                  {a.policialSnapshot
                    ? `${a.policialSnapshot.funcional} - ${a.policialSnapshot.nome}`
                    : "Policial não identificado"}
                </strong>

                <span className={`admin-module-badge ${badgeClass(a.status)}`}>
                  {a.status}
                </span>
              </div>

              <div className="admin-module-kv-grid">
                <div className="admin-module-kv">
                  <small>Período</small>
                  <div>
                    {new Date(a.dataInicio).toLocaleDateString("pt-BR")} até{" "}
                    {new Date(a.dataFim).toLocaleDateString("pt-BR")}
                  </div>
                </div>

                <div className="admin-module-kv">
                  <small>Dias</small>
                  <div>{a.dias}</div>
                </div>

                <div className="admin-module-kv">
                  <small>Motivo</small>
                  <div>{a.motivo}</div>
                </div>
              </div>

              {a.status === "Pendente" && (
                <>
                  <div style={{ marginTop: 12 }}>
                    <textarea
                      className="admin-module-textarea"
                      placeholder="Comentário para rejeição"
                      value={comentarios[a._id] || ""}
                      onChange={(e) =>
                        setComentarios((prev) => ({
                          ...prev,
                          [a._id]: e.target.value
                        }))
                      }
                    />
                  </div>

                  <div className="admin-module-actions">
                    <button
                      className="admin-module-btn green"
                      onClick={() => api.post(`/api/absences/${a._id}/approve`).then(load)}
                    >
                      Aprovar
                    </button>

                    <button className="admin-module-btn danger" onClick={() => rejeitar(a._id)}>
                      Rejeitar
                    </button>
                  </div>
                </>
              )}

              <div className="admin-module-actions">
                <button
                  className="admin-module-btn danger"
                  onClick={async () => {
                    const ok = await confirm({
                      tone: "danger",
                      message: "Excluir esta ausência?"
                    });
                    if (ok) {
                      api.delete(`/api/absences/${a._id}`).then(load);
                    }
                  }}
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}