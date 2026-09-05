import {
  useEffect,
  useState
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router-dom";

import api from "../api/api";

import "../styles/rocam-layout.css";

export default function RocamLayout() {
  const navigate =
    useNavigate();

  const [
    sidebarOpen,
    setSidebarOpen
  ] = useState(false);

  const [
    contexto,
    setContexto
  ] = useState(null);

  const [
    loading,
    setLoading
  ] = useState(true);

  /* =========================================================
     CARREGAR CONTEXTO ROCAM
  ========================================================= */

  const carregarContexto =
    async () => {
      try {
        setLoading(true);

        const res =
          await api.get(
            "/api/rocam/contexto"
          );

        setContexto(
          res.data
        );

      } catch (err) {
        console.error(
          "Erro contexto ROCAM:",
          err
        );

        setContexto(null);

      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    carregarContexto();
  }, []);

  /* =========================================================
     MENU
  ========================================================= */

  const fecharMenu = () => {
    setSidebarOpen(false);
  };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = () => {
    localStorage.removeItem(
      "token"
    );

    navigate(
      "/login",
      {
        replace: true
      }
    );
  };

  /* =========================================================
     DADOS DO USUÁRIO
  ========================================================= */

  const nome =
    contexto?.hierarchy?.nome ||
    contexto?.profile?.nome ||
    "Policial ROCAM";

  const patente =
    contexto?.hierarchy?.patente ||
    contexto?.profile?.patente ||
    "";

  /* =========================================================
     PAPEL ROCAM
  ========================================================= */

  const papel = (() => {
    if (
      contexto?.superadmin
    ) {
      return "SUPERADMIN";
    }

    if (
      contexto?.comandoBatalhao
    ) {
      return "SUPERVISÃO DO BATALHÃO";
    }

    switch (
      contexto?.papelRocam
    ) {
      case "COMANDO_ROCAM":
        return "COMANDO ROCAM";

      case "SUBCOMANDO_ROCAM":
        return "SUBCOMANDO ROCAM";

      case "BRACAL_ROCAM":
        return "BRAÇAL ROCAM";

      case "ESTAGIARIO_ROCAM":
        return "ESTAGIÁRIO ROCAM";

      default:
        return "ROCAM";
    }
  })();

  const iniciais =
    String(nome)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(
        (parte) =>
          parte
            .charAt(0)
            .toUpperCase()
      )
      .join("");

  /* =========================================================
     PERMISSÕES
  ========================================================= */

  const podeGerenciar =
    contexto?.podeGerenciar ===
    true;

  const bracal =
    contexto?.bracal ===
    true;

  const estagiario =
    contexto?.estagiario ===
    true;

  const comandoRocam =
    contexto?.comandoRocam ===
    true;

  const comandoBatalhao =
    contexto?.comandoBatalhao ===
    true;

  const superadmin =
    contexto?.superadmin ===
    true;

  /*
    Usuários que enxergam ferramentas
    administrativas ROCAM.
  */

  const podeComando =
    podeGerenciar ||
    comandoRocam ||
    comandoBatalhao ||
    superadmin;

  /*
    Mensagens e avisos ficam disponíveis
    para todo integrante autorizado.
  */

  const podeComunicar =
    true;

  return (
    <div
      className={`rocam-layout ${
        sidebarOpen
          ? "sidebar-open"
          : ""
      }`}
    >

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="rocam-sidebar">

        {/* ===================================================
            IDENTIDADE ROCAM
        =================================================== */}

        <div className="rocam-sidebar-top">

          <div className="rocam-brand">

            <div className="rocam-brand-logo-wrap">

              <img
                src="/rocam-logo.png"
                alt="ROCAM"
                className="rocam-brand-logo"
              />

            </div>

            <div className="rocam-brand-text">

              <strong>
                ROCAM
              </strong>

              <span>
                2º BPChq • Anchieta
              </span>

            </div>

          </div>

          <button
            type="button"
            className="rocam-sidebar-close"
            onClick={
              fecharMenu
            }
            aria-label="Fechar menu"
          >
            ×
          </button>

        </div>

        {/* ===================================================
            USUÁRIO
        =================================================== */}

        <div className="rocam-user-card">

          <div className="rocam-user-avatar">
            {iniciais || "R"}
          </div>

          <div className="rocam-user-info">

            <strong>
              {nome}
            </strong>

            <span>
              {patente}
            </span>

            <small>
              {papel}
            </small>

          </div>

        </div>

        {/* ===================================================
            MENU
        =================================================== */}

        <nav className="rocam-nav">

          {/* =================================================
              GERAL ROCAM
          ================================================= */}

          <div className="rocam-nav-group">

            <span className="rocam-nav-title">
              ROCAM
            </span>

            <NavLink
              to="/rocam"
              end
              className={({
                isActive
              }) =>
                `rocam-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
              onClick={
                fecharMenu
              }
            >

              <span className="rocam-nav-icon">
                ◈
              </span>

              Meu Dashboard

            </NavLink>

            <NavLink
              to="/rocam/hierarquia"
              className={({
                isActive
              }) =>
                `rocam-nav-link ${
                  isActive
                    ? "active"
                    : ""
                }`
              }
              onClick={
                fecharMenu
              }
            >

              <span className="rocam-nav-icon">
                ◫
              </span>

              Hierarquia ROCAM

            </NavLink>

          </div>

          {/* =================================================
              ESTAGIÁRIO ROCAM
          ================================================= */}

          {estagiario && (
            <div className="rocam-nav-group">

              <span className="rocam-nav-title">
                MEU ESTÁGIO
              </span>

              <NavLink
                to="/rocam"
                end
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  %
                </span>

                Meu Progresso

              </NavLink>

            </div>
          )}

          {/* =================================================
              BRAÇAL ROCAM
          ================================================= */}

          {bracal && (
            <div className="rocam-nav-group">

              <span className="rocam-nav-title">
                BRAÇAL ROCAM
              </span>

              <NavLink
                to="/rocam/avaliar-estagiarios"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  ✓
                </span>

                Avaliar Estagiários

              </NavLink>

            </div>
          )}

          {/* =================================================
              COMANDO ROCAM
          ================================================= */}

          {podeComando && (
            <div className="rocam-nav-group">

              <span className="rocam-nav-title">
                COMANDO ROCAM
              </span>

              {/* ESTRUTURA DE COMANDO */}

              <NavLink
                to="/rocam/comando"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  ★
                </span>

                Comando ROCAM

              </NavLink>

              {/* NOVO ESTAGIÁRIO */}

              <NavLink
                to="/rocam/novo-estagiario"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  +
                </span>

                Novo Estagiário

              </NavLink>

              {/* ESTAGIÁRIOS */}

              <NavLink
                to="/rocam/estagiarios"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  ◎
                </span>

                Estagiários

              </NavLink>

              {/* BRAÇAIS */}

              <NavLink
                to="/rocam/bracais"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  ◆
                </span>

                Braçais ROCAM

              </NavLink>

              {/* METAS */}

              <NavLink
                to="/rocam/metas"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  %
                </span>

                Metas

              </NavLink>

              {/* AVALIAÇÕES */}

              <NavLink
                to="/rocam/avaliacoes"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  ✓
                </span>

                Avaliações

              </NavLink>

            </div>
          )}

          {/* =================================================
              COMUNICAÇÃO
          ================================================= */}

          {podeComunicar && (
            <div className="rocam-nav-group">

              <span className="rocam-nav-title">
                COMUNICAÇÃO
              </span>

              <NavLink
                to="/rocam/mensagens"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  ✉
                </span>

                Mensagens

              </NavLink>

              <NavLink
                to="/rocam/avisos"
                className={({
                  isActive
                }) =>
                  `rocam-nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
                onClick={
                  fecharMenu
                }
              >

                <span className="rocam-nav-icon">
                  !
                </span>

                Avisos

              </NavLink>

            </div>
          )}

        </nav>

        {/* ===================================================
            FOOTER
        =================================================== */}

        <div className="rocam-sidebar-footer">

          <button
            type="button"
            className="rocam-footer-btn"
            onClick={() =>
              navigate(
                "/select-panel"
              )
            }
          >
            Trocar de painel
          </button>

          <button
            type="button"
            className="rocam-footer-btn danger"
            onClick={
              logout
            }
          >
            Sair
          </button>

        </div>

      </aside>

      {/* =====================================================
          OVERLAY MOBILE
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="rocam-sidebar-overlay"
          onClick={
            fecharMenu
          }
        />
      )}

      {/* =====================================================
          PRINCIPAL
      ===================================================== */}

      <main className="rocam-main">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="rocam-topbar">

          <div className="rocam-topbar-left">

            <button
              type="button"
              className="rocam-menu-btn"
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <div className="rocam-topbar-info">

              <strong>
                Painel ROCAM
              </strong>

              <span>
                2º Batalhão de Polícia
                de Choque • Anchieta
              </span>

            </div>

          </div>

          <div className="rocam-topbar-status">

            {loading
              ? "Carregando..."
              : papel}

          </div>

        </header>

        {/* ===================================================
            CONTEÚDO
        =================================================== */}

        <div className="rocam-content">

          <Outlet
            context={{
              contexto,

              reloadContext:
                carregarContexto
            }}
          />

        </div>

      </main>

    </div>
  );
}