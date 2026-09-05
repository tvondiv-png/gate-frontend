import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useOutletContext
} from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-estagiarios.css";

/* =========================================================
   HELPERS
========================================================= */

const formatarData = (data) => {
  if (!data) return "-";

  const valor = new Date(data);

  if (Number.isNaN(valor.getTime())) {
    return "-";
  }

  return valor.toLocaleDateString(
    "pt-BR"
  );
};

const limitarPercentual = (valor) => {
  const numero = Number(valor || 0);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, numero)
  );
};

const pegarMeta = (
  metas,
  chave,
  fallback = 0
) => {
  const meta = metas?.[chave];

  if (
    meta === null ||
    meta === undefined
  ) {
    return fallback;
  }

  if (
    typeof meta === "number"
  ) {
    return meta;
  }

  if (
    typeof meta === "object"
  ) {
    if (
      meta.habilitada === false
    ) {
      return 0;
    }

    if (
      meta.valor !== undefined
    ) {
      return Number(
        meta.valor || 0
      );
    }

    if (
      meta.maximo !== undefined
    ) {
      return Number(
        meta.maximo || 0
      );
    }
  }

  return fallback;
};

const pegarProgresso = (
  progresso,
  chaves = [],
  fallback = 0
) => {
  for (
    const chave of chaves
  ) {
    if (
      progresso?.[chave] !==
      undefined
    ) {
      return Number(
        progresso[chave] || 0
      );
    }
  }

  return fallback;
};

const percentualMeta = (
  atual,
  meta
) => {
  const valorAtual =
    Number(atual || 0);

  const valorMeta =
    Number(meta || 0);

  if (valorMeta <= 0) {
    return 100;
  }

  return limitarPercentual(
    (valorAtual / valorMeta) *
      100
  );
};

const statusLabel = (
  status
) => {
  switch (status) {
    case "EM_ANDAMENTO":
      return "Em estágio";

    case "APTO_APROVACAO":
      return "Apto para aprovação";

    case "APROVACAO_SOLICITADA":
      return "Aprovação solicitada";

    case "APROVADO":
      return "Aprovado";

    case "REPROVADO":
      return "Reprovado";

    case "DESLIGADO":
      return "Desligado";

    default:
      return status || "-";
  }
};

const statusClass = (
  status
) => {
  switch (status) {
    case "APTO_APROVACAO":
      return "success";

    case "APROVACAO_SOLICITADA":
      return "waiting";

    case "REPROVADO":
    case "DESLIGADO":
      return "danger";

    default:
      return "active";
  }
};

/* =========================================================
   COMPONENTE DE META
========================================================= */

