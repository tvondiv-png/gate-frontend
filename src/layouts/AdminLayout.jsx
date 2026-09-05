import {
  Outlet,
  NavLink,
  useNavigate
} from "react-router-dom";

import {
  useMemo,
  useState
} from "react";

import {
  useAuth
} from "../contexts/AuthContext";

import "../styles/admin-layout-premium.css";

export default function AdminLayout() {
  const navigate =
    useNavigate();

  const {
    user,
    logout
  } =
    useAuth();

  const [
    menuAberto,
    setMenuAberto
  ] =
    useState(false);

  /* =========================================================
     GRUPOS DO MENU
  ========================================================= */

  const grupos =
    useMemo(() => {
      const gruposBase = [
        /* ===================================================
           VISÃO GERAL
        =================================================== */

        {
          titulo:
            "Visão Geral",

          itens: [
            {
              to:
                "/admin",

              label:
                "Dashboard",

              icon:
                "📊"
            },

            {
              to:
                "/admin/consulta",

              label:
                "Consulta Policial",

              icon:
                "🔎"
            }
          ]
        },

        /* ===================================================
           EFETIVO
        =================================================== */

        {
          titulo:
            "Efetivo",

          itens: [
            {
              to:
                "/admin/hierarquia",

              label:
                "Hierarquia",

              icon:
                "🪖"
            },

            {
              to:
                "/admin/ausencias",

              label:
                "Ausências",

              icon:
                "📄"
            },

            {
              to:
                "/admin/advertencias",

              label:
                "Advertências",

              icon:
                "⚠️"
            }
          ]
        },

        /* ===================================================
           OPERACIONAL
        =================================================== */

        {
          titulo:
            "Operacional",

          itens: [
            {
              to:
                "/admin/rso",

              label:
                "RSO",

              icon:
                "🚓"
            },

            {
              to:
                "/admin/rso-historico",

              label:
                "Histórico de RSO",

              icon:
                "🕓"
            },

            {
              to:
                "/admin/horas",

              label:
                "Horas de Patrulha",

              icon:
                "⏱️"
            },

            {
              to:
                "/admin/acoes",

              label:
                "Ações",

              icon:
                "🎯"
            },

            {
              to:
                "/admin/apreensoes",

              label:
                "Apreensões",

              icon:
                "📦"
            },

            {
              to:
                "/admin/balanco-operacional",

              label:
                "Balanço Operacional",

              icon:
                "📊"
            }
          ]
        },

        /* ===================================================
           CARREIRA / AVALIAÇÕES
        =================================================== */

        {
          titulo:
            "Carreira e Avaliações",

          itens: [
            {
              to:
                "/admin/indicacoes",

              label:
                "Indicações",

              icon:
                "📨"
            },

            {
              to:
                "/admin/apresentacoes-estagiarios",

              label:
                "Apresentações",

              icon:
                "🧾"
            },

            {
              to:
                "/admin/avaliacoes-estagio",

              label:
                "Avaliações de Estágio",

              icon:
                "🎓"
            },

            {
              to:
                "/admin/requisicoes-cadastrais",

              label:
                "Req. Cadastrais",

              icon:
                "📋"
            }
          ]
        },

        /* ===================================================
           JUSTIÇA / NORMAS
        =================================================== */

        {
          titulo:
            "Justiça e Normas",

          itens: [
            {
              to:
                "/admin/justica",

              label:
                "Justiça & Disciplina",

              icon:
                "⚖️"
            },

            {
              to:
                "/admin/codigo-penal",

              label:
                "Código Penal",

              icon:
                "📘"
            },

            {
              to:
                "/admin/regulamentos",

              label:
                "Regulamentos",

              icon:
                "📚"
            },

            {
              to:
                "/admin/historia",

              label:
                "História do Anchieta",

              icon:
                "🏛️"
            }
          ]
        },

        /* ===================================================
           CONTEÚDO / SISTEMA
        =================================================== */

        {
          titulo:
            "Conteúdo e Sistema",

          itens: [
            {
              to:
                "/admin/galeria",

              label:
                "Galeria",

              icon:
                "🖼️"
            },

            {
              to:
                "/admin/slideshow",

              label:
                "Slideshow",

              icon:
                "🎞️"
            },

            {
              to:
                "/admin/solicitacoes",

              label:
                "Solicitações",

              icon:
                "✅"
            },

            {
              to:
                "/admin/logs",

              label:
                "Logs",

              icon:
                "🧠"
            }
          ]
        }
      ];

      /* =====================================================
         SUPERADMIN
      ===================================================== */

      if (
        user?.role ===
        "superadmin"
      ) {
        gruposBase.splice(
          1,
          0,
          {
            titulo:
              "Superadministração",

            itens: [
              {
                to:
                  "/admin/usuarios",

                label:
                  "Gestão de Usuários",

                icon:
                  "🔐"
              }
            ]
          }
        );
      }

      return gruposBase;
    }, [user]);

  /* =========================================================
     CONTROLE DO MENU
  ========================================================= */

  const fecharMenu = () => {
    setMenuAberto(false);
  };

  const alternarMenu = () => {
    setMenuAberto(
      (prev) => !prev
    );
  };

  /* =========================================================
     NAVEGAÇÃO
  ========================================================= */

  const irParaPainelUsuario =
    () => {
      navigate(
        "/usuario"
      );

      fecharMenu();
    };

  const irParaSelecao =
    () => {
      navigate(
        "/select-panel"
      );

      fecharMenu();
    };

  const irParaHome =
    () => {
      navigate("/");

      fecharMenu();
    };

  /* =========================================================
     LOGOUT
  ========================================================= */

  const fazerLogout =
    () => {
      logout();

      navigate(
        "/login",
        {
          replace: true
        }
      );
    };

  /* =========================================================
     INICIAIS
  ========================================================= */

  const iniciais =
    String(
      user?.nome ||
        "Administrador"
    )
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
     LABEL DA ROLE
  ========================================================= */

  const roleLabel =
    user?.role ===
    "superadmin"
      ? "Superadministrador"
      : "Administrador";

  return (
    <div
      className={`admin-layout-premium ${
        menuAberto
          ? "sidebar-open"
          : ""
      }`}
    >

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">

        {/* ===================================================
            TOPO
        =================================================== */}

        <div className="admin-sidebar-top">

          <div className="admin-brand">

            <div className="admin-brand-logo-wrap">

              <img
                src="/anchieta-logo.png"
                alt="2º BPChq Anchieta"
                className="admin-brand-logo"
              />

            </div>

            <div className="admin-brand-text">

              <strong>
                2º BPChq Anchieta
              </strong>

              <small>
                Administração Institucional
              </small>

            </div>

          </div>

          <button
            type="button"
            className="admin-sidebar-close"
            onClick={
              fecharMenu
            }
            aria-label="Fechar menu"
          >
            ✕
          </button>

        </div>

        {/* ===================================================
            USUÁRIO
        =================================================== */}

        <div className="admin-user-box">

          <div className="admin-user-avatar">
            {iniciais || "A"}
          </div>

          <div className="admin-user-data">

            <strong>
              {user?.patente
                ? `${user.patente} `
                : ""}

              {user?.nome ||
                "Administrador"}
            </strong>

            <span>
              {user?.funcao ||
                "Administração"}
            </span>

            <small>
              {roleLabel}
            </small>

          </div>

        </div>

        {/* ===================================================
            NAVEGAÇÃO
        =================================================== */}

        <nav className="admin-nav">

          {grupos.map(
            (grupo) => (
              <div
                key={
                  grupo.titulo
                }
                className="admin-nav-group"
              >

                <small className="admin-nav-title">
                  {grupo.titulo}
                </small>

                {grupo.itens.map(
                  (item) => (
                    <NavLink
                      key={
                        item.to
                      }
                      to={
                        item.to
                      }
                      end={
                        item.to ===
                        "/admin"
                      }
                      className={({
                        isActive
                      }) =>
                        `admin-nav-link ${
                          isActive
                            ? "active"
                            : ""
                        }`
                      }
                      onClick={
                        fecharMenu
                      }
                    >

                      <span className="admin-nav-icon">
                        {item.icon}
                      </span>

                      <span>
                        {item.label}
                      </span>

                    </NavLink>
                  )
                )}

              </div>
            )
          )}

        </nav>

        {/* ===================================================
            RODAPÉ DA SIDEBAR
        =================================================== */}

        <div className="admin-sidebar-footer">

          <div className="admin-footer-unit">

            <strong>
              2º BPChq
            </strong>

            <span>
              Anchieta
            </span>

          </div>

          <div className="admin-footer-actions">

            {/* ===============================================
                PAINEL DO POLICIAL
            =============================================== */}

            <button
              type="button"
              className="admin-footer-btn user"
              onClick={
                irParaPainelUsuario
              }
            >
              👤 Painel do Policial
            </button>

            {/* ===============================================
                CENTRAL DE PAINÉIS

                Aqui também estará o acesso
                ao Painel ROCAM para quem
                possuir autorização.
            =============================================== */}

            <button
              type="button"
              className="admin-footer-btn panel"
              onClick={
                irParaSelecao
              }
            >
              ▦ Seleção de Painéis
            </button>

            {/* ===============================================
                HOME
            =============================================== */}

            <button
              type="button"
              className="admin-footer-btn home"
              onClick={
                irParaHome
              }
            >
              🏠 Página Inicial
            </button>

            {/* ===============================================
                LOGOUT
            =============================================== */}

            <button
              type="button"
              className="admin-footer-btn logout"
              onClick={
                fazerLogout
              }
            >
              🚪 Encerrar sessão
            </button>

          </div>

        </div>

      </aside>

      {/* =====================================================
          PRINCIPAL
      ===================================================== */}

      <div className="admin-main">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="admin-topbar">

          <div className="admin-topbar-left">

            <button
              type="button"
              className="admin-menu-btn"
              onClick={
                alternarMenu
              }
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <div className="admin-topbar-info">

              <span className="admin-topbar-kicker">
                2º BPChq • Anchieta
              </span>

              <strong>
                Painel Administrativo
              </strong>

            </div>

          </div>

          <div className="admin-topbar-right">

            <div className="admin-topbar-user">

              <small>
                Sessão administrativa
              </small>

              <strong>
                {user?.nome ||
                  "-"}
              </strong>

            </div>

            <div className="admin-topbar-clock">
              {new Date().toLocaleString(
                "pt-BR"
              )}
            </div>

          </div>

        </header>

        {/* ===================================================
            CONTEÚDO DAS ROTAS ADMIN
        =================================================== */}

        <main className="admin-content">
          <Outlet />
        </main>

      </div>

      {/* =====================================================
          OVERLAY MOBILE
      ===================================================== */}

      {menuAberto && (
        <div
          className="admin-sidebar-overlay"
          onClick={
            fecharMenu
          }
        />
      )}

    </div>
  );
}