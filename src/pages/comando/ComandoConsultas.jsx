import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../api/api";

import "../../styles/comando-consultas.css";

import { useToast } from "../../contexts/ToastContext";
const META_SEMANAL_MIN = 360;

const formatarData = (data) => {
  if (!data) return "-";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  return valor.toLocaleDateString("pt-BR");
};

const formatarDataHora = (data) => {
  if (!data) return "-";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  return valor.toLocaleString("pt-BR");
};

const ausenciaLabel = (tipo) => {
  if (tipo === "nao_justificada") {
    return "Não justificada";
  }

  if (tipo === "justificada") {
    return "Justificada";
  }

  if (tipo === "iniciante") {
    return "Iniciante";
  }

  return "Normal";
};

const ausenciaClasse = (tipo) => {
  if (tipo === "nao_justificada") {
    return "danger";
  }

  if (tipo === "justificada") {
    return "success";
  }

  if (tipo === "iniciante") {
    return "info";
  }

  return "neutral";
};

const statusClasse = (status) => {
  const valor = String(status || "")
    .trim()
    .toLowerCase();

  if (valor === "ativo") {
    return "success";
  }

  if (valor === "ausente") {
    return "warning";
  }

  if (valor === "afastado") {
    return "danger";
  }

  return "neutral";
};

const metaClasse = (minutos) => {
  const valor = Number(minutos || 0);

  if (valor === 0) {
    return "danger";
  }

  if (valor < META_SEMANAL_MIN) {
    return "warning";
  }

  return "success";
};

const metaTexto = (minutos) => {
  const valor = Number(minutos || 0);

  if (valor === 0) {
    return "Sem patrulha";
  }

  if (valor < META_SEMANAL_MIN) {
    return "Abaixo da meta";
  }

  return "Meta cumprida";
};

