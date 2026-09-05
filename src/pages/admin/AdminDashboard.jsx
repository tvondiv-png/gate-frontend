import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "../../styles/admin-dashboard.css";

const atalhosAdmin = [
  {
    titulo: "RSOs",
    subtitulo: "Validação operacional",
    rota: "/admin/rso",
    icon: "🚓"
  },
  {
    titulo: "Ausências",
    subtitulo: "Análise administrativa",
    rota: "/admin/ausencias",
    icon: "📄"
  },
  {
    titulo: "Cadastros",
    subtitulo: "Solicitações pendentes",
    rota: "/admin/solicitacoes",
    icon: "👤"
  },
  {
    titulo: "Req. Cadastrais",
    subtitulo: "Cursos, medalhas e promoções",
    rota: "/admin/requisicoes-cadastrais",
    icon: "🧾"
  },
  {
    titulo: "Apresentações",
    subtitulo: "Validação de estagiários",
    rota: "/admin/apresentacoes-estagiarios",
    icon: "📋"
  },
  {
    titulo: "Avaliações",
    subtitulo: "Estágio e acompanhamento",
    rota: "/admin/avaliacoes-estagio",
    icon: "🎓"
  },
  {
    titulo: "Justiça",
    subtitulo: "Disciplina e processos",
    rota: "/admin/justica",
    icon: "⚖️"
  },
  {
    titulo: "Hierarquia",
    subtitulo: "Efetivo e qualificações",
    rota: "/admin/hierarquia",
    icon: "🪖"
  }
];

