import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "../../styles/comando-dashboard-elite.css";

const MINIMO_PATRULHA_MIN = 360;

/* =========================================================
   PRIORIDADE DE HORAS
========================================================= */

const prioridadeHoras = (min) => {
  if ((min || 0) === 0) {
    return "CRITICO";
  }

  if ((min || 0) < 180) {
    return "ALTO";
  }

  if ((min || 0) < MINIMO_PATRULHA_MIN) {
    return "MEDIO";
  }

  return "OK";
};

/* =========================================================
   SEMÁFORO OPERACIONAL
========================================================= */

const getSemaforo = ({
  zeroHoras,
  abaixo6h,
  urgentes,
  proximosMeta
}) => {
  if (
    zeroHoras >= 8 ||
    urgentes >= 4
  ) {
    return {
      status: "CRÍTICO",
      cor: "danger",
      texto:
        "A situação operacional exige atenção e intervenção imediata do Comando."
    };
  }

  if (
    zeroHoras >= 3 ||
    abaixo6h >= 6 ||
    proximosMeta >= 4
  ) {
    return {
      status: "ATENÇÃO",
      cor: "warning",
      texto:
        "Existem indicadores operacionais que exigem acompanhamento do Comando."
    };
  }

  return {
    status: "CONTROLADO",
    cor: "success",
    texto:
      "Os principais indicadores do batalhão estão dentro do padrão operacional."
  };
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function ComandoDashboard() {
  const navigate = useNavigate();

  const [score, setScore] = useState([]);

  const [metrics, setMetrics] = useState({
    resumo: [],
    rankingMensal: [],
    totais: {
      acoesValidas30Dias: 0,
      acoesValidasMes: 0
    },
    alertas: {
      metaConcluida: [],
      proximoDaMeta: []
    }
  });

  const [disciplina, setDisciplina] = useState({
    advertencias: [],
    casos: []
  });

  const [altoComando, setAltoComando] = useState([]);

  const [extra, setExtra] = useState(null);

  const [loading, setLoading] = useState(true);

  /* =========================================================
     CARREGAR DADOS
  ========================================================= */

  const carregar = async () => {
    try {
      setLoading(true);

      const [
        resScore,
        resMetrics,
        resDisciplina,
        resAlto
      ] = await Promise.all([
        api.get(
          "/api/comando/score-desempenho"
        ),

        api.get(
          "/api/admin/actions/metrics"
        ),

        api.get(
          "/api/comando/disciplina"
        ),

        api.get(
          "/api/high-command-notices"
        )
      ]);

      api
        .get("/api/comando/dashboard-extra")
        .then((r) => setExtra(r?.data || null))
        .catch(() => setExtra(null));

      setScore(
        Array.isArray(resScore.data)
          ? resScore.data
          : []
      );

      setMetrics(
        resMetrics.data || {
          resumo: [],
          rankingMensal: [],

          totais: {
            acoesValidas30Dias: 0,
            acoesValidasMes: 0
          },

          alertas: {
            metaConcluida: [],
            proximoDaMeta: []
          }
        }
      );

      setDisciplina({
        advertencias:
          Array.isArray(
            resDisciplina.data
              ?.advertencias
          )
            ? resDisciplina.data
                .advertencias
            : [],

        casos:
          Array.isArray(
            resDisciplina.data
              ?.casos
          )
            ? resDisciplina.data
                .casos
            : []
      });

      setAltoComando(
        Array.isArray(resAlto.data)
          ? resAlto.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar dashboard do Comando:",
        err
      );

      setScore([]);

      setMetrics({
        resumo: [],
        rankingMensal: [],

        totais: {
          acoesValidas30Dias: 0,
          acoesValidasMes: 0
        },

        alertas: {
          metaConcluida: [],
          proximoDaMeta: []
        }
      });

      setDisciplina({
        advertencias: [],
        casos: []
      });

      setAltoComando([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  /* =========================================================
     PROCESSAMENTO DOS DADOS
  ========================================================= */

  const dados = useMemo(() => {
    /* =======================================================
       POLICIAIS COM ZERO HORAS
    ======================================================= */

    const zeroHoras =
      score.filter(
        (p) =>
          p.status === "Ativo" &&
          (p.horasSemanaMin || 0) === 0
      );

    /* =======================================================
       ABAIXO DA META SEMANAL
    ======================================================= */

    const abaixo6h =
      score.filter(
        (p) =>
          p.status === "Ativo" &&
          (p.horasSemanaMin || 0) > 0 &&
          (p.horasSemanaMin || 0) <
            MINIMO_PATRULHA_MIN
      );

    /* =======================================================
       TOP SEMANAL
    ======================================================= */

    const topSemanal =
      [...score]
        .filter(
          (p) =>
            (p.horasSemanaMin || 0) >
            0
        )
        .sort(
          (a, b) =>
            (b.horasSemanaMin || 0) -
            (a.horasSemanaMin || 0)
        )
        .slice(0, 10);

    /* =======================================================
       TOP MENSAL
    ======================================================= */

    const topMensal =
      [...score]
        .filter(
          (p) =>
            (p.horasMesMin || 0) >
            0
        )
        .sort(
          (a, b) =>
            (b.horasMesMin || 0) -
            (a.horasMesMin || 0)
        )
        .slice(0, 10);

    /* =======================================================
       ZONA DE ATENÇÃO
    ======================================================= */

    const zonaCritica =
      [...score]
        .filter(
          (p) =>
            prioridadeHoras(
              p.horasSemanaMin
            ) !== "OK"
        )
        .sort(
          (a, b) =>
            (a.horasSemanaMin || 0) -
            (b.horasSemanaMin || 0)
        )
        .slice(0, 10);

    /* =======================================================
       DISCIPLINA
    ======================================================= */

    const casosUrgentes =
      disciplina.casos.filter(
        (c) =>
          [
            "URGENTE",
            "ALTA"
          ].includes(
            c.prioridade
          )
      );

    /* =======================================================
       ALTO COMANDO
    ======================================================= */

    const comunicadoAtivo =
      altoComando.find(
        (x) => x.ativo
      );

    /* =======================================================
       SEMÁFORO
    ======================================================= */

    const semaforo =
      getSemaforo({
        zeroHoras:
          zeroHoras.length,

        abaixo6h:
          abaixo6h.length,

        urgentes:
          casosUrgentes.length,

        proximosMeta:
          metrics.alertas
            ?.proximoDaMeta
            ?.length || 0
      });

    return {
      zeroHoras,
      abaixo6h,
      topSemanal,
      topMensal,
      zonaCritica,
      casosUrgentes,
      comunicadoAtivo,
      semaforo
    };
  }, [
    score,
    disciplina,
    altoComando,
    metrics
  ]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="elite-page">
        <div className="elite-card">
          Carregando Centro de Comando...
        </div>
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="elite-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="elite-hero">

        <div>

          <span className="elite-kicker">
            2º BPChq • ANCHIETA
          </span>

          <h1>
            Dashboard Estratégico
          </h1>

          <p>
            Visão consolidada dos principais
            indicadores de patrulhamento,
            produtividade, efetivo e disciplina
            para apoio à tomada de decisão do
            Comando do Batalhão.
          </p>

        </div>

        <div
          className={`elite-semaforo ${dados.semaforo.cor}`}
        >

          <small>
            Situação operacional do batalhão
          </small>

          <strong>
            {dados.semaforo.status}
          </strong>

          <span>
            {dados.semaforo.texto}
          </span>

        </div>

      </section>

      {/* =====================================================
          METAS + BRIEFING 24H
      ===================================================== */}

      {extra && (
        <section className="elite-grid-2" style={{ marginTop: 16 }}>
          <div className="elite-card">
            <div className="elite-card-header">
              <h3>Metas do Comando</h3>
              <button
                className="elite-btn ghost"
                onClick={() => navigate("/comando/metas")}
              >
                Gerenciar
              </button>
            </div>
            <div className="elite-mini-grid">
              <div className="elite-mini">
                <strong>{extra.metas.ativas}</strong>
                <span>Ativas</span>
              </div>
              <div className="elite-mini">
                <strong>{extra.metas.expiradas}</strong>
                <span>Prazo encerrado</span>
              </div>
              <div className="elite-mini">
                <strong>{extra.metas.atingimentoMedio}%</strong>
                <span>Atingimento médio</span>
              </div>
            </div>
            {extra.metas.expiradas > 0 && (
              <p
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  color: "#f0a35e"
                }}
              >
                ⏰ {extra.metas.expiradas} meta(s) com prazo encerrado aguardando
                exclusão do Comando.
              </p>
            )}
          </div>

          <div className="elite-card">
            <div className="elite-card-header">
              <h3>Briefing — últimas 24h</h3>
            </div>
            <div className="elite-mini-grid">
              <div className="elite-mini">
                <strong>{extra.briefing.acoesAprovadas}</strong>
                <span>Ações aprovadas</span>
              </div>
              <div className="elite-mini">
                <strong>{extra.briefing.advertencias}</strong>
                <span>Advertências</span>
              </div>
              <div className="elite-mini">
                <strong>{extra.briefing.eventos.length}</strong>
                <span>Registros no log</span>
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                maxHeight: 200,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 6
              }}
            >
              {extra.briefing.eventos.length === 0 && (
                <span style={{ fontSize: 13, color: "#8b95a4" }}>
                  Sem registros nas últimas 24h.
                </span>
              )}
              {extra.briefing.eventos.map((e, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12.5,
                    color: "#c2cad6",
                    borderLeft: "2px solid #c9a24d",
                    paddingLeft: 8
                  }}
                >
                  <strong style={{ color: "#e5e7eb" }}>{e.acao}</strong>
                  {e.modulo ? ` · ${e.modulo}` : ""} — {e.quem}
                  <br />
                  <span style={{ color: "#8b95a4" }}>
                    {new Date(e.data).toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          ACESSOS RÁPIDOS
      ===================================================== */}

      <section
        className="elite-actions"
        style={{
          marginTop: 16
        }}
      >

        <button
          className="elite-btn"
          type="button"
          onClick={() =>
            navigate(
              "/comando/efetivo"
            )
          }
        >
          👥 Efetivo
        </button>

        <button
          className="elite-btn"
          type="button"
          onClick={() =>
            navigate(
              "/comando/patrulha"
            )
          }
        >
          🚓 Patrulhamento
        </button>

        <button
          className="elite-btn"
          type="button"
          onClick={() =>
            navigate(
              "/comando/produtividade"
            )
          }
        >
          📈 Produtividade
        </button>

        <button
          className="elite-btn"
          type="button"
          onClick={() =>
            navigate(
              "/comando/consultas"
            )
          }
        >
          🔎 Consulta Policial
        </button>

        <button
          className="elite-btn"
          type="button"
          onClick={() =>
            navigate(
              "/comando/disciplina"
            )
          }
        >
          ⚖️ Justiça & Disciplina
        </button>

        <button
          className="elite-btn"
          type="button"
          onClick={() =>
            navigate(
              "/comando/comunicados"
            )
          }
        >
          📢 Comunicados
        </button>

      </section>

      {/* =====================================================
          COMUNICADO DO ALTO COMANDO
      ===================================================== */}

      {dados.comunicadoAtivo && (
        <section className="elite-alerta danger">

          <div>

            <small>
              COMUNICADO DO ALTO COMANDO
            </small>

            <strong>
              {
                dados
                  .comunicadoAtivo
                  .titulo
              }
            </strong>

            <p>
              {
                dados
                  .comunicadoAtivo
                  .mensagem
              }
            </p>

          </div>

        </section>
      )}

      {/* =====================================================
          INDICADORES
      ===================================================== */}

      <section className="elite-kpi-grid">

        <div className="elite-kpi">

          <small>
            Sem patrulhamento
          </small>

          <strong>
            {
              dados.zeroHoras
                .length
            }
          </strong>

        </div>

        <div className="elite-kpi">

          <small>
            Abaixo de 6h
          </small>

          <strong>
            {
              dados.abaixo6h
                .length
            }
          </strong>

        </div>

        <div className="elite-kpi">

          <small>
            Meta concluída
          </small>

          <strong>
            {metrics.alertas
              ?.metaConcluida
              ?.length || 0}
          </strong>

        </div>

        <div className="elite-kpi">

          <small>
            Próximos da meta
          </small>

          <strong>
            {metrics.alertas
              ?.proximoDaMeta
              ?.length || 0}
          </strong>

        </div>

        <div className="elite-kpi">

          <small>
            Advertências
          </small>

          <strong>
            {
              disciplina
                .advertencias
                .length
            }
          </strong>

        </div>

        <div className="elite-kpi">

          <small>
            Casos prioritários
          </small>

          <strong>
            {
              dados
                .casosUrgentes
                .length
            }
          </strong>

        </div>

      </section>

      {/* =====================================================
          ZONA DE ATENÇÃO + TOP SEMANAL
      ===================================================== */}

      <section className="elite-grid-2">

        {/* ===================================================
            ZONA DE ATENÇÃO
        =================================================== */}

        <div className="elite-card">

          <div className="elite-card-header">

            <div>

              <h2>
                Atenção Operacional
              </h2>

              <span>
                Policiais que ainda não atingiram
                a meta mínima semanal.
              </span>

            </div>

          </div>

          <div className="elite-list">

            {dados.zonaCritica
              .length === 0 ? (
              <div className="elite-empty">
                Nenhum policial em faixa de atenção.
              </div>
            ) : (
              dados.zonaCritica.map(
                (item) => (
                  <div
                    key={
                      item._id
                    }
                    className={`elite-list-item ${prioridadeHoras(
                      item.horasSemanaMin
                    ).toLowerCase()}`}
                  >

                    <div>

                      <strong>
                        {item.patente}{" "}
                        {item.nome}
                      </strong>

                      <span>
                        {item.funcao ||
                          "Operacional"}
                      </span>

                    </div>

                    <div className="elite-list-right">

                      <b>
                        {item.horasSemanaTexto ||
                          "0h"}
                      </b>

                      <small>
                        {prioridadeHoras(
                          item.horasSemanaMin
                        )}
                      </small>

                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>

        {/* ===================================================
            TOP SEMANAL
        =================================================== */}

        <div className="elite-card">

          <div className="elite-card-header">

            <div>

              <h2>
                Patrulhamento Semanal
              </h2>

              <span>
                Ranking das maiores cargas de
                patrulhamento da semana.
              </span>

            </div>

          </div>

          <div className="elite-ranking">

            {dados.topSemanal
              .length === 0 ? (
              <div className="elite-empty">
                Nenhuma hora semanal registrada.
              </div>
            ) : (
              dados.topSemanal.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item._id
                    }
                    className="elite-ranking-item"
                  >

                    <div className="elite-ranking-pos">
                      {index + 1}º
                    </div>

                    <div className="elite-ranking-info">

                      <strong>
                        {item.patente}{" "}
                        {item.nome}
                      </strong>

                      <span>
                        {item.funcao ||
                          "Operacional"}
                      </span>

                    </div>

                    <div className="elite-ranking-value">
                      {item.horasSemanaTexto ||
                        "0h"}
                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          TOP MENSAL + DISCIPLINA
      ===================================================== */}

      <section className="elite-grid-2">

        {/* ===================================================
            TOP MENSAL
        =================================================== */}

        <div className="elite-card">

          <div className="elite-card-header">

            <div>

              <h2>
                Patrulhamento Mensal
              </h2>

              <span>
                Ranking acumulado de patrulhamento
                no mês atual.
              </span>

            </div>

          </div>

          <div className="elite-ranking">

            {dados.topMensal
              .length === 0 ? (
              <div className="elite-empty">
                Nenhuma hora mensal registrada.
              </div>
            ) : (
              dados.topMensal.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={
                      item._id
                    }
                    className="elite-ranking-item"
                  >

                    <div className="elite-ranking-pos">
                      {index + 1}º
                    </div>

                    <div className="elite-ranking-info">

                      <strong>
                        {item.patente}{" "}
                        {item.nome}
                      </strong>

                      <span>
                        {item.funcao ||
                          "Operacional"}
                      </span>

                    </div>

                    <div className="elite-ranking-value">
                      {item.horasMesTexto ||
                        "0h"}
                    </div>

                  </div>
                )
              )
            )}

          </div>

        </div>

        {/* ===================================================
            DISCIPLINA
        =================================================== */}

        <div className="elite-card">

          <div className="elite-card-header">

            <div>

              <h2>
                Justiça & Disciplina
              </h2>

              <span>
                Ocorrências classificadas como
                urgentes ou de alta prioridade.
              </span>

            </div>

          </div>

          <div className="elite-list">

            {dados.casosUrgentes
              .length === 0 ? (
              <div className="elite-empty">
                Nenhum caso prioritário no momento.
              </div>
            ) : (
              dados.casosUrgentes
                .slice(0, 8)
                .map(
                  (item) => (
                    <div
                      key={
                        item._id
                      }
                      className="elite-list-item alto"
                    >

                      <div>

                        <strong>
                          {item.numero ||
                            "Sem número"}
                        </strong>

                        <span>
                          {item.tipo ||
                            "-"}
                        </span>

                      </div>

                      <div className="elite-list-right">

                        <b>
                          {
                            item.prioridade
                          }
                        </b>

                        <small>
                          {item.status ||
                            "-"}
                        </small>

                      </div>

                    </div>
                  )
                )
            )}

          </div>

        </div>

      </section>

    </div>
  );
}