function MetaItem({
  titulo,
  atual,
  meta,
  sufixo = "",
  percentual
}) {
  const perc =
    percentual !== undefined
      ? limitarPercentual(
          percentual
        )
      : percentualMeta(
          atual,
          meta
        );

  return (
    <div className="rocam-trainee-goal">

      <div className="rocam-trainee-goal-top">

        <span>
          {titulo}
        </span>

        <strong>
          {atual}
          {sufixo}

          {meta !== null &&
            meta !== undefined && (
              <>
                {" "}
                /{" "}
                {meta}
                {sufixo}
              </>
            )}
        </strong>

      </div>

      <div className="rocam-trainee-progress-track">

        <div
          className="rocam-trainee-progress-fill"
          style={{
            width: `${perc}%`
          }}
        />

      </div>

      <small>
        {Math.round(perc)}%
      </small>

    </div>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function RocamEstagiarios() {
  const navigate =
    useNavigate();

  const {
    contexto
  } =
    useOutletContext();

  const [
    estagiarios,
    setEstagiarios
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    erro,
    setErro
  ] = useState("");

  const [
    busca,
    setBusca
  ] = useState("");

  /* =========================================================
     CARREGAR
  ========================================================= */

  const carregar =
    async () => {
      try {
        setLoading(true);
        setErro("");

        const res =
          await api.get(
            "/api/rocam/comando/estagiarios"
          );

        setEstagiarios(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(
          "Erro ao carregar Estagiários ROCAM:",
          err
        );

        setEstagiarios([]);

        setErro(
          err.response?.data?.message ||
            "Não foi possível carregar os Estagiários ROCAM."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    carregar();
  }, []);

  /* =========================================================
     FILTRO
  ========================================================= */

  const listaFiltrada =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return estagiarios;
      }

      return estagiarios.filter(
        (item) => {
          const nome =
            String(
              item.nome || ""
            ).toLowerCase();

          const funcional =
            String(
              item.funcional || ""
            ).toLowerCase();

          const patente =
            String(
              item.patente || ""
            ).toLowerCase();

          return (
            nome.includes(termo) ||
            funcional.includes(termo) ||
            patente.includes(termo)
          );
        }
      );
    }, [
      estagiarios,
      busca
    ]);

  /* =========================================================
     RESUMO
  ========================================================= */

  const resumo =
    useMemo(() => {
      let andamento = 0;
      let aptos = 0;
      let solicitados = 0;

      estagiarios.forEach(
        (item) => {
          const status =
            item.statusEstagio ||
            item.stage?.status;

          if (
            status ===
            "EM_ANDAMENTO"
          ) {
            andamento++;
          }

          if (
            status ===
            "APTO_APROVACAO"
          ) {
            aptos++;
          }

          if (
            status ===
            "APROVACAO_SOLICITADA"
          ) {
            solicitados++;
          }
        }
      );

      return {
        total:
          estagiarios.length,

        andamento,
        aptos,
        solicitados
      };
    }, [estagiarios]);

  /* =========================================================
     SEGURANÇA VISUAL
  ========================================================= */

  if (
    !contexto?.podeGerenciar
  ) {
    return (
      <div className="rocam-trainees-page">

        <section className="rocam-trainees-denied">

          <span>
            ACESSO RESTRITO
          </span>

          <h1>
            Gestão de Estagiários
          </h1>

          <p>
            Essa área está disponível
            apenas para o Comando ROCAM,
            Subcomando ROCAM, Comando do
            Batalhão e Superadmin.
          </p>

          <button
            type="button"
            onClick={() =>
              navigate("/rocam")
            }
          >
            Voltar
          </button>

        </section>

      </div>
    );
  }

  return (
    <div className="rocam-trainees-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="rocam-trainees-hero">

        <div>

          <span className="rocam-trainees-kicker">
            COMANDO ROCAM
          </span>

          <h1>
            Estagiários ROCAM
          </h1>

          <p>
            Acompanhe individualmente
            metas, avaliações,
            patrulhamento e evolução dos
            policiais em estágio ROCAM.
          </p>

        </div>

        <div className="rocam-trainees-hero-actions">

          <button
            type="button"
            className="rocam-trainees-btn secondary"
            onClick={carregar}
          >
            Recarregar
          </button>

          <button
            type="button"
            className="rocam-trainees-btn primary"
            onClick={() =>
              navigate(
                "/rocam/novo-estagiario"
              )
            }
          >
            + Novo Estagiário
          </button>

        </div>

      </section>

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <section className="rocam-trainees-summary">

        <div className="rocam-trainees-summary-card">

          <small>
            ESTAGIÁRIOS
          </small>

          <strong>
            {resumo.total}
          </strong>

          <span>
            vínculos ativos
          </span>

        </div>

        <div className="rocam-trainees-summary-card">

          <small>
            EM ANDAMENTO
          </small>

          <strong>
            {resumo.andamento}
          </strong>

          <span>
            estágio ativo
          </span>

        </div>

        <div className="rocam-trainees-summary-card success">

          <small>
            APTOS
          </small>

          <strong>
            {resumo.aptos}
          </strong>

          <span>
            prontos para análise
          </span>

        </div>

        <div className="rocam-trainees-summary-card waiting">

          <small>
            APROVAÇÕES
          </small>

          <strong>
            {resumo.solicitados}
          </strong>

          <span>
            aguardando decisão
          </span>

        </div>

      </section>

      {/* =====================================================
          BUSCA
      ===================================================== */}

      <section className="rocam-trainees-toolbar">

        <div className="rocam-trainees-search">

          <label>
            Localizar Estagiário ROCAM
          </label>

          <input
            type="text"
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            placeholder="Digite nome, funcional ou patente"
          />

        </div>

        <div className="rocam-trainees-count">
          Exibindo{" "}
          <strong>
            {listaFiltrada.length}
          </strong>{" "}
          de{" "}
          <strong>
            {estagiarios.length}
          </strong>
        </div>

      </section>

      {/* =====================================================
          ERRO
      ===================================================== */}

      {erro && (
        <div className="rocam-trainees-alert">
          {erro}
        </div>
      )}

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      {loading ? (

        <div className="rocam-trainees-empty">
          Carregando Estagiários ROCAM...
        </div>

      ) : listaFiltrada.length ===
        0 ? (

        <div className="rocam-trainees-empty">

          <strong>
            Nenhum Estagiário ROCAM
          </strong>

          <span>
            Não existem estagiários
            correspondentes ao filtro
            informado.
          </span>

        </div>

      ) : (

        <section className="rocam-trainees-list">

          {listaFiltrada.map(
            (item) => {

              const stage =
                item.stage || {};

              const metas =
                item.metas ||
                stage.metas ||
                {};

              const progresso =
                item.progresso ||
                stage.progresso ||
                {};

              const status =
                item.statusEstagio ||
                stage.status ||
                "EM_ANDAMENTO";

              /* =============================================
                 HORAS
              ============================================= */

              const metaHoras =
                pegarMeta(
                  metas,
                  "horasPatrulhamento",
                  0
                );

              const horas =
                pegarProgresso(
                  progresso,
                  [
                    "horasCumpridas",
                    "horasPatrulhamento",
                    "horasRealizadas"
                  ],
                  0
                );

              /* =============================================
                 AVALIAÇÕES
              ============================================= */

              const metaAvaliacoes =
                pegarMeta(
                  metas,
                  "quantidadeAvaliacoes",
                  0
                );

              const avaliacoes =
                pegarProgresso(
                  progresso,
                  [
                    "avaliacoesRealizadas",
                    "quantidadeAvaliacoes",
                    "totalAvaliacoes"
                  ],
                  0
                );

              const mediaAvaliacoes =
                pegarProgresso(
                  progresso,
                  [
                    "mediaAvaliacoes",
                    "mediaAvaliacao"
                  ],
                  0
                );

              const metaMedia =
                pegarMeta(
                  metas,
                  "mediaMinimaAvaliacoes",
                  0
                );

              /* =============================================
                 QUESTIONÁRIOS
              ============================================= */

              const metaQuestionarios =
                pegarMeta(
                  metas,
                  "quantidadeQuestionarios",
                  0
                );

              const questionarios =
                pegarProgresso(
                  progresso,
                  [
                    "questionariosConcluidos",
                    "quantidadeQuestionarios",
                    "totalQuestionarios"
                  ],
                  0
                );

              const mediaQuestionarios =
                pegarProgresso(
                  progresso,
                  [
                    "mediaQuestionarios",
                    "aproveitamentoQuestionarios"
                  ],
                  0
                );

              /* =============================================
                 PROGRESSO GERAL
              ============================================= */

              const percentualBackend =
                pegarProgresso(
                  progresso,
                  [
                    "percentualGeral",
                    "percentual",
                    "progressoGeral"
                  ],
                  -1
                );

              const percentualCalculado = (() => {
                const partes = [];

                if (metaHoras > 0) {
                  partes.push(
                    percentualMeta(
                      horas,
                      metaHoras
                    )
                  );
                }

                if (
                  metaAvaliacoes > 0
                ) {
                  partes.push(
                    percentualMeta(
                      avaliacoes,
                      metaAvaliacoes
                    )
                  );
                }

                if (
                  metaMedia > 0
                ) {
                  partes.push(
                    percentualMeta(
                      mediaAvaliacoes,
                      metaMedia
                    )
                  );
                }

                if (
                  metaQuestionarios >
                  0
                ) {
                  partes.push(
                    percentualMeta(
                      questionarios,
                      metaQuestionarios
                    )
                  );
                }

                if (
                  partes.length === 0
                ) {
                  return 0;
                }

                return (
                  partes.reduce(
                    (
                      soma,
                      valor
                    ) =>
                      soma + valor,
                    0
                  ) /
                  partes.length
                );
              })();

              const percentualGeral =
                percentualBackend >= 0
                  ? limitarPercentual(
                      percentualBackend
                    )
                  : limitarPercentual(
                      percentualCalculado
                    );

              return (
                <article
                  key={
                    item._id ||
                    item.user
                  }
                  className="rocam-trainee-card"
                >

                  {/* =========================================
                      CABEÇALHO
                  ========================================= */}

                  <div className="rocam-trainee-header">

                    <div className="rocam-trainee-identity">

                      <div className="rocam-trainee-avatar">

                        {String(
                          item.nome ||
                            "R"
                        )
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map(
                            (parte) =>
                              parte[0]
                          )
                          .join("")
                          .toUpperCase()}

                      </div>

                      <div>

                        <small>
                          {item.patente ||
                            "Policial"}
                        </small>

                        <h2>
                          {item.nome}
                        </h2>

                        <span>
                          Funcional:{" "}
                          {item.funcional ||
                            "-"}
                        </span>

                      </div>

                    </div>

                    <div className="rocam-trainee-header-right">

                      <span
                        className={`rocam-trainee-status ${statusClass(
                          status
                        )}`}
                      >
                        {statusLabel(
                          status
                        )}
                      </span>

                      <small>
                        Ingresso:{" "}
                        {formatarData(
                          item.dataIngressoRocam ||
                            stage.dataInicio
                        )}
                      </small>

                    </div>

                  </div>

                  {/* =========================================
                      PROGRESSO GERAL
                  ========================================= */}

                  <div className="rocam-trainee-overall">

                    <div className="rocam-trainee-overall-title">

                      <div>
                        <small>
                          PROGRESSO GERAL
                        </small>

                        <strong>
                          Evolução do estágio
                        </strong>
                      </div>

                      <span>
                        {Math.round(
                          percentualGeral
                        )}
                        %
                      </span>

                    </div>

                    <div className="rocam-trainee-overall-track">

                      <div
                        className="rocam-trainee-overall-fill"
                        style={{
                          width:
                            `${percentualGeral}%`
                        }}
                      />

                    </div>

                  </div>

                  {/* =========================================
                      METAS
                  ========================================= */}

                  <div className="rocam-trainee-goals-grid">

                    <MetaItem
                      titulo="Patrulhamento ROCAM"
                      atual={horas}
                      meta={metaHoras}
                      sufixo="h"
                    />

                    <MetaItem
                      titulo="Avaliações"
                      atual={avaliacoes}
                      meta={metaAvaliacoes}
                    />

                    <MetaItem
                      titulo="Média das avaliações"
                      atual={
                        mediaAvaliacoes
                      }
                      meta={metaMedia}
                      sufixo="%"
                    />

                    <MetaItem
                      titulo="Questionários"
                      atual={questionarios}
                      meta={
                        metaQuestionarios
                      }
                    />

                  </div>

                  {/* =========================================
                      DADOS ADICIONAIS
                  ========================================= */}

                  <div className="rocam-trainee-details">

                    <div>
                      <small>
                        Média questionários
                      </small>

                      <strong>
                        {mediaQuestionarios}
                        %
                      </strong>
                    </div>

                    <div>
                      <small>
                        Critérios de avaliação
                      </small>

                      <strong>
                        {
                          (
                            item.criteriosAvaliacao ||
                            stage.criteriosAvaliacao ||
                            []
                          ).length
                        }
                      </strong>
                    </div>

                    <div>
                      <small>
                        Situação ROCAM
                      </small>

                      <strong>
                        {item.situacaoRocam ||
                          "EM_ESTAGIO"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Data início
                      </small>

                      <strong>
                        {formatarData(
                          item.dataInicioEstagio ||
                            stage.dataInicio
                        )}
                      </strong>
                    </div>

                  </div>

                  {/* =========================================
                      AÇÕES
                  ========================================= */}

                  <div className="rocam-trainee-actions">

                    <button
                      type="button"
                      className="rocam-trainee-btn ghost"
                      disabled
                      title="Será conectado na próxima etapa"
                    >
                      Abrir ficha
                    </button>

                    <button
                      type="button"
                      className="rocam-trainee-btn ghost"
                      disabled
                      title="Será conectado na próxima etapa"
                    >
                      Histórico
                    </button>

                    <button
                      type="button"
                      className="rocam-trainee-btn ghost"
                      disabled
                      title="Será conectado na próxima etapa"
                    >
                      Editar metas
                    </button>

                    {status ===
                      "APTO_APROVACAO" && (
                      <button
                        type="button"
                        className="rocam-trainee-btn success"
                        disabled
                        title="Aprovação será conectada na próxima etapa"
                      >
                        Aprovar estágio
                      </button>
                    )}

                  </div>

                </article>
              );
            }
          )}

        </section>

      )}

    </div>
  );
}