import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import AdminMenu from "../components/AdminMenu";

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const sair = () => {
    logout();
    navigate("/");
  };

  return (
    <div>
      {/* TOPO ADM */}
      <header
        style={{
          height: 70,
          background: "#020617",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 30px"
        }}
      >
        <strong>GATE • Painel Administrativo</strong>

        <button
          onClick={sair}
          style={{
            background: "red",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            cursor: "pointer"
          }}
        >
          Sair
        </button>
      </header>

      {/* CORPO */}
      <div style={{ display: "flex" }}>
        {/* MENU LATERAL */}
        <aside style={{ width: 260 }}>
          <AdminMenu />
        </aside>

        {/* CONTEÚDO */}
        <main style={{ flex: 1, padding: 30 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
