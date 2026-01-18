import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";

export default function RSOHistoryAdmin() {
  const [lista, setLista] = useState([]);
  const { user } = useAuth();

  const carregar = async () => {
    const res = await api.get("/api/admin/rso/historico");
    setLista(res.data);
  };

  useEffect(() => {
    carregar();
  }, []);

  const apagarTudo = async () => {
    if (!confirm("⚠️ Apagar TODO o histórico de RSOs?")) return;
    await api.delete("/admin/rso/historico");
    carregar();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Histórico de RSOs</h2>

      {user?.role === "superadmin" && (
        <button
          onClick={apagarTudo}
          style={{ background: "darkred", color: "#fff", marginBottom: 20 }}
        >
          🔴 Apagar Histórico
        </button>
      )}

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Viatura</th>
            <th>Total Horas</th>
            <th>Aprovado em</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(h => (
            <tr key={h._id}>
              <td>{h.viatura}</td>
              <td>{Math.floor(h.totalMinutos / 60)}h {h.totalMinutos % 60}min</td>
              <td>{new Date(h.dataAprovacao).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
