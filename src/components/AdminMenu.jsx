import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./admin-menu.css";

export default function AdminMenu() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return null;
  }

  return (
    <aside className="admin-menu">
      <div className="admin-menu-header">
        <strong>GATE</strong>
        <span>Painel Administrativo</span>
      </div>

      <nav className="admin-menu-nav">
        <NavLink to="/admin" end>📊 Dashboard</NavLink>
        <NavLink to="/admin/usuarios">👥 Usuários</NavLink>
        <NavLink to="/admin/solicitacoes">🧾 Cadastros</NavLink>
        <NavLink to="/admin/hierarquia">🧑‍✈️ Hierarquia</NavLink>
        <NavLink to="/admin/consulta">🔍 Consulta Policial</NavLink>
        <NavLink to="/admin/acoes">📋 Registro de Ações</NavLink>
        <NavLink to="/admin/ausencias">⏳ Ausências</NavLink>
        <NavLink to="/admin/advertencias">⚠️ Advertências</NavLink>
        <NavLink to="/admin/avaliacoes-estagio">📝 Avaliação de Estágios</NavLink>
        <NavLink to="/admin/apresentacoes-estagiarios">🧾 Apresentações</NavLink>
        <NavLink to="/admin/sjd">⚖️ SJD • Justiça & Disciplina</NavLink>
        <NavLink to="/admin/horas">⏱️ Horas</NavLink>
        <NavLink to="/admin/indicacoes">📌 Indicações</NavLink>
        <NavLink to="/admin/apreensoes">🚓 Apreensões</NavLink>
        <NavLink to="/admin/codigo-penal">📘 Código Penal</NavLink>

        <div className="admin-menu-divider" />

        <NavLink to="/admin/rso">📋 RSO</NavLink>
        <NavLink to="/admin/rso-historico">🗂️ Histórico RSO</NavLink>

        {user.role === "superadmin" && (
          <>
            <div className="admin-menu-divider" />
            <NavLink to="/admin/logs">🛡️ Logs do Sistema</NavLink>
          </>
        )}

        <div className="admin-menu-divider" />

        <NavLink to="/admin/galeria">🖼️ Galeria</NavLink>
        <NavLink to="/admin/slideshow">🖼️ Slideshow</NavLink>
        <NavLink to="/admin/regulamentos">📘 Regulamentos</NavLink>
      </nav>
    </aside>
  );
}