export default function ComandoConsultas() {
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [busca, setBusca] = useState(
    searchParams.get("busca") || ""
  );

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [consultado, setConsultado] = useState(false);

  /* =========================================================
     CONSULTA
  ========================================================= */

  const consultar = async (valorManual) => {
    const termo = String(
      valorManual ?? busca
    ).trim();

    if (!termo) {
      toast.warning("Digite o nome ou a funcional");
      return;
    }

    try {
      setLoading(true);
      setConsultado(true);

      const res = await api.get(
        `/api/comando/consultas?q=${encodeURIComponent(
          termo
        )}`
      );

      setLista(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro na consulta:",
        err
      );

      setLista([]);

      toast.error(
        err?.response?.data?.message ||
          "Erro ao realizar consulta"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     ENTER
  ========================================================= */

  const consultarComEnter = (e) => {
    if (e.key === "Enter") {
      consultar();
    }
  };

  /* =========================================================
     BUSCA INICIAL
  ========================================================= */

  useEffect(() => {
    const inicial =
      searchParams.get("busca");

    if (inicial) {
      setBusca(inicial);
      consultar(inicial);
    }
  }, [searchParams]);

  /* =========================================================
     RESUMO DA CONSULTA
  ========================================================= */

  const resumoConsulta = useMemo(() => {
    return {
      total: lista.length,

      ativos: lista.filter(
        (item) =>
          item.status === "Ativo"
      ).length,

      abaixoMeta: lista.filter(
        (item) =>
          Number(
            item.horasSemanaMin || 0
          ) < META_SEMANAL_MIN
      ).length,

      advertencias: lista.reduce(
        (acc, item) =>
          acc +
          Number(
            item.totalAdvertencias || 0
          ),
        0
      )
    };
  }, [lista]);

  return (
    <div className="comando-consultas-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <header className="comando-consultas-hero">

        <div>

          <span className="comando-consultas-kicker">
            CENTRO DE COMANDO • CONSULTA
          </span>

          <h1>
            Consulta Policial
          </h1>

          <p>
            Pesquisa executiva com leitura
            consolidada de situação funcional,
            patrulhamento, produtividade,
            disciplina e histórico operacional.
          </p>

        </div>

      </header>

      {/* =====================================================
          BUSCA
      ===================================================== */}

      <section className="comando-consultas-search">

        <div className="comando-consultas-search-info">

          <small>
            CONSULTA EXECUTIVA
          </small>

          <strong>
            Localizar policial
          </strong>

          <span>
            Pesquise por nome ou funcional.
          </span>

        </div>

        <div className="comando-consultas-search-form">

          <input
            className="comando-consultas-input"
            placeholder="Nome ou funcional"
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            onKeyDown={
              consultarComEnter
            }
          />

          <button
            type="button"
            className="comando-consultas-btn primary"
            onClick={() =>
              consultar()
            }
            disabled={loading}
          >
            {loading
              ? "Consultando..."
              : "Consultar"}
          </button>

          <button
            type="button"
            className="comando-consultas-btn"
            onClick={() => {
              setBusca("");
              setLista([]);
              setConsultado(false);
            }}
            disabled={loading}
          >
            Limpar
          </button>

        </div>

      </section>

      {/* =====================================================
          RESUMO
      ===================================================== */}

      {lista.length > 0 && (
        <section className="comando-consultas-summary">

          <div className="comando-consultas-summary-card">

            <small>
              Encontrados
            </small>

            <strong>
              {resumoConsulta.total}
            </strong>

          </div>

          <div className="comando-consultas-summary-card success">

            <small>
              Ativos
            </small>

            <strong>
              {resumoConsulta.ativos}
            </strong>

          </div>

          <div className="comando-consultas-summary-card warning">

            <small>
              Abaixo da meta
            </small>

            <strong>
              {resumoConsulta.abaixoMeta}
            </strong>

          </div>

          <div className="comando-consultas-summary-card danger">

            <small>
              Advertências
            </small>

            <strong>
              {resumoConsulta.advertencias}
            </strong>

          </div>

        </section>
      )}

      {/* =====================================================
          ESTADO INICIAL
      ===================================================== */}

      {!consultado &&
        !loading &&
        lista.length === 0 && (

        <div className="comando-consultas-empty">

          <div className="comando-consultas-empty-icon">
            🔎
          </div>

          <strong>
            Nenhuma consulta realizada
          </strong>

          <span>
            Digite o nome ou funcional de um
            policial para abrir a ficha
            executiva.
          </span>

        </div>
      )}

      {/* =====================================================
          SEM RESULTADO
      ===================================================== */}

      {consultado &&
        !loading &&
        lista.length === 0 && (

        <div className="comando-consultas-empty">

          <strong>
            Nenhum policial encontrado.
          </strong>

          <span>
            Verifique o nome ou funcional
            informado.
          </span>

        </div>
      )}

      {/* =====================================================
          RESULTADOS
      ===================================================== */}

      {lista.length > 0 && (

        <div className="comando-consultas-list">

          {lista.map((item) => (

            <article
              key={
                item._id ||
                item.funcional
              }
              className="comando-consulta-profile"
            >

              {/* =============================================
                  IDENTIFICAÇÃO
              ============================================= */}

              <div className="comando-consulta-profile-head">

                <div className="comando-consulta-profile-main">

                  <div className="comando-consulta-avatar">

                    {String(
                      item.nome || "P"
                    )
                      .charAt(0)
                      .toUpperCase()}

                  </div>

                  <div>

                    <small>
                      POLICIAL CONSULTADO
                    </small>

                    <h2>
                      {item.patente || "-"}{" "}
                      {item.nome || "-"}
                    </h2>

                    <div className="comando-consulta-profile-meta">

                      <span>
                        Funcional{" "}
                        <strong>
                          {item.funcional ||
                            "-"}
                        </strong>
                      </span>

                      <span>
                        {item.funcao || "-"}
                      </span>

                      <span>
                        {item.categoria ||
                          "-"}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="comando-consulta-head-badges">

                  <span
                    className={`comando-consulta-badge ${statusClasse(
                      item.status
                    )}`}
                  >
                    {item.status || "-"}
                  </span>

                  <span
                    className={`comando-consulta-badge ${metaClasse(
                      item.horasSemanaMin
                    )}`}
                  >
                    {metaTexto(
                      item.horasSemanaMin
                    )}
                  </span>

                </div>

              </div>

              {/* =============================================
                  DADOS FUNCIONAIS
              ============================================= */}

              <section className="comando-consulta-block">

                <div className="comando-consulta-block-title">

                  <div>
                    <small>
                      IDENTIFICAÇÃO FUNCIONAL
                    </small>

                    <h3>
                      Dados institucionais
                    </h3>
                  </div>

                </div>

                <div className="comando-consulta-kv-grid">

                  <div className="comando-consulta-kv">

                    <small>
                      Categoria
                    </small>

                    <strong>
                      {item.categoria ||
                        "-"}
                    </strong>

                  </div>

                  <div className="comando-consulta-kv">

                    <small>
                      Função
                    </small>

                    <strong>
                      {item.funcao ||
                        "-"}
                    </strong>

                  </div>

                  <div className="comando-consulta-kv">

                    <small>
                      Data de entrada
                    </small>

                    <strong>
                      {formatarData(
                        item.dataEntrada
                      )}
                    </strong>

                  </div>

                  <div className="comando-consulta-kv">

                    <small>
                      Última promoção
                    </small>

                    <strong>
                      {formatarData(
                        item.dataUltimaPromocao
                      )}
                    </strong>

                  </div>

                </div>

              </section>

              {/* =============================================
                  PATRULHAMENTO
              ============================================= */}

              <section className="comando-consulta-block">

                <div className="comando-consulta-block-title">

                  <div>
                    <small>
                      OPERACIONAL
                    </small>

                    <h3>
                      Patrulhamento
                    </h3>
                  </div>

                  <span
                    className={`comando-consulta-badge ${ausenciaClasse(
                      item.ausenciaPatrulhamento
                    )}`}
                  >
                    {ausenciaLabel(
                      item.ausenciaPatrulhamento
                    )}
                  </span>

                </div>

                <div className="comando-consulta-metric-grid">

                  <div className="comando-consulta-metric">

                    <small>
                      Horas na semana
                    </small>

                    <strong>
                      {item.horasSemanaTexto ||
                        "0h"}
                    </strong>

                  </div>

                  <div className="comando-consulta-metric">

                    <small>
                      Horas no mês
                    </small>

                    <strong>
                      {item.horasMesTexto ||
                        "0h"}
                    </strong>

                  </div>

                  <div className="comando-consulta-metric">

                    <small>
                      Total de RSOs
                    </small>

                    <strong>
                      {item.totalRSOs ??
                        0}
                    </strong>

                  </div>

                </div>

                {item.observacaoAusencia && (

                  <div className="comando-consulta-note">

                    <small>
                      OBSERVAÇÃO DE AUSÊNCIA
                    </small>

                    <p>
                      {
                        item.observacaoAusencia
                      }
                    </p>

                  </div>
                )}

              </section>

              {/* =============================================
                  AÇÕES E DISCIPLINA
              ============================================= */}

              <div className="comando-consulta-grid-2">

                <section className="comando-consulta-block">

                  <div className="comando-consulta-block-title">

                    <div>
                      <small>
                        PRODUTIVIDADE
                      </small>

                      <h3>
                        Ações
                      </h3>
                    </div>

                  </div>

                  <div className="comando-consulta-data-list">

                    <div>

                      <span>
                        Total de ações
                      </span>

                      <strong>
                        {item.totalAcoesGeral ??
                          item.totalAcoes ??
                          0}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Aprovadas
                      </span>

                      <strong>
                        {item.acoesAprovadas ??
                          0}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Pendentes
                      </span>

                      <strong>
                        {item.acoesPendentes ??
                          0}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Rejeitadas
                      </span>

                      <strong>
                        {item.acoesRejeitadas ??
                          0}
                      </strong>

                    </div>

                  </div>

                </section>

                <section className="comando-consulta-block">

                  <div className="comando-consulta-block-title">

                    <div>
                      <small>
                        DISCIPLINA
                      </small>

                      <h3>
                        Situação disciplinar
                      </h3>
                    </div>

                  </div>

                  <div className="comando-consulta-data-list">

                    <div>

                      <span>
                        Advertências
                      </span>

                      <strong>
                        {item.totalAdvertencias ??
                          0}
                      </strong>

                    </div>

                    <div>

                      <span>
                        Casos disciplinares
                      </span>

                      <strong>
                        {item.totalCasosDisciplinares ??
                          0}
                      </strong>

                    </div>

                  </div>

                </section>

              </div>

              {/* =============================================
                  CURSOS E MEDALHAS
              ============================================= */}

              <div className="comando-consulta-grid-2">

                <section className="comando-consulta-block">

                  <div className="comando-consulta-block-title">

                    <div>
                      <small>
                        QUALIFICAÇÃO
                      </small>

                      <h3>
                        Cursos
                      </h3>
                    </div>

                    <span className="comando-consulta-count">
                      {Array.isArray(
                        item.cursos
                      )
                        ? item.cursos.length
                        : 0}
                    </span>

                  </div>

                  {Array.isArray(
                    item.cursos
                  ) &&
                  item.cursos.length > 0 ? (

                    <div className="comando-consulta-chips">

                      {item.cursos.map(
                        (curso, index) => (

                          <span key={index}>
                            {curso}
                          </span>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="comando-consulta-empty-small">
                      Nenhum curso cadastrado.
                    </div>

                  )}

                </section>

                <section className="comando-consulta-block">

                  <div className="comando-consulta-block-title">

                    <div>
                      <small>
                        CONDECORAÇÕES
                      </small>

                      <h3>
                        Medalhas
                      </h3>
                    </div>

                    <span className="comando-consulta-count">
                      {Array.isArray(
                        item.medalhas
                      )
                        ? item.medalhas.length
                        : 0}
                    </span>

                  </div>

                  {Array.isArray(
                    item.medalhas
                  ) &&
                  item.medalhas.length > 0 ? (

                    <div className="comando-consulta-chips medalhas">

                      {item.medalhas.map(
                        (medalha, index) => (

                          <span key={index}>
                            🏅 {medalha}
                          </span>

                        )
                      )}

                    </div>

                  ) : (

                    <div className="comando-consulta-empty-small">
                      Nenhuma medalha cadastrada.
                    </div>

                  )}

                </section>

              </div>

              {/* =============================================
                  ÚLTIMOS REGISTROS
              ============================================= */}

              <section className="comando-consulta-block">

                <div className="comando-consulta-block-title">

                  <div>
                    <small>
                      ATIVIDADE RECENTE
                    </small>

                    <h3>
                      Últimos registros
                    </h3>
                  </div>

                </div>

                <div className="comando-consulta-recent-grid">

                  <div className="comando-consulta-recent">

                    <small>
                      ÚLTIMA AÇÃO
                    </small>

                    {item.ultimaAcao ? (
                      <>

                        <strong>
                          {item.ultimaAcao
                            .tipoAcao ||
                            "-"}
                        </strong>

                        <span>
                          Nº{" "}
                          {item.ultimaAcao
                            .numeroAcao ||
                            "-"}
                        </span>

                        <span>
                          {formatarData(
                            item.ultimaAcao
                              .dataAcao
                          )}
                        </span>

                        <span>
                          {item.ultimaAcao
                            .status ||
                            "-"}
                        </span>

                      </>
                    ) : (
                      <span>
                        Sem ação registrada.
                      </span>
                    )}

                  </div>

                  <div className="comando-consulta-recent">

                    <small>
                      ÚLTIMO RSO
                    </small>

                    {item.ultimaRSO ? (

                      <strong>
                        {formatarDataHora(
                          item.ultimaRSO
                            .createdAt ||
                            item.ultimaRSO
                              .data
                        )}
                      </strong>

                    ) : (

                      <span>
                        Sem RSO registrado.
                      </span>

                    )}

                  </div>

                  <div className="comando-consulta-recent">

                    <small>
                      ÚLTIMO COMUNICADO
                    </small>

                    {item.ultimoComunicado ? (
                      <>

                        <strong>
                          {
                            item
                              .ultimoComunicado
                              .titulo
                          }
                        </strong>

                        <span>
                          {formatarDataHora(
                            item
                              .ultimoComunicado
                              .createdAt
                          )}
                        </span>

                      </>
                    ) : (
                      <span>
                        Sem comunicado recente.
                      </span>
                    )}

                  </div>

                </div>

              </section>

            </article>
          ))}

        </div>
      )}

    </div>
  );
}