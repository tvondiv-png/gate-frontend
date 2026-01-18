import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "../styles/select-panel.css";

export default function SelectPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    // Usuário comum não entra aqui
    if (user.role === "user") {
      navigate("/usuario");
    }
  }, [user, navigate]);

  if (!user) return null;
  if (user.role === "user") return null;

  return (
    <div className="select-panel-page">
      <div className="select-panel-box">
        <h1>Selecione o Painel</h1>
        <p className="subtitle">
          Escolha como deseja acessar o sistema
        </p>

        <div className="select-panel-cards">
          {/* USUÁRIO */}
          <div className="panel-card" onClick={() => navigate("/usuario")}>
            <span className="icon">👤</span>
            <h2>Painel do Usuário</h2>
            <p>
              RSO, solicitações, notificações e acompanhamento pessoal
            </p>
            <button>Entrar</button>
          </div>

          {/* ADMIN */}
          <div className="panel-card admin" onClick={() => navigate("/admin")}>
            <span className="icon">🛡️</span>
            <h2>Painel Administrativo</h2>
            <p>
              Gestão geral, hierarquia, RSO, ausências e controle total
            </p>
            <button>Entrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
