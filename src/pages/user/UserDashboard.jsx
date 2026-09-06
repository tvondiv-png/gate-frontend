import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { carregarDashboardUsuario } from "../../services/userDashboardService";
import api from "../../api/api";

import AbsenceRequest from "./AbsenceRequest";
import Notifications from "./UserNotifications";
import RSOUser from "./RSOUser";
import IndicationUser from "./IndicationUser";
import ApresentacaoEstagiariosUser from "./ApresentacaoEstagiariosUser";
import AvaliacaoEstagiosUser from "./AvaliacaoEstagiosUser";
import UserActions from "./UserActions";
import UserProfileRequests from "./UserProfileRequests";
import UserPenalCode from "./UserPenalCode";

import "./user-dashboard.css";
import "../../styles/comando-metas.css";

import { useToast } from "../../contexts/ToastContext";
export default function UserDashboard() {
  const toast = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState("home");
  const [dashboard, setDashboard] = useState(null);
  const [advertencia, setAdvertencia] = useState(null);
  const [loading, setLoading] = useState(true);

  const [comunicadosComando, setComunicadosComando] = useState([]);
  const [altoComandoAtivo, setAltoComandoAtivo] = useState(null);

  const [metasComando, setMetasComando] = useState([]);
  const [metasTemNaoVista, setMetasTemNaoVista] = useState(false);

  const formatarHoras = (min) => {
    if (!min) return "0h";

    const horas = Math.floor(min / 60);
    const minutos = min % 60;

    if (horas === 0) return `${minutos}min`;
    if (minutos === 0) return `${horas}h`;

    return `${horas}h ${minutos}min`;
  };

  const formatarDataHora = (valor) => {
    if (!valor) return "-";
    return new Date(valor).toLocaleString("pt-BR");
  };

  const getAdvertenciasAcumuladas = (tipo) => {
  if (tipo === "ADV 3") return ["ADV 1", "ADV 2", "ADV 3"];
  if (tipo === "ADV 2") return ["ADV 1", "ADV 2"];
  if (tipo === "ADV 1") return ["ADV 1"];
  return [];
};

  useEffect(() => {
    if (!user) {
      navigate("/entrar");
      return;
    }

    const carregar = async () => {
      setLoading(true);

      try {
        const [dashboardData, advertenciaRes, comunicadoRes, altoRes, metasRes] =
          await Promise.allSettled([
            carregarDashboardUsuario(),
            api.get("/api/advertencias/minha"),
            api.get("/api/comando/comunicado/usuario"),
            api.get("/api/high-command-notices/active"),
            api.get("/api/user/dashboard/metas")
          ]);

        if (metasRes.status === "fulfilled") {
          setMetasComando(
            Array.isArray(metasRes.value.data?.metas)
              ? metasRes.value.data.metas
              : []
          );
          setMetasTemNaoVista(!!metasRes.value.data?.temNaoVista);
        } else {
          setMetasComando([]);
          setMetasTemNaoVista(false);
        }

        if (dashboardData.status === "fulfilled") {
          setDashboard(dashboardData.value);
        } else {
          setDashboard(null);
        }

        if (advertenciaRes.status === "fulfilled") {
          setAdvertencia(advertenciaRes.value.data);
        } else {
          setAdvertencia(null);
        }

        if (comunicadoRes.status === "fulfilled") {
          setComunicadosComando(
            Array.isArray(comunicadoRes.value.data) ? comunicadoRes.value.data : []
          );
        } else {
          setComunicadosComando([]);
        }

        if (altoRes.status === "fulfilled") {
          setAltoComandoAtivo(altoRes.value.data || null);
        } else {
          setAltoComandoAtivo(null);
        }
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [user, navigate]);

  useEffect(() => {
    const existeCriticoPendente = comunicadosComando.some(
      (item) => item.prioridade === "CRITICA" && item.exigeCiencia && !item.ciente
    );

    if (existeCriticoPendente) {
      const audio = new Audio("/alert.mp3");
      audio.play().catch(() => {});
    }
  }, [comunicadosComando]);

  const comunicadosOrdenados = [...comunicadosComando].sort((a, b) => {
    const peso = {
      CRITICA: 4,
      ALTA: 3,
      MEDIA: 2,
      BAIXA: 1
    };

    const pesoA = peso[a.prioridade] || 0;
    const pesoB = peso[b.prioridade] || 0;

    if (pesoB !== pesoA) return pesoB - pesoA;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const existeCriticoPendente = comunicadosOrdenados.some(
    (item) => item.prioridade === "CRITICA" && item.exigeCiencia && !item.ciente
  );

  const cardsResumo = useMemo(() => {
  return [
    {
      titulo: "Horas no mês",
      valor: dashboard ? formatarHoras(dashboard.horas?.mes) : "—",
      subtitulo: "Total acumulado no mês operacional",
      destaque: true
    },
    {
      titulo: "Horas na semana",
      valor: dashboard ? formatarHoras(dashboard.horas?.semana) : "—",
      subtitulo: "Controle semanal de patrulhamento"
    },
    {
      titulo: "Notificações",
      valor: dashboard ? dashboard.notificacoesNaoLidas || 0 : "—",
      subtitulo: "Mensagens ainda não lidas"
    },
    {
      titulo: "Ações",
      valor: dashboard ? dashboard.totalAcoes || 0 : "—",
      subtitulo: "Total de ações aprovadas"
    }
  ];
}, [dashboard]);

  const marcarMetasVistas = async () => {
    try {
      await api.post("/api/user/dashboard/metas/vistas");
      setMetasTemNaoVista(false);
      setMetasComando((prev) => prev.map((m) => ({ ...m, vista: true })));
    } catch {
      /* silencioso */
    }
  };

  const atalhos = [
    { key: "rso", label: "RSO", icon: "🚓" },
    { key: "acoes", label: "Ações", icon: "🎯" },
    { key: "absence", label: "Ausência", icon: "📄" },
    { key: "indication", label: "Indicação", icon: "📌" },
    { key: "apresentacao", label: "Apresentação", icon: "🧾" },
    { key: "avaliacao-estagio", label: "Avaliação", icon: "📝" },
    { key: "notifications", label: "Notificações", icon: "🔔" },
    { key: "requisicoes", label: "Requisições", icon: "📨" },
    { key: "codigo-penal", label: "Código Penal", icon: "📘" }
  ];

  if (!user) return null;

  return (
    <div className="user-dashboard-premium">
      <div className="user-dashboard-bg" />
      <div className="user-dashboard-overlay" />

      <header className="user-dashboard-hero">
        <div className="user-dashboard-hero-left">
          <span className="user-dashboard-kicker">2º BPChq • CENTRAL OPERACIONAL</span>
          <h1>Painel do Usuário</h1>
          <p>
            Acompanhe sua rotina operacional, registros, notificações e demandas
            administrativas em um único ambiente.
          </p>

          <div className="user-dashboard-identidade">
            <div className="user-avatar-badge">
              {String(user.nome || "U").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>
                {user.patente} {user.nome}
              </strong>
              <span>Funcional: {user.funcional || "-"}</span>
            </div>
          </div>
        </div>

        <div className="user-dashboard-hero-right">
          <div className="user-hero-info-card">
            <small>Status</small>
            <strong>Em Serviço</strong>
          </div>

          <div className="user-hero-info-card">
            <small>Última atualização</small>
            <strong>{formatarDataHora(new Date())}</strong>
          </div>

          <div className="user-hero-info-card">
            <small>Painel atual</small>
            <strong>
              {view === "home"
                ? "Dashboard"
                : view === "apresentacao"
                ? "Apresentação"
                : view === "absence"
                ? "Ausência"
                : view === "indication"
                ? "Indicação"
                : view === "avaliacao-estagio"
                ? "Avaliação"
                : view === "notifications"
                ? "Notificações"
                : view === "acoes"
                ? "Ações"
                : view === "requisicoes"
                ? "Requisições"
                : view === "codigo-penal"
                ? "Código Penal"
                : "RSO"}
            </strong>
          </div>
        </div>
      </header>

      {altoComandoAtivo && (
        <section
          className="user-warning-banner"
          style={{ borderLeft: "6px solid #dc2626" }}
        >
          <div className="user-warning-icon">🚨</div>

          <div className="user-warning-content">
            <h3>Alerta do Alto Comando</h3>
            <p><strong>{altoComandoAtivo.titulo}</strong></p>
            <p>{altoComandoAtivo.mensagem}</p>
          </div>
        </section>
      )}

      {comunicadosOrdenados.length > 0 && (
        <section
          className={`user-warning-banner ${existeCriticoPendente ? "critico-bloqueante" : ""}`}
          style={{
            borderLeft: existeCriticoPendente
              ? "6px solid #dc2626"
              : "6px solid #2563eb"
          }}
        >
          <div className="user-warning-icon">
            {existeCriticoPendente ? "🚨" : "📢"}
          </div>

          <div className="user-warning-content">
            <h3>
              {existeCriticoPendente
                ? "ORDEM OPERACIONAL CRÍTICA"
                : "Comunicado do Comando"}
            </h3>

            {comunicadosOrdenados.map((item) => (
              <div
                key={item._id}
                className={`comunicado-item prioridade-${String(
                  item.prioridade || "MEDIA"
                ).toLowerCase()}`}
                style={{ marginBottom: 14 }}
              >
                <p><strong>{item.titulo}</strong></p>
                <p>{item.mensagem}</p>
                <p><strong>Prioridade:</strong> {item.prioridade || "MEDIA"}</p>

                {item.exigeCiencia && !item.ciente && (
                  <button
                    className="user-home-btn"
                    type="button"
                    onClick={async () => {
                      try {
                        await api.post(`/api/comando/comunicado/${item._id}/ciente`);
                        setComunicadosComando((prev) =>
                          prev.map((c) =>
                            c._id === item._id ? { ...c, ciente: true } : c
                          )
                        );
                      } catch (err) {
                        console.error(err);
                        toast.error("Erro ao registrar ciência.");
                      }
                    }}
                  >
                    Confirmar ciência
                  </button>
                )}

                {item.exigeCiencia && item.ciente && (
                  <p style={{ color: "#22c55e", fontWeight: 700 }}>
                    ✔ Ciência registrada
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {advertencia && (
        <section className="user-warning-banner">
          <div className="user-warning-icon">⚠</div>

          <div className="user-warning-content">
            <h3>Notificação Administrativa</h3>
            <p>
              Prezado <strong>{advertencia.patente} {advertencia.nome}</strong>,
              consta em seu registro uma notificação referente à semana{" "}
              <strong>{advertencia.semanaReferencia}</strong>.
            </p>
            <p>Situação aplicada:</p>

<div className="advertencia-badges-user">
  {getAdvertenciasAcumuladas(advertencia.tipo).map((adv) => (
    <span
      key={adv}
      className={`advertencia-badge-user ${
        adv === "ADV 3"
          ? "adv3"
          : adv === "ADV 2"
          ? "adv2"
          : "adv1"
      }`}
    >
      {adv}
    </span>
  ))}
</div>
            <p>
              Solicitamos contato com o Comando para esclarecimentos e regularização
              da situação operacional.
            </p>
          </div>
        </section>
      )}

      {metasComando.length > 0 && metasTemNaoVista && (
        <section className="user-warning-banner user-metas-banner">
          <div className="user-warning-icon">🎯</div>
          <div className="user-warning-content">
            <h3>Atenção: meta estabelecida pelo Comando</h3>
            <p>
              O Comando publicou{" "}
              <strong>
                {metasComando.length} meta
                {metasComando.length > 1 ? "s" : ""}
              </strong>{" "}
              para você. Acompanhe o cumprimento no seu painel.
            </p>
            <button
              className="user-home-btn"
              type="button"
              onClick={marcarMetasVistas}
            >
              Estou ciente
            </button>
          </div>
        </section>
      )}

      <section className="user-dashboard-menu-section">
        <div className="user-dashboard-menu-top">
          <div>
            <h2>Navegação rápida</h2>
            <span>Escolha o módulo que deseja acessar.</span>
          </div>

          <button
            className="user-home-btn"
            type="button"
            onClick={() => setView("home")}
          >
            Dashboard
          </button>
        </div>

        <div className="user-dashboard-menu-grid">
          {atalhos.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`user-dashboard-menu-card ${view === item.key ? "active" : ""}`}
              onClick={() => setView(item.key)}
            >
              <span className="icon">{item.icon}</span>
              <strong>{item.label}</strong>
            </button>
          ))}

          <button
            type="button"
            className="user-dashboard-menu-card home-link"
            onClick={() => navigate("/")}
          >
            <span className="icon">🏠</span>
            <strong>Home</strong>
          </button>
        </div>
      </section>

      {view === "home" && (
        <>
          {metasComando.length > 0 && (
            <section className="user-dashboard-menu-section">
              <div className="user-dashboard-menu-top">
                <div>
                  <h2>Minhas metas do Comando</h2>
                  <span>Acompanhamento do que o Comando estabeleceu para você.</span>
                </div>
              </div>

              <div className="user-metas-lista">
                {metasComando.map((m) => {
                  const pct = Math.max(0, Math.min(100, Number(m.percentual || 0)));
                  const unid = m.tipo === "HORAS" ? "h" : "ações";
                  return (
                    <div key={m._id} className="user-meta-item">
                      <h4>{m.titulo}</h4>
                      <div className="um-meta-info">
                        {m.tipo === "HORAS" ? "Horas de patrulhamento" : "Ações aprovadas"}{" "}
                        · {m.periodo === "MENSAL" ? "no mês" : "na semana"} · meta{" "}
                        {m.valorAlvo} {unid} · prazo{" "}
                        {new Date(m.dataFim).toLocaleDateString("pt-BR")}
                      </div>
                      {m.descricao && (
                        <p className="um-meta-info" style={{ marginTop: -4 }}>
                          {m.descricao}
                        </p>
                      )}
                      <div className="user-meta-bar">
                        <div
                          className="user-meta-bar-fill"
                          style={{
                            width: `${pct}%`,
                            background:
                              pct >= 100
                                ? "#3fb950"
                                : "linear-gradient(90deg,#c9a24d,#e6c982)"
                          }}
                        />
                      </div>
                      <div className="user-meta-progress-label">
                        <span>
                          {m.atual} / {m.alvo} {unid}
                        </span>
                        {m.atingiu ? (
                          <span className="user-meta-ok">✓ Meta atingida</span>
                        ) : (
                          <span>{pct}%</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="user-summary-grid">
            {cardsResumo.map((card, index) => (
              <div
                key={index}
                className={`user-summary-card ${card.destaque ? "destaque" : ""}`}
              >
                <small>{card.titulo}</small>
                <strong>{card.valor}</strong>
                <span>{card.subtitulo}</span>
              </div>
            ))}
          </section>

          <section className="user-home-main-grid">
            <div className="user-home-panel">
              <div className="user-section-title">
                <div>
                  <h3>Visão geral operacional</h3>
                  <span>Resumo da sua situação atual no sistema.</span>
                </div>
              </div>

              {loading ? (
                <div className="user-empty-state">Carregando dashboard...</div>
              ) : (
                <div className="user-info-grid">
                  <div className="user-info-box">
                    <small>Perfil</small>
                    <strong>{user.patente}</strong>
                    <span>{user.nome}</span>
                  </div>

                  <div className="user-info-box">
                    <small>Funcional</small>
                    <strong>{user.funcional || "-"}</strong>
                    <span>Identificação operacional</span>
                  </div>

                  <div className="user-info-box">
                    <small>Horas na semana</small>
                    <strong>
                      {dashboard ? formatarHoras(dashboard.horas?.semana) : "—"}
                    </strong>
                    <span>Controle semanal</span>
                  </div>

                  <div className="user-info-box">
                    <small>Horas no mês</small>
                    <strong>
                      {dashboard ? formatarHoras(dashboard.horas?.mes) : "—"}
                    </strong>
                    <span>Acumulado mensal</span>
                  </div>
                </div>
              )}
            </div>

            <div className="user-home-panel">
              <div className="user-section-title">
                <div>
                  <h3>Atalhos operacionais</h3>
                  <span>Acesso direto aos módulos mais utilizados.</span>
                </div>
              </div>

              <div className="user-quick-actions">
                <button type="button" className="user-quick-action" onClick={() => setView("rso")}>
                  <span>🚓</span>
                  <div>
                    <strong>RSO</strong>
                    <small>Registro de serviço operacional</small>
                  </div>
                </button>

                <button type="button" className="user-quick-action" onClick={() => setView("acoes")}>
                  <span>🎯</span>
                  <div>
                    <strong>Ações</strong>
                    <small>Registrar e consultar ações</small>
                  </div>
                </button>

                <button type="button" className="user-quick-action" onClick={() => setView("notifications")}>
                  <span>🔔</span>
                  <div>
                    <strong>Notificações</strong>
                    <small>Avisos administrativos</small>
                  </div>
                </button>

                <button type="button" className="user-quick-action" onClick={() => setView("absence")}>
                  <span>📄</span>
                  <div>
                    <strong>Ausência</strong>
                    <small>Solicitar afastamento</small>
                  </div>
                </button>

                <button type="button" className="user-quick-action" onClick={() => setView("requisicoes")}>
                  <span>📨</span>
                  <div>
                    <strong>Requisições</strong>
                    <small>Atualização cadastral e promoções</small>
                  </div>
                </button>

                <button type="button" className="user-quick-action" onClick={() => setView("codigo-penal")}>
                  <span>📘</span>
                  <div>
                    <strong>Código Penal</strong>
                    <small>Consulta rápida de artigos e penalidades</small>
                  </div>
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="user-dashboard-content">
        {view === "rso" && <RSOUser />}
        {view === "acoes" && <UserActions />}
        {view === "absence" && <AbsenceRequest />}
        {view === "indication" && <IndicationUser />}
        {view === "avaliacao-estagio" && <AvaliacaoEstagiosUser />}
        {view === "notifications" && <Notifications />}
        {view === "apresentacao" && <ApresentacaoEstagiariosUser />}
        {view === "requisicoes" && <UserProfileRequests />}
        {view === "codigo-penal" && <UserPenalCode />}
      </section>
    </div>
  );
}