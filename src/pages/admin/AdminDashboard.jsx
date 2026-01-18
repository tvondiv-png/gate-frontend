import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-dashboard.css";

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/admin/dashboard").then(res => setData(res.data));
  }, []);

  if (!data) {
    return <p style={{ padding: 40 }}>Carregando dashboard...</p>;
  }

  const formatHoras = (min) => {
    if (!min) return "0h";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}min`;
  };

  return (
    <div className="admin-dashboard">

      <h1>Dashboard Administrativo</h1>

      {/* ===== CARDS ===== */}
      <section className="admin-cards">
        <div className="admin-card destaque">
          <span>Total de Horas (Mês)</span>
          <strong>{formatHoras(data.totalHorasMes)}</strong>
        </div>

        <div className="admin-card">
          <span>RSOs Pendentes</span>
          <strong>{data.pendencias.rsos}</strong>
        </div>

        <div className="admin-card">
          <span>Ausências Pendentes</span>
          <strong>{data.pendencias.ausencias}</strong>
        </div>

        <div className="admin-card">
          <span>Cadastros Pendentes</span>
          <strong>{data.pendencias.cadastros}</strong>
        </div>
      </section>

      {/* ===== POLICIAL DESTAQUE ===== */}
      <section className="admin-section">
        <h2>👮 Policial Destaque do Mês</h2>

        {data.policialDestaque ? (
          <div className="policial-destaque">
            <strong>
              {data.policialDestaque.patente}{" "}
              {data.policialDestaque.nome}
            </strong>
            <span>
              Funcional: {data.policialDestaque.funcional}
            </span>
            <span>
              Horas: {formatHoras(data.policialDestaque.horas)}
            </span>
          </div>
        ) : (
          <p>Sem dados ainda</p>
        )}
      </section>

      {/* ===== PENDÊNCIAS ===== */}
      <section className="admin-section">
        <h2>⚠️ Pendências do Sistema</h2>

        <ul className="pendencias-list">
          <li>
            <span>RSOs aguardando aprovação</span>
            <strong>{data.pendencias.rsos}</strong>
          </li>
          <li>
            <span>Solicitações de cadastro</span>
            <strong>{data.pendencias.cadastros}</strong>
          </li>
          <li>
            <span>Ausências aguardando análise</span>
            <strong>{data.pendencias.ausencias}</strong>
          </li>
        </ul>
      </section>

      {/* ===== ÁREA FUTURA DE GRÁFICOS ===== */}
      <section className="admin-section">
        <h2>📊 Estatísticas</h2>
        <div className="grafico-placeholder">
          Gráficos de desempenho mensal (em breve)
        </div>
      </section>

    </div>
  );
}
