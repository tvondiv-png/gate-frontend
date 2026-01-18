import { useEffect, useState } from "react";
import api from "../../api/api";

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    const res = await api.get("/api/logs");
    setLogs(res.data);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  // 🔴 zerar logs
  const clearLogs = async () => {
    if (!window.confirm("Tem certeza que deseja zerar TODOS os logs?")) {
      return;
    }

    setLoading(true);
    try {
      await api.delete("/logs");
      await loadLogs();
    } catch (err) {
      alert("Erro ao zerar logs");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Logs do Sistema</h1>

      <button
        onClick={clearLogs}
        disabled={loading}
        style={{
          background: "darkred",
          color: "#fff",
          padding: "6px 12px",
          marginBottom: 20
        }}
      >
        {loading ? "Zerando..." : "Zerar Logs"}
      </button>

      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>Ação</th>
            <th>Usuário</th>
            <th>Módulo</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {logs.length === 0 && (
            <tr>
              <td colSpan="4" align="center">
                Nenhum log registrado
              </td>
            </tr>
          )}

          {logs.map(log => (
            <tr key={log._id}>
              <td>{log.acao}</td>
              <td>
                {log.usuario
                  ? `${log.usuario.nome} (${log.usuario.email})`
                  : "Sistema"}
              </td>
              <td>{log.modulo}</td>
              <td>
                {new Date(log.createdAt).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
