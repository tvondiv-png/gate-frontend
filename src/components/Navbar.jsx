import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/navbar.css";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const sair = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="gate-navbar">
      <div className="gate-navbar-left">
        <span className="gate-logo">4º BPCHQ • GATE</span>
      </div>

      <nav className="gate-navbar-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/hierarquia">Hierarquia</NavLink>
        <NavLink to="/regulamentos">Regulamentos</NavLink>
        <NavLink to="/galeria">Galeria</NavLink>

        {user && (
          <>
            <NavLink to="/usuario">Painel Usuário</NavLink>

            {(user.role === "admin" || user.role === "superadmin") && (
              <NavLink to="/admin">Painel ADM</NavLink>
            )}

            <button className="logout-btn" onClick={sair}>
              Sair
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
