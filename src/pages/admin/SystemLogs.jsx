import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    const res = await api.get("/api/logs");
    setLogs(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const clearLogs = async () => {
    if (!window.confirm("Tem certeza que deseja zerar TODOS os logs?")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete("/api/logs");
      await loadLogs();
    } catch (err) {
      alert("Erro ao zerar logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resumo = useMemo(() => ({
    total: logs.length,
    modulos: new Set(logs.map((l) => l.modulo).filter(Boolean)).size
  }), [logs]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Logs do Sistema</h1>
          <p>Visualize e administre o histórico de ações do sistema.</p>
        </div>

        <div className="admin-module-actions" style={{ marginTop: 0 }}>
          <button className="admin-module-btn blue" onClick={loadLogs}>
            Recarregar
          </button>
          <button className="admin-module-btn danger" onClick={clearLogs} disabled={loading}>
            {loading ? "Zerando..." : "Zerar Logs"}
          </button>
        </div>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total de logs</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Módulos</small>
          <strong>{resumo.modulos}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Ação</th>
                <th>Usuário</th>
                <th>Módulo</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center" }}>
                    Nenhum log registrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td>{log.acao}</td>
                    <td>
                      {log.usuario
                        ? `${log.usuario.nome} (${log.usuario.email})`
                        : "Sistema"}
                    </td>
                    <td>{log.modulo}</td>
                    <td>{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}