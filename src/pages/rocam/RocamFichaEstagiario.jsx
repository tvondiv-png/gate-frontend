import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate,
  useParams,
  useOutletContext
} from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-ficha-estagiario.css";

/* =========================================================
   HELPERS
========================================================= */

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

const obterValorMeta = (
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

  if (typeof meta === "number") {
    return meta;
  }

  if (typeof meta === "object") {
    if (meta.habilitada === false) {
      return 0;
    }

    if (meta.valor !== undefined) {
      return Number(
        meta.valor || 0
      );
    }

    if (meta.maximo !== undefined) {
      return Number(
        meta.maximo || 0
      );
    }
  }

  return fallback;
};

const obterProgresso = (
  progresso,
  chaves,
  fallback = 0
) => {
  for (const chave of chaves) {
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
    (
      valorAtual /
      valorMeta
    ) * 100
  );
};

const statusLabel = (status) => {
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

/* =========================================================
   META
========================================================= */

function MetaCard({
  titulo,
  atual,
  meta,
  sufixo = ""
}) {
  const percentual =
    percentualMeta(
      atual,
      meta
    );

  const cumprida =
    percentual >= 100;

  return (
    <article
      className={`rocam-file-goal ${
        cumprida
          ? "completed"
          : ""
      }`}
    >
      <div className="rocam-file-goal-header">
        <span>
          {titulo}
        </span>

        <strong>
          {atual}
          {sufixo}
          {" / "}
          {meta}
          {sufixo}
        </strong>
      </div>

      <div className="rocam-file-goal-track">
        <div
          className="rocam-file-goal-fill"
          style={{
            width:
              `${percentual}%`
          }}
        />
      </div>

      <div className="rocam-file-goal-footer">
        <small>
          {Math.round(
            percentual
          )}
          %
        </small>

        <span>
          {cumprida
            ? "Meta cumprida"
            : "Em andamento"}
        </span>
      </div>
    </article>
  );
}

/* =========================================================
   HISTÓRICO
========================================================= */

function HistoricoItem({
  item
}) {
  return (
    <article className="rocam-file-history-item">
      <div className="rocam-file-history-marker" />

      <div className="rocam-file-history-content">
        <div className="rocam-file-history-top">
          <strong>
            {item.titulo ||
              item.evento ||
              "Registro ROCAM"}
          </strong>

          <span>
            {formatarDataHora(
              item.dataEvento ||
                item.createdAt
            )}
          </span>
        </div>

        {item.descricao && (
          <p>
            {item.descricao}
          </p>
        )}

        <div className="rocam-file-history-meta">
          {item.responsavel && (
            <span>
              Responsável:{" "}
              {item.responsavel.nome ||
                "-"}
            </span>
          )}

          {item.numeroBoletim && (
            <span>
              Boletim:{" "}
              {item.numeroBoletim}
            </span>
          )}

          {item.papelAnterior && (
            <span>
              De:{" "}
              {item.papelAnterior}
            </span>
          )}

          {item.papelNovo && (
            <span>
              Para:{" "}
              {item.papelNovo}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function RocamFichaEstagiario() {
  const { userId } =
    useParams();

  const navigate =
    useNavigate();

  const {
    contexto
  } =
    useOutletContext();

  const [
    ficha,
    setFicha
  ] = useState(null);

  const [
    historico,
    setHistorico
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
    sucesso,
    setSucesso
  ] = useState("");

  const [
    modalAprovacao,
    setModalAprovacao
  ] = useState(false);

  const [
    numeroBoletim,
    setNumeroBoletim
  ] = useState("");

  const [
    observacaoAprovacao,
    setObservacaoAprovacao
  ] = useState("");

  const [
    aprovando,
    setAprovando
  ] = useState(false);

  const [
    modalDesligamento,
    setModalDesligamento
  ] = useState(false);

  const [
    motivoDesligamento,
    setMotivoDesligamento
  ] = useState("");

  const [
    boletimDesligamento,
    setBoletimDesligamento
  ] = useState("");

  const [
    desligando,
    setDesligando
  ] = useState(false);

  /* =========================================================
     CARREGAR FICHA
  ========================================================= */

  const carregar =
    async () => {
      try {
        setLoading(true);
        setErro("");

        const res =
          await api.get(
            `/api/rocam/comando/estagiarios/${userId}/ficha`
          );

        setFicha({
          ...res.data.profile,

          stage:
            res.data.stage,

          metas:
            res.data.stage
              ?.metas || {},

          progresso:
            res.data.stage
              ?.progresso || {},

          statusEstagio:
            res.data.stage
              ?.status,

          situacaoCalculada:
            res.data.situacao
        });

        setHistorico(
          Array.isArray(
            res.data.historico
          )
            ? res.data.historico
            : []
        );
      } catch (err) {
        console.error(
          "Erro ao carregar ficha ROCAM:",
          err
        );

        setFicha(null);

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível carregar a ficha do Estagiário ROCAM."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (!userId) {
      setErro(
        "Policial não informado."
      );

      setLoading(false);

      return;
    }

    carregar();
  }, [userId]);

  /* =========================================================
     APROVAR ESTÁGIO
  ========================================================= */

  const aprovarEstagio =
    async () => {
      if (
        !numeroBoletim.trim()
      ) {
        setErro(
          "Informe o número do boletim de aprovação."
        );

        return;
      }

      try {
        setAprovando(true);

        setErro("");
        setSucesso("");

        await api.patch(
          `/api/rocam/comando/estagiarios/${userId}/aprovar`,
          {
            numeroBoletim:
              numeroBoletim.trim(),

            observacao:
              observacaoAprovacao.trim()
          }
        );

        setSucesso(
          "Estágio aprovado. Policial promovido a Braçal ROCAM."
        );

        setModalAprovacao(
          false
        );

        setNumeroBoletim("");
        setObservacaoAprovacao(
          ""
        );

        await carregar();
      } catch (err) {
        console.error(
          "Erro ao aprovar estágio:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível aprovar o estágio."
        );
      } finally {
        setAprovando(false);
      }
    };


  /* =========================================================
     DESLIGAR DA ROCAM
  ========================================================= */

  const desligarDaRocam =
    async () => {
      if (
        !motivoDesligamento.trim()
      ) {
        setErro(
          "Informe o motivo do desligamento."
        );

        return;
      }

      try {
        setDesligando(true);

        setErro("");
        setSucesso("");

        await api.patch(
          `/api/rocam/comando/desligar/${userId}`,
          {
            motivo:
              motivoDesligamento.trim(),

            numeroBoletim:
              boletimDesligamento.trim()
          }
        );

        setModalDesligamento(false);

        setMotivoDesligamento("");
        setBoletimDesligamento("");

        navigate(
          "/rocam/hierarquia",
          {
            replace: true
          }
        );
      } catch (err) {
        console.error(
          "Erro ao desligar da ROCAM:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível desligar o policial da ROCAM."
        );
      } finally {
        setDesligando(false);
      }
    };

  /* =========================================================
     DADOS
  ========================================================= */

  const stage =
    ficha?.stage || {};

  const metas =
    ficha?.metas ||
    stage?.metas ||
    {};

  const progresso =
    ficha?.progresso ||
    stage?.progresso ||
    {};

  const situacaoCalculada =
    ficha?.situacaoCalculada ||
    {};

  /* =========================================================
     HORAS
  ========================================================= */

  const metaHoras =
    obterValorMeta(
      metas,
      "horasPatrulhamento",
      0
    );

  const horas =
    obterProgresso(
      progresso,
      [
        "horasCumpridas",
        "horasPatrulhamento",
        "horasRealizadas"
      ],
      0
    );

  /* =========================================================
     PATRULHAS
  ========================================================= */

  const metaPatrulhas =
    obterValorMeta(
      metas,
      "quantidadePatrulhas",
      0
    );

  const patrulhas =
    obterProgresso(
      progresso,
      [
        "patrulhasRealizadas",
        "quantidadePatrulhas"
      ],
      0
    );

  /* =========================================================
     AVALIAÇÕES
  ========================================================= */

  const metaAvaliacoes =
    obterValorMeta(
      metas,
      "quantidadeAvaliacoes",
      0
    );

  const avaliacoes =
    obterProgresso(
      progresso,
      [
        "avaliacoesRealizadas",
        "quantidadeAvaliacoes",
        "totalAvaliacoes"
      ],
      0
    );

  const metaMediaAvaliacoes =
    obterValorMeta(
      metas,
      "mediaMinimaAvaliacoes",
      0
    );

  const mediaAvaliacoes =
    obterProgresso(
      progresso,
      [
        "mediaAvaliacoes",
        "mediaAvaliacao"
      ],
      0
    );

  /* =========================================================
     QUESTIONÁRIOS
  ========================================================= */

  const metaQuestionarios =
    obterValorMeta(
      metas,
      "quantidadeQuestionarios",
      0
    );

  const questionarios =
    obterProgresso(
      progresso,
      [
        "questionariosConcluidos",
        "quantidadeQuestionarios",
        "totalQuestionarios"
      ],
      0
    );

  const metaMediaQuestionarios =
    obterValorMeta(
      metas,
      "aproveitamentoQuestionarios",
      0
    );

  const mediaQuestionarios =
    obterProgresso(
      progresso,
      [
        "mediaQuestionarios",
        "aproveitamentoQuestionarios"
      ],
      0
    );

  /* =========================================================
     AUSÊNCIAS
  ========================================================= */

  const metaAusencias =
    obterValorMeta(
      metas,
      "ausenciasInjustificadas",
      0
    );

  const ausencias =
    obterProgresso(
      progresso,
      [
        "ausenciasInjustificadas",
        "totalAusenciasInjustificadas"
      ],
      0
    );

  /* =========================================================
     PERCENTUAL GERAL
  ========================================================= */

  const percentualGeral =
    useMemo(() => {
      if (!ficha) {
        return 0;
      }

      if (
        situacaoCalculada
          ?.percentualGeral !==
        undefined
      ) {
        return limitarPercentual(
          situacaoCalculada
            .percentualGeral
        );
      }

      const backend =
        obterProgresso(
          progresso,
          [
            "percentualGeral",
            "percentual",
            "progressoGeral"
          ],
          -1
        );

      if (backend >= 0) {
        return limitarPercentual(
          backend
        );
      }

      const partes = [];

      if (metaHoras > 0) {
        partes.push(
          percentualMeta(
            horas,
            metaHoras
          )
        );
      }

      if (metaPatrulhas > 0) {
        partes.push(
          percentualMeta(
            patrulhas,
            metaPatrulhas
          )
        );
      }

      if (metaAvaliacoes > 0) {
        partes.push(
          percentualMeta(
            avaliacoes,
            metaAvaliacoes
          )
        );
      }

      if (
        metaMediaAvaliacoes > 0
      ) {
        partes.push(
          percentualMeta(
            mediaAvaliacoes,
            metaMediaAvaliacoes
          )
        );
      }

      if (
        metaQuestionarios > 0
      ) {
        partes.push(
          percentualMeta(
            questionarios,
            metaQuestionarios
          )
        );
      }

      if (
        metaMediaQuestionarios >
        0
      ) {
        partes.push(
          percentualMeta(
            mediaQuestionarios,
            metaMediaQuestionarios
          )
        );
      }

      if (
        partes.length === 0
      ) {
        return 0;
      }

      return limitarPercentual(
        partes.reduce(
          (total, valor) =>
            total + valor,
          0
        ) /
          partes.length
      );
    }, [
      ficha,
      situacaoCalculada,
      progresso,
      metaHoras,
      horas,
      metaPatrulhas,
      patrulhas,
      metaAvaliacoes,
      avaliacoes,
      metaMediaAvaliacoes,
      mediaAvaliacoes,
      metaQuestionarios,
      questionarios,
      metaMediaQuestionarios,
      mediaQuestionarios
    ]);

  /* =========================================================
     STATUS
  ========================================================= */

  const status =
    ficha?.statusEstagio ||
    stage?.status ||
    "-";

  const apto =
    situacaoCalculada
      ?.apto === true ||
    status ===
      "APTO_APROVACAO" ||
    percentualGeral >= 100;

  const jaAprovado =
    status === "APROVADO" ||
    ficha?.papelRocam ===
      "BRACAL_ROCAM";

  /* =========================================================
     ACESSO
  ========================================================= */

  if (
    !contexto?.podeGerenciar
  ) {
    return (
      <div className="rocam-file-page">
        <section className="rocam-file-denied">
          <span>
            ACESSO RESTRITO
          </span>

          <h1>
            Ficha do Estagiário
          </h1>

          <p>
            Seu nível de acesso não
            permite consultar esta
            ficha administrativa.
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

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="rocam-file-loading">
        Carregando ficha ROCAM...
      </div>
    );
  }

  /* =========================================================
     ERRO SEM FICHA
  ========================================================= */

  if (
    erro &&
    !ficha
  ) {
    return (
      <div className="rocam-file-page">
        <div className="rocam-file-alert">
          {erro}
        </div>

        <button
          type="button"
          className="rocam-file-back"
          onClick={() =>
            navigate(-1)
          }
        >
          ← Voltar
        </button>
      </div>
    );
  }

  /* =========================================================
     TELA
  ========================================================= */

  return (
    <div className="rocam-file-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="rocam-file-hero">
        <div className="rocam-file-hero-left">
          <button
            type="button"
            className="rocam-file-back"
            onClick={() =>
              navigate(-1)
            }
          >
            ← Voltar
          </button>

          <span className="rocam-file-kicker">
            FICHA INDIVIDUAL • ROCAM
          </span>

          <h1>
            {ficha.patente || ""}{" "}
            {ficha.nome}
          </h1>

          <p>
            Funcional{" "}
            {ficha.funcional || "-"} •
            Ingresso ROCAM{" "}
            {formatarData(
              ficha.dataIngressoRocam
            )}
          </p>
        </div>

        <div className="rocam-file-status-box">
          <small>
            SITUAÇÃO DO ESTÁGIO
          </small>

          <strong>
            {statusLabel(status)}
          </strong>

          <span>
            {Math.round(
              percentualGeral
            )}
            % concluído
          </span>
        </div>
      </section>

      {/* =====================================================
          ALERTAS
      ===================================================== */}

      {erro && (
        <div className="rocam-file-alert">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rocam-file-success">
          {sucesso}
        </div>
      )}

      {/* =====================================================
          PROGRESSO
      ===================================================== */}

      <section className="rocam-file-progress-section">
        <div className="rocam-file-section-header">
          <div>
            <small>
              ESTÁGIO ROCAM
            </small>

            <h2>
              Progresso geral
            </h2>
          </div>

          <strong>
            {Math.round(
              percentualGeral
            )}
            %
          </strong>
        </div>

        <div className="rocam-file-overall-track">
          <div
            className="rocam-file-overall-fill"
            style={{
              width:
                `${percentualGeral}%`
            }}
          />
        </div>

        <div className="rocam-file-goals-grid">

          <MetaCard
            titulo="Horas de patrulhamento ROCAM"
            atual={horas}
            meta={metaHoras}
            sufixo="h"
          />

          {metaPatrulhas > 0 && (
            <MetaCard
              titulo="Patrulhas ROCAM"
              atual={patrulhas}
              meta={metaPatrulhas}
            />
          )}

          <MetaCard
            titulo="Avaliações"
            atual={avaliacoes}
            meta={metaAvaliacoes}
          />

          <MetaCard
            titulo="Média das avaliações"
            atual={mediaAvaliacoes}
            meta={
              metaMediaAvaliacoes
            }
            sufixo="%"
          />

          <MetaCard
            titulo="Questionários"
            atual={questionarios}
            meta={metaQuestionarios}
          />

          <MetaCard
            titulo="Média dos questionários"
            atual={
              mediaQuestionarios
            }
            meta={
              metaMediaQuestionarios
            }
            sufixo="%"
          />

        </div>
      </section>

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <section className="rocam-file-data-grid">
        <div className="rocam-file-data-card">
          <small>
            PAPEL ROCAM
          </small>

          <strong>
            {ficha.papelRocam ||
              "ESTAGIARIO_ROCAM"}
          </strong>
        </div>

        <div className="rocam-file-data-card">
          <small>
            SITUAÇÃO ROCAM
          </small>

          <strong>
            {ficha.situacaoRocam ||
              "-"}
          </strong>
        </div>

        <div className="rocam-file-data-card">
          <small>
            INÍCIO DO ESTÁGIO
          </small>

          <strong>
            {formatarData(
              ficha.dataInicioEstagio ||
                stage.dataInicio
            )}
          </strong>
        </div>

        <div className="rocam-file-data-card">
          <small>
            AUSÊNCIAS INJUSTIFICADAS
          </small>

          <strong>
            {ausencias}
            {" / "}
            {metaAusencias}
          </strong>
        </div>
      </section>

      {/* =====================================================
          CRITÉRIOS
      ===================================================== */}

      <section className="rocam-file-section">
        <div className="rocam-file-section-header">
          <div>
            <small>
              AVALIAÇÃO PRÁTICA
            </small>

            <h2>
              Critérios definidos
            </h2>
          </div>

          <strong>
            {
              (
                ficha
                  .criteriosAvaliacao ||
                stage
                  .criteriosAvaliacao ||
                []
              ).length
            }
          </strong>
        </div>

        {(
          ficha.criteriosAvaliacao ||
          stage.criteriosAvaliacao ||
          []
        ).length === 0 ? (
          <div className="rocam-file-empty">
            Nenhum critério cadastrado.
          </div>
        ) : (
          <div className="rocam-file-criteria-grid">
            {(
              ficha
                .criteriosAvaliacao ||
              stage
                .criteriosAvaliacao ||
              []
            ).map(
              (
                criterio,
                index
              ) => {
                const nome =
                  typeof criterio ===
                  "string"
                    ? criterio
                    : criterio
                        .label ||
                      criterio
                        .nome ||
                      criterio
                        .codigo ||
                      `Critério ${
                        index + 1
                      }`;

                return (
                  <div
                    key={
                      criterio.codigo ||
                      criterio.chave ||
                      `${nome}-${index}`
                    }
                    className="rocam-file-criterion"
                  >
                    <span>
                      ✓
                    </span>

                    <strong>
                      {nome}
                    </strong>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          DECISÃO
      ===================================================== */}

      <section
        className={`rocam-file-decision ${
          apto
            ? "ready"
            : ""
        }`}
      >
        <div>
          <small>
            SITUAÇÃO PARA CONCLUSÃO
          </small>

          <h2>
            {jaAprovado
              ? "Estágio concluído"
              : apto
              ? "Estagiário apto para aprovação"
              : "Estágio ainda em andamento"}
          </h2>

          <p>
            {jaAprovado
              ? "O policial já concluiu o Estágio ROCAM e está registrado como Braçal ROCAM."
              : apto
              ? "Todas as metas obrigatórias foram cumpridas. A aprovação definitiva exige o número do boletim."
              : "O policial ainda possui metas pendentes antes da conclusão do estágio ROCAM."}
          </p>
        </div>

        {!jaAprovado && (
          <button
            type="button"
            disabled={!apto}
            onClick={() => {
              setErro("");
              setModalAprovacao(
                true
              );
            }}
          >
            {apto
              ? "Aprovar estágio"
              : "Aguardando metas"}
          </button>
        )}
      </section>


      {/* =====================================================
          ADMINISTRAÇÃO ROCAM
      ===================================================== */}

      <section className="rocam-file-admin-actions">
        <div>
          <small>
            ADMINISTRAÇÃO ROCAM
          </small>

          <h2>
            Gestão do vínculo
          </h2>

          <p>
            O desligamento remove o policial
            da hierarquia ativa da ROCAM,
            mas preserva todo o histórico
            institucional e não exclui o
            usuário nem a Hierarquia Geral.
          </p>
        </div>

        <button
          type="button"
          className="rocam-file-danger-btn"
          onClick={() => {
            setErro("");
            setSucesso("");
            setModalDesligamento(true);
          }}
        >
          Desligar da ROCAM
        </button>
      </section>

      {/* =====================================================
          HISTÓRICO
      ===================================================== */}

      <section className="rocam-file-section">
        <div className="rocam-file-section-header">
          <div>
            <small>
              HISTÓRICO ROCAM
            </small>

            <h2>
              Linha do tempo
            </h2>
          </div>

          <strong>
            {historico.length}
          </strong>
        </div>

        {historico.length === 0 ? (
          <div className="rocam-file-empty">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="rocam-file-history">
            {historico.map(
              (
                item,
                index
              ) => (
                <HistoricoItem
                  key={
                    item._id ||
                    `${item.evento}-${index}`
                  }
                  item={item}
                />
              )
            )}
          </div>
        )}
      </section>

      {/* =====================================================
          MODAL DE APROVAÇÃO
      ===================================================== */}

      {modalAprovacao && (
        <div
          className="rocam-approval-overlay"
          onClick={() =>
            !aprovando &&
            setModalAprovacao(false)
          }
        >
          <div
            className="rocam-approval-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="rocam-approval-header">
              <div>
                <small>
                  COMANDO ROCAM
                </small>

                <h2>
                  Aprovação do Estágio
                </h2>

                <p>
                  {ficha.patente || ""}{" "}
                  {ficha.nome}
                </p>
              </div>

              <strong>
                {Math.round(
                  percentualGeral
                )}
                %
              </strong>
            </div>

            <div className="rocam-approval-warning">
              Após a confirmação,
              o policial deixará de
              ser Estagiário ROCAM
              e passará automaticamente
              para
              <strong>
                {" "}Braçal ROCAM
              </strong>.
            </div>

            <div className="rocam-approval-field">
              <label>
                Número do Boletim *
              </label>

              <input
                value={
                  numeroBoletim
                }
                onChange={(e) =>
                  setNumeroBoletim(
                    e.target.value
                  )
                }
                placeholder="Ex.: Bol G PM nº 123/26"
              />
            </div>

            <div className="rocam-approval-field">
              <label>
                Observação
              </label>

              <textarea
                rows="5"
                value={
                  observacaoAprovacao
                }
                onChange={(e) =>
                  setObservacaoAprovacao(
                    e.target.value
                  )
                }
                placeholder="Observações da aprovação..."
              />
            </div>

            <div className="rocam-approval-actions">
              <button
                type="button"
                className="cancel"
                disabled={aprovando}
                onClick={() =>
                  setModalAprovacao(
                    false
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirm"
                disabled={
                  aprovando ||
                  !numeroBoletim.trim()
                }
                onClick={
                  aprovarEstagio
                }
              >
                {aprovando
                  ? "Aprovando..."
                  : "Confirmar aprovação"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* =====================================================
          MODAL DE DESLIGAMENTO
      ===================================================== */}

      {modalDesligamento && (
        <div
          className="rocam-disconnect-overlay"
          onClick={() =>
            !desligando &&
            setModalDesligamento(false)
          }
        >
          <div
            className="rocam-disconnect-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="rocam-disconnect-header">
              <div>
                <small>
                  COMANDO ROCAM
                </small>

                <h2>
                  Desligamento ROCAM
                </h2>

                <p>
                  {ficha.patente || ""}{" "}
                  {ficha.nome}
                </p>
              </div>

              <span>
                !
              </span>
            </div>

            <div className="rocam-disconnect-warning">
              <strong>
                Atenção
              </strong>

              <p>
                O policial será retirado do
                efetivo ativo e da hierarquia
                ROCAM. O histórico permanecerá
                armazenado e o cadastro geral
                do policial não será excluído.
              </p>
            </div>

            <div className="rocam-disconnect-field">
              <label>
                Motivo do desligamento *
              </label>

              <textarea
                rows="5"
                value={
                  motivoDesligamento
                }
                onChange={(e) =>
                  setMotivoDesligamento(
                    e.target.value
                  )
                }
                placeholder="Informe detalhadamente o motivo do desligamento..."
              />
            </div>

            <div className="rocam-disconnect-field">
              <label>
                Número do Boletim
              </label>

              <input
                value={
                  boletimDesligamento
                }
                onChange={(e) =>
                  setBoletimDesligamento(
                    e.target.value
                  )
                }
                placeholder="Ex.: Bol G PM nº 124/26"
              />

              <small>
                Campo opcional.
              </small>
            </div>

            <div className="rocam-disconnect-actions">
              <button
                type="button"
                className="cancel"
                disabled={desligando}
                onClick={() =>
                  setModalDesligamento(false)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="disconnect"
                disabled={
                  desligando ||
                  !motivoDesligamento.trim()
                }
                onClick={
                  desligarDaRocam
                }
              >
                {desligando
                  ? "Desligando..."
                  : "Confirmar desligamento"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}