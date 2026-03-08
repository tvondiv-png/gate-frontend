import { useEffect, useState } from "react";
import api from "../../api/api";

// converte minutos em texto
const formatarTempo = (min = 0) => {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

export default function PatrolHoursAdmin() {
  const [lista, setLista] = useState([]);

  const carregar = async () => {
    const res = await api.get("/api/admin/rso/horas");
    setLista(res.data);
  };

  useEffect(() => {
    carregar();
  }, []);

  const zerarSemana = async () => {
    if (!confirm("Zerar horas semanais de todos?")) return;
    await api.post("/api/admin/rso/horas/zerar-semana");
    carregar();
  };

  const zerarMes = async () => {
    if (!confirm("Zerar horas mensais de todos?")) return;
    await api.post("/api/admin/rso/horas/zerar-mes");
    carregar();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Horas de Patrulhamento</h2>

      <div style={{ marginBottom: 20 }}>
        <button onClick={zerarSemana}>🔄 Zerar Semana</button>{" "}
        <button onClick={zerarMes}>🔄 Zerar Mês</button>
      </div>

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Funcional</th>
            <th>Nome</th>
            <th>Patente</th>
            <th>Status</th>
            <th>Horas Semanais</th>
            <th>Horas Mensais</th>
          </tr>
        </thead>
        <tbody>
          {lista.map(p => (
            <tr key={p._id}>
              <td>{p.funcional}</td>
              <td>{p.nome}</td>
              <td>{p.patente}</td>
              <td>{p.status}</td>
              <td>{formatarTempo(p.horasSemanaMin)}</td>
              <td>{formatarTempo(p.horasMesMin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
