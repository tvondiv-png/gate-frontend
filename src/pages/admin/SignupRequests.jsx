import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

const badgeClass = (status) => {
  if (status === "Aprovado") return "success";
  if (status === "Rejeitado") return "danger";
  if (status === "Pendente") return "warning";
  return "info";
};

export default function SignupRequests() {
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const res = await api.get("/api/signup");
    setRequests(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const aprovar = async (id) => {
    if (!window.confirm("Aprovar solicitação?")) return;
    await api.put(`/api/signup/approve/${id}`);
    load();
  };

  const rejeitar = async (id) => {
    if (!window.confirm("Rejeitar solicitação?")) return;
    await api.put(`/api/signup/reject/${id}`);
    load();
  };

  const excluir = async (id) => {
    if (!window.confirm("Excluir definitivamente esta solicitação?")) return;
    await api.delete(`/api/signup/${id}`);
    load();
  };

  const resumo = useMemo(() => ({
    total: requests.length,
    pendentes: requests.filter((r) => r.status === "Pendente").length,
    aprovadas: requests.filter((r) => r.status === "Aprovado").length,
    rejeitadas: requests.filter((r) => r.status === "Rejeitado").length
  }), [requests]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Solicitações de Cadastro</h1>
          <p>Gerencie aprovações, rejeições e exclusões de cadastro.</p>
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
        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Funcional</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td>{r.funcional}</td>
                  <td>{r.nome}</td>
                  <td>{r.email}</td>
                  <td>
                    <span className={`admin-module-badge ${badgeClass(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td>{new Date(r.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td>
                    <div className="admin-module-actions" style={{ marginTop: 0 }}>
                      {r.status === "Pendente" && (
                        <>
                          <button className="admin-module-btn green" onClick={() => aprovar(r._id)}>
                            Aprovar
                          </button>
                          <button className="admin-module-btn danger" onClick={() => rejeitar(r._id)}>
                            Rejeitar
                          </button>
                        </>
                      )}

                      <button className="admin-module-btn danger" onClick={() => excluir(r._id)}>
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {requests.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    Nenhuma solicitação encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}