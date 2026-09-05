import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuAberto, setMenuAberto] = useState(false);

  const sair = () => {
    logout();
    navigate("/");
    setMenuAberto(false);
  };

  const fecharMenu = () => {
    setMenuAberto(false);
  };

  return (
    <header className="gate-navbar">
      <div className="gate-navbar-inner">

        <div
          className="gate-navbar-left"
          onClick={() => navigate("/")}
        >
          <img
            src="/anchieta-logo.png"
            alt="Brasão do 2º BPChq Anchieta"
            className="gate-navbar-logo"
          />

          <div className="gate-navbar-brand">
            <strong>2º BPChq • ANCHIETA</strong>
            <small>Sistema Operacional</small>
          </div>
        </div>

        <button
          className="gate-navbar-menu-btn"
          onClick={() =>
            setMenuAberto((prev) => !prev)
          }
          aria-label="Abrir menu"
        >
          ☰
        </button>

        <nav
          className={`gate-navbar-links ${
            menuAberto ? "open" : ""
          }`}
        >
          <NavLink
            to="/"
            end
            onClick={fecharMenu}
          >
            Início
          </NavLink>

          <NavLink
            to="/hierarquia"
            onClick={fecharMenu}
          >
            Hierarquia
          </NavLink>

          <NavLink
            to="/regulamentos"
            onClick={fecharMenu}
          >
            Regulamentos
          </NavLink>

          <NavLink
            to="/historia"
            onClick={fecharMenu}
          >
            História
          </NavLink>

          <NavLink
            to="/galeria"
            onClick={fecharMenu}
          >
            Galeria
          </NavLink>

          {!user && (
            <>
              <button
                className="gate-navbar-ghost-btn"
                onClick={() => {
                  navigate("/cadastro");
                  fecharMenu();
                }}
              >
                Solicitar Cadastro
              </button>

              <button
                className="gate-navbar-primary-btn"
                onClick={() => {
                  navigate("/login");
                  fecharMenu();
                }}
              >
                Entrar
              </button>
            </>
          )}

          {user && (
            <>
              <NavLink
                to="/usuario"
                onClick={fecharMenu}
              >
                Meu Painel
              </NavLink>

              {(user.role === "admin" ||
                user.role === "superadmin") && (
                <NavLink
                  to="/admin"
                  onClick={fecharMenu}
                >
                  Administração
                </NavLink>
              )}

              <button
                className="logout-btn"
                onClick={sair}
              >
                Sair
              </button>
            </>
          )}
        </nav>

      </div>
    </header>
  );
}