import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../styles/comando-layout.css";

export default function ComandoLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [menuAberto, setMenuAberto] = useState(false);

  const menu = useMemo(() => {
    return [
      {
        titulo: "Centro de Decisão",
        itens: [
          {
            to: "/comando",
            label: "Dashboard Estratégico",
            icon: "🎯",
            end: true
          }
        ]
      },

      {
        titulo: "Operações",
        itens: [
          {
            to: "/comando/efetivo",
            label: "Efetivo",
            icon: "👥"
          },
          {
            to: "/comando/patrulha",
            label: "Patrulhamento",
            icon: "🚓"
          },
          {
            to: "/comando/produtividade",
            label: "Produtividade",
            icon: "📈"
          },
          {
            to: "/comando/metas",
            label: "Metas do Comando",
            icon: "🎯"
          },
          {
            to: "/comando/consultas",
            label: "Consulta Policial",
            icon: "🔎"
          }
        ]
      },

      {
        titulo: "Gestão Institucional",
        itens: [
          {
            to: "/comando/disciplina",
            label: "Justiça & Disciplina",
            icon: "⚖️"
          },
          {
            to: "/comando/comunicados",
            label: "Comunicados",
            icon: "📢"
          },
          {
            to: "/comando/desempenho",
            label: "Desempenho",
            icon: "📊"
          },
          {
            to: "/comando/alto-comando",
            label: "Alto Comando",
            icon: "🛡️"
          }
        ]
      }
    ];
  }, []);

  const fecharMenu = () => {
    setMenuAberto(false);
  };

  const irParaSelecao = () => {
    navigate("/select-panel");
    fecharMenu();
  };

  const irParaPainelUsuario = () => {
    navigate("/usuario");
    fecharMenu();
  };

  const irParaHome = () => {
    navigate("/");
    fecharMenu();
  };

  const fazerLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`comando-layout ${
        menuAberto ? "sidebar-open" : ""
      }`}
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="comando-sidebar">

        {/* ===================================================
            TOPO
        =================================================== */}

        <div className="comando-sidebar-top">

          <div className="comando-brand">

            <div className="comando-brand-logo-wrap">
              <img
                src="/anchieta-logo.png"
                alt="2º BPChq Anchieta"
                className="comando-brand-logo"
              />
            </div>

            <div className="comando-brand-text">
              <strong>
                Centro de Comando
              </strong>

              <small>
                2º BPChq • Anchieta
              </small>
            </div>

          </div>

          <button
            className="comando-sidebar-close"
            onClick={fecharMenu}
            type="button"
            aria-label="Fechar menu"
          >
            ✕
          </button>

        </div>

        {/* ===================================================
            IDENTIFICAÇÃO
        =================================================== */}

        <div className="comando-user-card">

          <div className="comando-user-avatar">
            {String(
              user?.nome || "C"
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div className="comando-user-info">

            <strong>
              {user?.patente
                ? `${user.patente} `
                : ""}
              {user?.nome || "Comando"}
            </strong>

            <span>
              {user?.funcao || "-"}
            </span>

            <small>
              Acesso estratégico
            </small>

          </div>

        </div>

        {/* ===================================================
            NAVEGAÇÃO
        =================================================== */}

        <nav className="comando-nav">

          {menu.map((grupo) => (
            <div
              key={grupo.titulo}
              className="comando-nav-group"
            >

              <small className="comando-nav-title">
                {grupo.titulo}
              </small>

              {grupo.itens.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={!!item.end}
                  className={({ isActive }) =>
                    `comando-nav-link ${
                      isActive ? "active" : ""
                    }`
                  }
                  onClick={fecharMenu}
                >
                  <span className="comando-nav-icon">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              ))}

            </div>
          ))}

        </nav>

        {/* ===================================================
            RODAPÉ
        =================================================== */}

        <div className="comando-sidebar-footer">

          <div className="comando-footer-unit">
            <strong>
              2º BPChq Anchieta
            </strong>

            <span>
              Centro Estratégico
            </span>
          </div>

          <div className="comando-footer-actions">

            <button
              className="comando-footer-btn user"
              type="button"
              onClick={irParaPainelUsuario}
            >
              👤 Painel do Policial
            </button>

            <button
              className="comando-footer-btn panel"
              type="button"
              onClick={irParaSelecao}
            >
              ▦ Seleção de Painéis
            </button>

            <button
              className="comando-footer-btn home"
              type="button"
              onClick={irParaHome}
            >
              🏠 Página Inicial
            </button>

            <button
              className="comando-footer-btn danger"
              type="button"
              onClick={fazerLogout}
            >
              🚪 Encerrar sessão
            </button>

          </div>

        </div>

      </aside>

      {/* =====================================================
          ÁREA PRINCIPAL
      ===================================================== */}

      <div className="comando-main">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="comando-topbar">

          <div className="comando-topbar-left">

            <button
              className="comando-menu-btn"
              onClick={() =>
                setMenuAberto(
                  (prev) => !prev
                )
              }
              type="button"
              aria-label="Abrir menu"
            >
              ☰
            </button>

            <div className="comando-topbar-info">

              <span className="comando-topbar-kicker">
                COMANDO DO BATALHÃO
              </span>

              <strong>
                Centro Estratégico • 2º BPChq Anchieta
              </strong>

            </div>

          </div>

          <div className="comando-topbar-right">

            <div className="comando-topbar-user">
              <small>
                Autoridade
              </small>

              <strong>
                {user?.funcao || "-"}
              </strong>
            </div>

            <div className="comando-topbar-clock">
              {new Date().toLocaleString(
                "pt-BR"
              )}
            </div>

          </div>

        </header>

        {/* ===================================================
            CONTEÚDO
        =================================================== */}

        <main className="comando-content">
          <Outlet />
        </main>

      </div>

      {/* =====================================================
          OVERLAY MOBILE
      ===================================================== */}

      {menuAberto && (
        <div
          className="comando-sidebar-overlay"
          onClick={fecharMenu}
        />
      )}

    </div>
  );
}