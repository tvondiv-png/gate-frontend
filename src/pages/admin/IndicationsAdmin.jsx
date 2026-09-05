import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

const badgeClass = (status) => {
  if (status === "Aprovado") return "success";
  if (status === "Rejeitado") return "danger";
  if (status === "Pendente") return "warning";
  return "info";
};

export default function IndicationsAdmin() {
  const [indications, setIndications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const loadIndications = async () => {
    const res = await api.get("/api/admin/indications");
    setIndications(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    loadIndications();
  }, []);

  const approve = async (id) => {
    if (!window.confirm("Deseja aprovar esta indicação?")) return;

    setLoading(true);
    try {
      await api.post(`/api/admin/indications/${id}/aprovar`);
      setSelected(null);
      loadIndications();
    } catch (err) {
      alert("Erro ao aprovar indicação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id) => {
    if (!comentario.trim()) {
      alert("Informe o motivo da rejeição");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/admin/indications/${id}/rejeitar`, {
        comentario
      });
      setComentario("");
      setSelected(null);
      loadIndications();
    } catch (err) {
      alert("Erro ao rejeitar indicação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resumo = useMemo(() => ({
    total: indications.length,
    pendentes: indications.filter((i) => i.status === "Pendente").length,
    aprovadas: indications.filter((i) => i.status === "Aprovado").length,
    rejeitadas: indications.filter((i) => i.status === "Rejeitado").length
  }), [indications]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Indicações</h1>
          <p>Analise solicitações de indicação enviadas pelos policiais.</p>
        </div>

        <button className="admin-module-btn blue" onClick={loadIndications}>
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
        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Personagem</th>
                <th>Enviado por</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {indications.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    Nenhuma indicação encontrada
                  </td>
                </tr>
              ) : (
                indications.map((ind) => (
                  <tr key={ind._id}>
                    <td>{ind.nomePersonagem}</td>
                    <td>
                      {ind.criadoPor?.nome} ({ind.criadoPor?.email})
                    </td>
                    <td>
                      <span className={`admin-module-badge ${badgeClass(ind.status)}`}>
                        {ind.status}
                      </span>
                    </td>
                    <td>{new Date(ind.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td>
                      <button className="admin-module-btn" onClick={() => setSelected(ind)}>
                        Ver
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="admin-module-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="admin-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-module-section-title">
              <div>
                <h2>Detalhes da Indicação</h2>
                <span>Consulta completa da solicitação selecionada.</span>
              </div>
            </div>

            <div className="admin-module-kv-grid">
              <div className="admin-module-kv">
                <small>ID Personagem</small>
                <div>{selected.idPersonagem}</div>
              </div>
              <div className="admin-module-kv">
                <small>Nome Personagem</small>
                <div>{selected.nomePersonagem}</div>
              </div>
              <div className="admin-module-kv">
                <small>Idade Real</small>
                <div>{selected.idadeReal}</div>
              </div>
              <div className="admin-module-kv">
                <small>CNH</small>
                <div>{selected.cnh}</div>
              </div>
              <div className="admin-module-kv">
                <small>ID Discord</small>
                <div>{selected.discordId}</div>
              </div>
              <div className="admin-module-kv">
                <small>Enviado por</small>
                <div>
                  {selected.criadoPor?.nome} ({selected.criadoPor?.email})
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <span className={`admin-module-badge ${badgeClass(selected.status)}`}>
                {selected.status}
              </span>
            </div>

            {selected.status === "Pendente" && (
              <>
                <div style={{ marginTop: 16 }}>
                  <textarea
                    className="admin-module-textarea"
                    placeholder="Motivo da rejeição"
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                </div>

                <div className="admin-module-actions">
                  <button className="admin-module-btn green" onClick={() => approve(selected._id)} disabled={loading}>
                    Aprovar
                  </button>

                  <button className="admin-module-btn danger" onClick={() => reject(selected._id)} disabled={loading}>
                    Rejeitar
                  </button>
                </div>
              </>
            )}

            {selected.status === "Rejeitado" && (
              <div className="admin-module-alert danger" style={{ marginTop: 16 }}>
                <strong>Motivo da rejeição</strong>
                <p>{selected.comentarioAdmin}</p>
              </div>
            )}

            <div className="admin-module-actions">
              <button className="admin-module-btn blue" onClick={() => setSelected(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}