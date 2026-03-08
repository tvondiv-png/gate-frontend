import { useEffect, useState } from "react";
import api from "../../api/api";
import { useAuth } from "../../contexts/AuthContext";


<button
  onClick={async () => {
    const confirmar = window.confirm(
      "⚠️ ATENÇÃO!\n\nIsso irá apagar TODOS os RSOs APROVADOS e REJEITADOS.\n\nEssa ação NÃO pode ser desfeita.\n\nDeseja continuar?"
    );

    if (!confirmar) return;

    try {
      const res = await limparHistoricoRSO();
      alert(`Histórico limpo!\nRSOs apagados: ${res.totalApagados}`);
      window.location.reload();
    } catch (error) {
      alert("Erro ao apagar histórico de RSOs");
    }
  }}
  style={{
    background: "#8e0000",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    marginBottom: "20px"
  }}
>
  🗑️ Apagar Histórico de RSOs
</button>



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
    await api.delete("/api/admin/rso/historico");
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
