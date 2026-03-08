import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { carregarDashboardUsuario } from "../../services/userDashboardService";

import AbsenceRequest from "./AbsenceRequest";
import Notifications from "./UserNotifications";
import RSOUser from "./RSOUser";
import IndicationUser from "./IndicationUser";

import "./user-dashboard.css";

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("home");
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/entrar");
      return;
    }

    const carregar = async () => {
      try {
        const data = await carregarDashboardUsuario();
        setDashboard(data);
      } catch (e) {
        console.error("Erro ao carregar dashboard", e);
      }
    };

    carregar();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="user-dashboard">

      {/* HEADER */}
      <header className="user-header">
        <h1>Painel do Usuário</h1>
        <p>{user.nome} — {user.patente}</p>
      </header>

      {/* DASHBOARD */}
      {view === "home" && (
        <section className="user-stats">

          <div className="stat-card">
            <span className="stat-number">
              {dashboard ? `${dashboard.horas.mes} min` : "—"}
            </span>
            <span className="stat-label">Horas no Mês</span>
          </div>

          <div className="stat-card">
            <span className="stat-number">
              {dashboard ? `${dashboard.horas.semana} min` : "—"}
            </span>
            <span className="stat-label">Horas na Semana</span>
          </div>

          <div className="stat-card">
            <span className="stat-number">
              {dashboard ? dashboard.notificacoesNaoLidas : "—"}
            </span>
            <span className="stat-label">Notificações</span>
          </div>

          <div className="stat-card">
            <span className="stat-number">—</span>
            <span className="stat-label">Indicações</span>
          </div>

        </section>
      )}

      {/* MENU */}
      <nav className="user-menu">
        <button onClick={() => setView("home")}>Dashboard</button>
        <button onClick={() => setView("rso")}>RSO</button>
        <button onClick={() => setView("absence")}>Ausência</button>
        <button onClick={() => setView("indication")}>Indicação</button>
        <button onClick={() => setView("notifications")}>Notificações</button>
        <button onClick={() => navigate("/")}>Home</button>
      </nav>

      {/* CONTEÚDO */}
      <section className="user-content">
        {view === "rso" && <RSOUser />}
        {view === "absence" && <AbsenceRequest />}
        {view === "indication" && <IndicationUser />}
        {view === "notifications" && <Notifications />}
      </section>

    </div>
  );
}