const classeAlerta = (tipo) => {
  if (tipo === "danger") return "danger";
  if (tipo === "warning") return "warning";
  return "info";
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [advertencias, setAdvertencias] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarDashboard = async () => {
    try {
      const res = await api.get("/api/admin/dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setData(null);
    }
  };

  const carregarAdvertencias = async () => {
    try {
      const res = await api.get("/api/advertencias");

      setAdvertencias(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar advertências:",
        err
      );

      setAdvertencias([]);
    }
  };

  const carregarTudo = async () => {
    try {
      setLoading(true);

      await Promise.all([
        carregarDashboard(),
        carregarAdvertencias()
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const formatHoras = (min) => {
    if (!min) return "0h";

    const h = Math.floor(min / 60);
    const m = min % 60;

    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;

    return `${h}h ${m}min`;
  };

  const formatarDataHora = (valor) => {
    if (!valor) return "-";

    const dataFormatada = new Date(valor);

    if (
      Number.isNaN(
        dataFormatada.getTime()
      )
    ) {
      return "-";
    }

    return dataFormatada.toLocaleString(
      "pt-BR"
    );
  };

  const alertas = useMemo(() => {
    if (!data) return [];

    const lista = [];

    if (data.pendencias?.rsos > 0) {
      lista.push({
        tipo: "warning",
        texto:
          `${data.pendencias.rsos} RSO(s) aguardando aprovação`
      });
    }

    if (
      data.pendencias?.ausencias > 0
    ) {
      lista.push({
        tipo: "info",
        texto:
          `${data.pendencias.ausencias} ausência(s) aguardando análise`
      });
    }

    if (
      data.pendencias?.cadastros > 0
    ) {
      lista.push({
        tipo: "info",
        texto:
          `${data.pendencias.cadastros} cadastro(s) pendente(s)`
      });
    }

    if (
      data.pendencias?.apresentacoes > 0
    ) {
      lista.push({
        tipo: "info",
        texto:
          `${data.pendencias.apresentacoes} apresentação(ões) aguardando validação`
      });
    }

    if (
      data.pendencias
        ?.avaliacoesEstagio > 0
    ) {
      lista.push({
        tipo: "warning",
        texto:
          `${data.pendencias.avaliacoesEstagio} avaliação(ões) de estágio aguardando validação`
      });
    }

    if (
      (data.pendencias
        ?.requisicoesCadastrais ||
        0) > 0
    ) {
      lista.push({
        tipo: "warning",
        texto:
          `${data.pendencias.requisicoesCadastrais} requisição(ões) cadastrais aguardando validação`
      });
    }

    if (advertencias.length > 0) {
      lista.push({
        tipo: "danger",
        texto:
          `${advertencias.length} policial(is) com advertência ativa`
      });
    }

    return lista;
  }, [data, advertencias]);

  const resumoTopo = useMemo(() => {
    if (!data) {
      return [
        {
          titulo: "Horas no mês",
          valor: "—",
          destaque: true
        },
        {
          titulo: "Horas na semana",
          valor: "—",
          destaque: true
        },
        {
          titulo: "RSOs pendentes",
          valor: "—"
        },
        {
          titulo: "Ausências pendentes",
          valor: "—"
        },
        {
          titulo: "Cadastros pendentes",
          valor: "—"
        }
      ];
    }

    return [
      {
        titulo: "Horas no mês",
        valor: formatHoras(
          data.totalHorasMes
        ),
        destaque: true
      },
      {
        titulo: "Horas na semana",
        valor: formatHoras(
          data.totalHorasSemana
        ),
        destaque: true
      },
      {
        titulo: "RSOs pendentes",
        valor:
          data.pendencias?.rsos ?? 0,
        click: "/admin/rso",
        alert:
          data.pendencias?.rsos > 0
      },
      {
        titulo: "Ausências pendentes",
        valor:
          data.pendencias?.ausencias ??
          0,
        click: "/admin/ausencias",
        alert:
          data.pendencias?.ausencias >
          0
      },
      {
        titulo: "Cadastros pendentes",
        valor:
          data.pendencias?.cadastros ??
          0,
        click: "/admin/solicitacoes",
        alert:
          data.pendencias?.cadastros >
          0
      },
      {
        titulo:
          "Apresentações pendentes",
        valor:
          data.pendencias
            ?.apresentacoes ?? 0,
        click:
          "/admin/apresentacoes-estagiarios",
        alert:
          data.pendencias
            ?.apresentacoes > 0
      },
      {
        titulo:
          "Avaliações pendentes",
        valor:
          data.pendencias
            ?.avaliacoesEstagio ?? 0,
        click:
          "/admin/avaliacoes-estagio",
        alert:
          data.pendencias
            ?.avaliacoesEstagio > 0
      },
      {
        titulo: "Req. cadastrais",
        valor:
          data.pendencias
            ?.requisicoesCadastrais ??
          0,
        click:
          "/admin/requisicoes-cadastrais",
        alert:
          (data.pendencias
            ?.requisicoesCadastrais ||
            0) > 0
      }
    ];
  }, [data]);

  if (loading && !data) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-dashboard-spinner" />

        <span>
          Carregando painel administrativo...
        </span>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-premium">

      {/* ===================================================
          HERO
      =================================================== */}

      <header className="admin-dashboard-hero">

        <div className="admin-dashboard-hero-left">

          <div className="admin-dashboard-hero-brand">

            <img
              src="/anchieta-logo.png"
              alt="2º BPChq Anchieta"
              className="admin-dashboard-logo"
            />

            <div>
              <span className="admin-dashboard-kicker">
                2º BPChq • ANCHIETA
              </span>

              <h1>
                Dashboard Administrativo
              </h1>
            </div>

          </div>

          <p>
            Central administrativa para
            acompanhamento de RSO, efetivo,
            patrulhamento, cadastros,
            disciplina, avaliações e demais
            atividades institucionais.
          </p>

          <div className="admin-dashboard-status-row">

            <div
              className={`admin-status-chip ${
                alertas.length > 0
                  ? "warning"
                  : "success"
              }`}
            >
              <small>
                Status administrativo
              </small>

              <strong>
                {alertas.length > 0
                  ? "Atenção"
                  : "Regular"}
              </strong>
            </div>

            <div className="admin-status-chip">
              <small>
                Advertências ativas
              </small>

              <strong>
                {advertencias.length}
              </strong>
            </div>

            <div className="admin-status-chip">
              <small>
                Req. cadastrais
              </small>

              <strong>
                {data?.pendencias
                  ?.requisicoesCadastrais ||
                  0}
              </strong>
            </div>

            <div className="admin-status-chip">
              <small>
                Alertas atuais
              </small>

              <strong>
                {alertas.length}
              </strong>
            </div>

          </div>

        </div>

        <div className="admin-dashboard-hero-right">

          <div className="admin-hero-mini-card">
            <small>
              Horas consolidadas no mês
            </small>

            <strong>
              {formatHoras(
                data?.totalHorasMes
              )}
            </strong>
          </div>

          <div className="admin-hero-mini-card">
            <small>
              Horas consolidadas na semana
            </small>

            <strong>
              {formatHoras(
                data?.totalHorasSemana
              )}
            </strong>
          </div>

          <div className="admin-hero-mini-card">
            <small>
              Avaliações pendentes
            </small>

            <strong>
              {data?.pendencias
                ?.avaliacoesEstagio || 0}
            </strong>
          </div>

          <div className="admin-hero-mini-card">
            <small>
              Req. cadastrais pendentes
            </small>

            <strong>
              {data?.pendencias
                ?.requisicoesCadastrais ||
                0}
            </strong>
          </div>

          <button
            type="button"
            className="admin-dashboard-refresh"
            onClick={carregarTudo}
            disabled={loading}
          >
            {loading
              ? "Atualizando..."
              : "↻ Recarregar dados"}
          </button>

        </div>

      </header>

      {/* ===================================================
          RESUMO
      =================================================== */}

      <section className="admin-summary-grid">

        {resumoTopo.map(
          (item, index) => (
            <button
              key={`${item.titulo}-${index}`}
              type="button"
              className={[
                "admin-summary-card",
                item.destaque
                  ? "destaque"
                  : "",
                item.alert
                  ? "alert"
                  : "",
                item.click
                  ? "clickable"
                  : ""
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (item.click) {
                  navigate(item.click);
                }
              }}
            >
              <small>
                {item.titulo}
              </small>

              <strong>
                {item.valor}
              </strong>
            </button>
          )
        )}

      </section>

      {/* ===================================================
          ALERTAS
      =================================================== */}

      {alertas.length > 0 && (
        <section className="admin-dashboard-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Central de Alertas
              </h2>

              <span>
                Pontos que exigem análise
                administrativa.
              </span>
            </div>
          </div>

          <div className="admin-alerts-grid">

            {alertas.map(
              (item, index) => (
                <div
                  key={index}
                  className={`admin-alert-card ${classeAlerta(
                    item.tipo
                  )}`}
                >
                  <strong>
                    {item.tipo === "danger"
                      ? "Crítico"
                      : item.tipo ===
                        "warning"
                      ? "Atenção"
                      : "Informativo"}
                  </strong>

                  <p>
                    {item.texto}
                  </p>
                </div>
              )
            )}

          </div>

        </section>
      )}

      {/* ===================================================
          ATALHOS
      =================================================== */}

      <section className="admin-dashboard-section">

        <div className="admin-section-header">
          <div>
            <h2>
              Navegação rápida
            </h2>

            <span>
              Acesse diretamente os principais
              módulos administrativos.
            </span>
          </div>
        </div>

        <div className="admin-shortcuts-grid">

          {atalhosAdmin.map(
            (item) => (
              <button
                key={item.rota}
                type="button"
                className="admin-shortcut-card"
                onClick={() =>
                  navigate(item.rota)
                }
              >
                <span className="icon">
                  {item.icon}
                </span>

                <strong>
                  {item.titulo}
                </strong>

                <small>
                  {item.subtitulo}
                </small>
              </button>
            )
          )}

        </div>

      </section>

      {/* ===================================================
          DESTAQUES
      =================================================== */}

      <section className="admin-dashboard-main-grid">

        <div className="admin-dashboard-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Destaque do Mês
              </h2>

              <span>
                Maior carga de patrulhamento
                registrada no período.
              </span>
            </div>
          </div>

          {data?.policialDestaque ? (
            <div className="admin-highlight-card">

              <div className="admin-highlight-avatar">
                {String(
                  data.policialDestaque
                    .nome || "P"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="admin-highlight-content">
                <strong>
                  {
                    data.policialDestaque
                      .patente
                  }{" "}
                  {
                    data.policialDestaque
                      .nome
                  }
                </strong>

                <span>
                  Funcional:{" "}
                  {
                    data.policialDestaque
                      .funcional
                  }
                </span>

                <span>
                  Horas:{" "}
                  {formatHoras(
                    data.policialDestaque
                      .horas
                  )}
                </span>
              </div>

            </div>
          ) : (
            <div className="admin-empty-state">
              Sem dados disponíveis.
            </div>
          )}

        </div>

        <div className="admin-dashboard-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Destaque da Semana
              </h2>

              <span>
                Maior carga de patrulhamento
                semanal registrada.
              </span>
            </div>
          </div>

          {data?.policialDestaqueSemana ? (
            <div className="admin-highlight-card">

              <div className="admin-highlight-avatar">
                {String(
                  data
                    .policialDestaqueSemana
                    .nome || "P"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="admin-highlight-content">
                <strong>
                  {
                    data
                      .policialDestaqueSemana
                      .patente
                  }{" "}
                  {
                    data
                      .policialDestaqueSemana
                      .nome
                  }
                </strong>

                <span>
                  Funcional:{" "}
                  {
                    data
                      .policialDestaqueSemana
                      .funcional
                  }
                </span>

                <span>
                  Horas:{" "}
                  {formatHoras(
                    data
                      .policialDestaqueSemana
                      .horas
                  )}
                </span>
              </div>

            </div>
          ) : (
            <div className="admin-empty-state">
              Sem dados disponíveis.
            </div>
          )}

        </div>

      </section>

      {/* ===================================================
          RANKINGS
      =================================================== */}

      <section className="admin-dashboard-secondary-grid">

        <div className="admin-dashboard-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Top 3 do Mês
              </h2>

              <span>
                Ranking por horas de
                patrulhamento.
              </span>
            </div>
          </div>

          {Array.isArray(
            data?.topPoliciais
          ) &&
          data.topPoliciais.length > 0 ? (
            <div className="admin-ranking-list">

              {data.topPoliciais.map(
                (item, index) => (
                  <div
                    key={`mes-${item.funcional}`}
                    className="admin-ranking-card"
                  >
                    <div className="admin-ranking-position">
                      {index + 1}º
                    </div>

                    <div className="admin-ranking-info">
                      <strong>
                        {item.patente}{" "}
                        {item.nome}
                      </strong>

                      <span>
                        Funcional:{" "}
                        {item.funcional}
                      </span>
                    </div>

                    <div className="admin-ranking-hours">
                      {formatHoras(
                        item.horas
                      )}
                    </div>
                  </div>
                )
              )}

            </div>
          ) : (
            <div className="admin-empty-state">
              Sem ranking disponível.
            </div>
          )}

        </div>

        <div className="admin-dashboard-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Top 3 da Semana
              </h2>

              <span>
                Ranking semanal por horas de
                patrulhamento.
              </span>
            </div>
          </div>

          {Array.isArray(
            data?.topPoliciaisSemana
          ) &&
          data.topPoliciaisSemana.length >
            0 ? (
            <div className="admin-ranking-list">

              {data.topPoliciaisSemana.map(
                (item, index) => (
                  <div
                    key={`semana-${item.funcional}`}
                    className="admin-ranking-card"
                  >
                    <div className="admin-ranking-position">
                      {index + 1}º
                    </div>

                    <div className="admin-ranking-info">
                      <strong>
                        {item.patente}{" "}
                        {item.nome}
                      </strong>

                      <span>
                        Funcional:{" "}
                        {item.funcional}
                      </span>
                    </div>

                    <div className="admin-ranking-hours">
                      {formatHoras(
                        item.horas
                      )}
                    </div>
                  </div>
                )
              )}

            </div>
          ) : (
            <div className="admin-empty-state">
              Sem ranking semanal disponível.
            </div>
          )}

        </div>

      </section>

      {/* ===================================================
          MOVIMENTAÇÕES + RESUMO
      =================================================== */}

      <section className="admin-dashboard-secondary-grid">

        <div className="admin-dashboard-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Últimas Movimentações
              </h2>

              <span>
                Eventos recentes do sistema.
              </span>
            </div>
          </div>

          {Array.isArray(
            data?.movimentacoes
          ) &&
          data.movimentacoes.length > 0 ? (
            <div className="admin-movements-list">

              {data.movimentacoes.map(
                (item, index) => (
                  <div
                    key={index}
                    className="admin-movement-card"
                  >
                    <div className="admin-movement-type">
                      {item.tipo}
                    </div>

                    <div className="admin-movement-content">
                      <strong>
                        {item.titulo}
                      </strong>

                      <span>
                        {formatarDataHora(
                          item.data
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}

            </div>
          ) : (
            <div className="admin-empty-state">
              Nenhuma movimentação recente.
            </div>
          )}

        </div>

        <div className="admin-dashboard-section">

          <div className="admin-section-header">
            <div>
              <h2>
                Resumo Administrativo
              </h2>

              <span>
                Panorama rápido da situação
                atual.
              </span>
            </div>
          </div>

          <div className="admin-info-grid">

            <div className="admin-info-box">
              <small>
                Status geral
              </small>

              <strong>
                {alertas.length > 0
                  ? "Atenção"
                  : "Regular"}
              </strong>
            </div>

            <div className="admin-info-box">
              <small>
                Horas no mês
              </small>

              <strong>
                {formatHoras(
                  data?.totalHorasMes
                )}
              </strong>
            </div>

            <div className="admin-info-box">
              <small>
                Horas na semana
              </small>

              <strong>
                {formatHoras(
                  data?.totalHorasSemana
                )}
              </strong>
            </div>

            <div className="admin-info-box">
              <small>
                Advertências
              </small>

              <strong>
                {advertencias.length}
              </strong>
            </div>

            <div className="admin-info-box">
              <small>
                Avaliações pendentes
              </small>

              <strong>
                {data?.pendencias
                  ?.avaliacoesEstagio || 0}
              </strong>
            </div>

            <div className="admin-info-box">
              <small>
                Req. cadastrais
              </small>

              <strong>
                {data?.pendencias
                  ?.requisicoesCadastrais ||
                  0}
              </strong>
            </div>

          </div>

        </div>

      </section>

      {/* ===================================================
          PENDÊNCIAS
      =================================================== */}

      <section className="admin-dashboard-section">

        <div className="admin-section-header">
          <div>
            <h2>
              Pendências do Sistema
            </h2>

            <span>
              Consolidação das filas
              administrativas atuais.
            </span>
          </div>
        </div>

        <div className="admin-pendencias-grid">

          <div className="admin-pendencia-item">
            <span>
              RSOs aguardando aprovação
            </span>

            <strong>
              {data?.pendencias?.rsos ||
                0}
            </strong>
          </div>

          <div className="admin-pendencia-item">
            <span>
              Solicitações de cadastro
            </span>

            <strong>
              {data?.pendencias
                ?.cadastros || 0}
            </strong>
          </div>

          <div className="admin-pendencia-item">
            <span>
              Ausências aguardando análise
            </span>

            <strong>
              {data?.pendencias
                ?.ausencias || 0}
            </strong>
          </div>

          <div className="admin-pendencia-item">
            <span>
              Apresentações aguardando
              validação
            </span>

            <strong>
              {data?.pendencias
                ?.apresentacoes || 0}
            </strong>
          </div>

          <div className="admin-pendencia-item">
            <span>
              Avaliações de estágio
              aguardando validação
            </span>

            <strong>
              {data?.pendencias
                ?.avaliacoesEstagio || 0}
            </strong>
          </div>

          <div className="admin-pendencia-item">
            <span>
              Requisições cadastrais
              pendentes
            </span>

            <strong>
              {data?.pendencias
                ?.requisicoesCadastrais ||
                0}
            </strong>
          </div>

        </div>

      </section>

      {/* ===================================================
          ADVERTÊNCIAS
      =================================================== */}

      <section className="admin-dashboard-section">

        <div className="admin-section-header">
          <div>
            <h2>
              Policiais com Advertência
            </h2>

            <span>
              Acompanhamento dos registros
              disciplinares ativos.
            </span>
          </div>
        </div>

        {advertencias.length === 0 ? (
          <div className="admin-empty-state">
            Nenhuma advertência ativa.
          </div>
        ) : (
          <div className="admin-table-wrap">

            <table className="admin-dashboard-table">

              <thead>
                <tr>
                  <th>
                    Funcional
                  </th>

                  <th>
                    Nome
                  </th>

                  <th>
                    Patente
                  </th>

                  <th>
                    Advertência
                  </th>

                  <th>
                    Semana
                  </th>
                </tr>
              </thead>

              <tbody>

                {advertencias.map(
                  (a) => (
                    <tr key={a._id}>
                      <td>
                        {a.funcional}
                      </td>

                      <td>
                        {a.nome}
                      </td>

                      <td>
                        {a.patente}
                      </td>

                      <td>
                        {a.tipo}
                      </td>

                      <td>
                        {
                          a.semanaReferencia
                        }
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
}