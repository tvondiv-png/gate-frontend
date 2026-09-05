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

import "../../styles/rocam-metas.css";

/* =========================================================
   HELPERS
========================================================= */

const numero = (
  valor,
  fallback = 0
) => {
  const n = Number(valor);

  return Number.isFinite(n)
    ? n
    : fallback;
};

const limitarPercentual = (
  valor
) => {
  return Math.max(
    0,
    Math.min(
      100,
      numero(valor)
    )
  );
};

const valorMeta = (
  metas,
  chave,
  campo = "valor"
) => {
  const meta =
    metas?.[chave];

  if (
    meta === null ||
    meta === undefined
  ) {
    return 0;
  }

  /*
    Compatibilidade com
    registros antigos.
  */
  if (
    typeof meta === "number"
  ) {
    return numero(meta);
  }

  if (
    meta.habilitada === false
  ) {
    return 0;
  }

  return numero(
    meta?.[campo]
  );
};

const metaHabilitada = (
  metas,
  chave
) => {
  const meta =
    metas?.[chave];

  if (
    meta === null ||
    meta === undefined
  ) {
    return false;
  }

  if (
    typeof meta === "number"
  ) {
    return true;
  }

  return (
    meta.habilitada !== false
  );
};

const valorProgresso = (
  progresso,
  chaves
) => {
  for (
    const chave of chaves
  ) {
    if (
      progresso?.[chave] !==
      undefined
    ) {
      return numero(
        progresso[chave]
      );
    }
  }

  return 0;
};

const percentualMeta = (
  atual,
  meta
) => {
  if (
    numero(meta) <= 0
  ) {
    return 100;
  }

  return limitarPercentual(
    (
      numero(atual) /
      numero(meta)
    ) *
      100
  );
};

const formatarNumero = (
  valor,
  casas = 1
) => {
  const n =
    numero(valor);

  if (
    Number.isInteger(n)
  ) {
    return n;
  }

  return n.toFixed(
    casas
  );
};

const statusTexto = (
  status,
  percentual
) => {
  if (
    status ===
      "APTO_APROVACAO" ||
    percentual >= 100
  ) {
    return "Apto";
  }

  if (
    status ===
    "APROVACAO_SOLICITADA"
  ) {
    return "Aguardando aprovação";
  }

  return "Em andamento";
};

const iniciais = (nome) =>
  String(nome || "R")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) =>
      item
        .charAt(0)
        .toUpperCase()
    )
    .join("");

/* =========================================================
   CALCULAR PROGRESSO LOCAL

   Serve como fallback caso percentualGeral
   ainda não tenha sido persistido.
========================================================= */

const calcularPercentual = (
  stage
) => {
  const metas =
    stage?.metas || {};

  const progresso =
    stage?.progresso || {};

  const backend =
    numero(
      progresso.percentualGeral,
      -1
    );

  if (backend >= 0) {
    return limitarPercentual(
      backend
    );
  }

  const partes = [];

  /* HORAS */

  if (
    metaHabilitada(
      metas,
      "horasPatrulhamento"
    )
  ) {
    partes.push(
      percentualMeta(
        valorProgresso(
          progresso,
          [
            "horasCumpridas",
            "horasPatrulhamento"
          ]
        ),

        valorMeta(
          metas,
          "horasPatrulhamento"
        )
      )
    );
  }

  /* PATRULHAS */

  if (
    metaHabilitada(
      metas,
      "quantidadePatrulhas"
    )
  ) {
    partes.push(
      percentualMeta(
        valorProgresso(
          progresso,
          [
            "patrulhasRealizadas",
            "quantidadePatrulhas"
          ]
        ),

        valorMeta(
          metas,
          "quantidadePatrulhas"
        )
      )
    );
  }

  /* AVALIAÇÕES */

  if (
    metaHabilitada(
      metas,
      "quantidadeAvaliacoes"
    )
  ) {
    partes.push(
      percentualMeta(
        valorProgresso(
          progresso,
          [
            "avaliacoesRealizadas",
            "quantidadeAvaliacoes"
          ]
        ),

        valorMeta(
          metas,
          "quantidadeAvaliacoes"
        )
      )
    );
  }

  /* MÉDIA */

  if (
    metaHabilitada(
      metas,
      "mediaMinimaAvaliacoes"
    )
  ) {
    partes.push(
      percentualMeta(
        valorProgresso(
          progresso,
          [
            "mediaAvaliacoes",
            "mediaAvaliacao"
          ]
        ),

        valorMeta(
          metas,
          "mediaMinimaAvaliacoes"
        )
      )
    );
  }

  /* QUESTIONÁRIOS */

  if (
    metaHabilitada(
      metas,
      "quantidadeQuestionarios"
    )
  ) {
    partes.push(
      percentualMeta(
        valorProgresso(
          progresso,
          [
            "questionariosConcluidos",
            "quantidadeQuestionarios"
          ]
        ),

        valorMeta(
          metas,
          "quantidadeQuestionarios"
        )
      )
    );
  }

  /* APROVEITAMENTO */

  if (
    metaHabilitada(
      metas,
      "aproveitamentoQuestionarios"
    )
  ) {
    partes.push(
      percentualMeta(
        valorProgresso(
          progresso,
          [
            "mediaQuestionarios",
            "aproveitamentoQuestionarios"
          ]
        ),

        valorMeta(
          metas,
          "aproveitamentoQuestionarios"
        )
      )
    );
  }

  if (!partes.length) {
    return 0;
  }

  return limitarPercentual(
    partes.reduce(
      (soma, item) =>
        soma + item,
      0
    ) /
      partes.length
  );
};

/* =========================================================
   PÁGINA
========================================================= */

export default function RocamMetas() {
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
    sucesso,
    setSucesso
  ] = useState("");

  const [
    busca,
    setBusca
  ] = useState("");

  const [
    filtroStatus,
    setFiltroStatus
  ] = useState("TODOS");

  /* =======================================================
     MODAL
  ======================================================= */

  const [
    modalAberto,
    setModalAberto
  ] = useState(false);

  const [
    selecionado,
    setSelecionado
  ] = useState(null);

  const [
    salvando,
    setSalvando
  ] = useState(false);

  const [
    form,
    setForm
  ] = useState({
    horasPatrulhamento: {
      habilitada: true,
      valor: 0
    },

    quantidadePatrulhas: {
      habilitada: true,
      valor: 0
    },

    quantidadeAvaliacoes: {
      habilitada: true,
      valor: 0
    },

    mediaMinimaAvaliacoes: {
      habilitada: true,
      valor: 0
    },

    quantidadeQuestionarios: {
      habilitada: true,
      valor: 0
    },

    aproveitamentoQuestionarios: {
      habilitada: true,
      valor: 0
    },

    ausenciasInjustificadas: {
      habilitada: true,
      maximo: 0
    },

    observacoes: ""
  });

  /* =======================================================
     CARREGAR TODOS
  ======================================================= */

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
          Array.isArray(
            res.data
          )
            ? res.data
            : []
        );

      } catch (err) {
        console.error(
          "Erro ao carregar metas ROCAM:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível carregar os Estagiários ROCAM."
        );

      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (
      contexto?.podeGerenciar
    ) {
      carregar();
    }
  }, [
    contexto?.podeGerenciar
  ]);

  /* =======================================================
     NORMALIZAR LISTA
  ======================================================= */

  const dados =
    useMemo(() => {
      return estagiarios.map(
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

          const percentual =
            calcularPercentual({
              metas,
              progresso
            });

          const horas =
            valorProgresso(
              progresso,
              [
                "horasCumpridas",
                "horasPatrulhamento"
              ]
            );

          const metaHoras =
            valorMeta(
              metas,
              "horasPatrulhamento"
            );

          const patrulhas =
            valorProgresso(
              progresso,
              [
                "patrulhasRealizadas",
                "quantidadePatrulhas"
              ]
            );

          const metaPatrulhas =
            valorMeta(
              metas,
              "quantidadePatrulhas"
            );

          const avaliacoes =
            valorProgresso(
              progresso,
              [
                "avaliacoesRealizadas",
                "quantidadeAvaliacoes"
              ]
            );

          const metaAvaliacoes =
            valorMeta(
              metas,
              "quantidadeAvaliacoes"
            );

          const media =
            valorProgresso(
              progresso,
              [
                "mediaAvaliacoes",
                "mediaAvaliacao"
              ]
            );

          const questionarios =
            valorProgresso(
              progresso,
              [
                "questionariosConcluidos",
                "quantidadeQuestionarios"
              ]
            );

          const metaQuestionarios =
            valorMeta(
              metas,
              "quantidadeQuestionarios"
            );

          const status =
            item.statusEstagio ||
            stage.status ||
            "EM_ANDAMENTO";

          return {
            ...item,

            stage,
            metas,
            progresso,

            percentual,

            horas,
            metaHoras,

            patrulhas,
            metaPatrulhas,

            avaliacoes,
            metaAvaliacoes,

            media,

            questionarios,
            metaQuestionarios,

            status,

            situacao:
              statusTexto(
                status,
                percentual
              )
          };
        }
      );
    }, [
      estagiarios
    ]);

  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo =
    useMemo(() => {
      const total =
        dados.length;

      const aptos =
        dados.filter(
          (item) =>
            item.situacao ===
            "Apto"
        ).length;

      const aguardando =
        dados.filter(
          (item) =>
            item.situacao ===
            "Aguardando aprovação"
        ).length;

      const andamento =
        total -
        aptos -
        aguardando;

      const media =
        total
          ? dados.reduce(
              (
                soma,
                item
              ) =>
                soma +
                item.percentual,
              0
            ) / total
          : 0;

      return {
        total,
        aptos,
        aguardando,
        andamento,
        media
      };
    }, [
      dados
    ]);

  /* =======================================================
     FILTRO
  ======================================================= */

  const listaFiltrada =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      return dados
        .filter(
          (item) => {
            if (
              filtroStatus ===
              "TODOS"
            ) {
              return true;
            }

            if (
              filtroStatus ===
              "APTOS"
            ) {
              return (
                item.situacao ===
                "Apto"
              );
            }

            if (
              filtroStatus ===
              "AGUARDANDO"
            ) {
              return (
                item.situacao ===
                "Aguardando aprovação"
              );
            }

            return (
              item.situacao ===
              "Em andamento"
            );
          }
        )
        .filter(
          (item) => {
            if (!termo) {
              return true;
            }

            const texto =
              [
                item.nome,
                item.patente,
                item.funcional
              ]
                .join(" ")
                .toLowerCase();

            return texto.includes(
              termo
            );
          }
        )
        .sort(
          (a, b) =>
            b.percentual -
            a.percentual
        );
    }, [
      dados,
      busca,
      filtroStatus
    ]);

  /* =======================================================
     ABRIR EDIÇÃO
  ======================================================= */

  const abrirEdicao =
    (item) => {
      const metas =
        item.metas || {};

      setSelecionado(
        item
      );

      setForm({
        horasPatrulhamento: {
          habilitada:
            metaHabilitada(
              metas,
              "horasPatrulhamento"
            ),

          valor:
            valorMeta(
              metas,
              "horasPatrulhamento"
            )
        },

        quantidadePatrulhas: {
          habilitada:
            metaHabilitada(
              metas,
              "quantidadePatrulhas"
            ),

          valor:
            valorMeta(
              metas,
              "quantidadePatrulhas"
            )
        },

        quantidadeAvaliacoes: {
          habilitada:
            metaHabilitada(
              metas,
              "quantidadeAvaliacoes"
            ),

          valor:
            valorMeta(
              metas,
              "quantidadeAvaliacoes"
            )
        },

        mediaMinimaAvaliacoes: {
          habilitada:
            metaHabilitada(
              metas,
              "mediaMinimaAvaliacoes"
            ),

          valor:
            valorMeta(
              metas,
              "mediaMinimaAvaliacoes"
            )
        },

        quantidadeQuestionarios: {
          habilitada:
            metaHabilitada(
              metas,
              "quantidadeQuestionarios"
            ),

          valor:
            valorMeta(
              metas,
              "quantidadeQuestionarios"
            )
        },

        aproveitamentoQuestionarios: {
          habilitada:
            metaHabilitada(
              metas,
              "aproveitamentoQuestionarios"
            ),

          valor:
            valorMeta(
              metas,
              "aproveitamentoQuestionarios"
            )
        },

        ausenciasInjustificadas: {
          habilitada:
            metaHabilitada(
              metas,
              "ausenciasInjustificadas"
            ),

          maximo:
            valorMeta(
              metas,
              "ausenciasInjustificadas",
              "maximo"
            )
        },

        observacoes:
          item.stage
            ?.observacoes ||
          ""
      });

      setModalAberto(
        true
      );
    };

  /* =======================================================
     ALTERAR CAMPO
  ======================================================= */

  const alterarMeta = (
    chave,
    campo,
    valor
  ) => {
    setForm(
      (anterior) => ({
        ...anterior,

        [chave]: {
          ...anterior[chave],

          [campo]:
            valor
        }
      })
    );
  };

  /* =======================================================
     SALVAR METAS
  ======================================================= */

  const salvar =
    async () => {
      if (
        !selecionado?.user
      ) {
        return;
      }

      try {
        setSalvando(true);
        setErro("");
        setSucesso("");

        await api.patch(
          `/api/rocam/comando/estagiarios/${selecionado.user}/metas`,
          {
            metas: {
              horasPatrulhamento:
                form.horasPatrulhamento,

              quantidadePatrulhas:
                form.quantidadePatrulhas,

              quantidadeAvaliacoes:
                form.quantidadeAvaliacoes,

              mediaMinimaAvaliacoes:
                form.mediaMinimaAvaliacoes,

              quantidadeQuestionarios:
                form.quantidadeQuestionarios,

              aproveitamentoQuestionarios:
                form.aproveitamentoQuestionarios,

              ausenciasInjustificadas:
                form.ausenciasInjustificadas
            },

            observacoes:
              form.observacoes
          }
        );

        /*
          Recalcula depois da alteração.
        */
        try {
          await api.patch(
            `/api/rocam/comando/estagiarios/${selecionado.user}/recalcular`
          );
        } catch (
          recalculoError
        ) {
          console.warn(
            "Recalculo não concluído:",
            recalculoError
          );
        }

        setModalAberto(
          false
        );

        setSelecionado(
          null
        );

        setSucesso(
          "Metas atualizadas com sucesso."
        );

        await carregar();

      } catch (err) {
        console.error(
          "Erro ao atualizar metas:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível atualizar as metas."
        );

      } finally {
        setSalvando(false);
      }
    };

  /* =======================================================
     ACESSO
  ======================================================= */

  if (
    !contexto?.podeGerenciar
  ) {
    return (
      <div className="rocam-goals-page">

        <div className="rocam-goals-denied">
          Acesso restrito ao Comando ROCAM.
        </div>

      </div>
    );
  }

  /* =======================================================
     TELA
  ======================================================= */

  return (
    <div className="rocam-goals-page">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="rocam-goals-hero">

        <div>

          <span className="rocam-goals-kicker">
            COMANDO ROCAM • ESTÁGIOS
          </span>

          <h1>
            Metas do Estágio
          </h1>

          <p>
            Acompanhe em tempo real
            o progresso de todos os
            Estagiários ROCAM e ajuste
            metas individualmente.
          </p>

        </div>

        <div className="rocam-goals-logo">
          <img
            src="/rocam-logo.png"
            alt="ROCAM"
          />
        </div>

      </section>

      {/* ===================================================
          ALERTAS
      =================================================== */}

      {erro && (
        <div className="rocam-goals-alert error">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rocam-goals-alert success">
          {sucesso}
        </div>
      )}

      {/* ===================================================
          RESUMO
      =================================================== */}

      <section className="rocam-goals-summary">

        <article>
          <small>
            ESTAGIÁRIOS ATIVOS
          </small>

          <strong>
            {resumo.total}
          </strong>

          <span>
            em acompanhamento
          </span>
        </article>

        <article>
          <small>
            EM ANDAMENTO
          </small>

          <strong>
            {resumo.andamento}
          </strong>

          <span>
            ainda com metas pendentes
          </span>
        </article>

        <article className="ready">
          <small>
            APTOS
          </small>

          <strong>
            {resumo.aptos}
          </strong>

          <span>
            prontos para aprovação
          </span>
        </article>

        <article>
          <small>
            PROGRESSO MÉDIO
          </small>

          <strong>
            {Math.round(
              resumo.media
            )}
            %
          </strong>

          <span>
            média geral dos estágios
          </span>
        </article>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="rocam-goals-tools">

        <div className="rocam-goals-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            placeholder="Filtrar por nome, patente ou funcional..."
          />

        </div>

        <select
          value={filtroStatus}
          onChange={(e) =>
            setFiltroStatus(
              e.target.value
            )
          }
        >
          <option value="TODOS">
            Todos
          </option>

          <option value="ANDAMENTO">
            Em andamento
          </option>

          <option value="APTOS">
            Aptos
          </option>

          <option value="AGUARDANDO">
            Aguardando aprovação
          </option>
        </select>

        <button
          type="button"
          onClick={
            carregar
          }
          disabled={loading}
        >
          {loading
            ? "Atualizando..."
            : "Atualizar"}
        </button>

      </section>

      {/* ===================================================
          LISTA
      =================================================== */}

      <section className="rocam-goals-section">

        <div className="rocam-goals-section-title">

          <div>
            <small>
              VISÃO GERAL
            </small>

            <h2>
              Acompanhamento dos Estagiários
            </h2>
          </div>

          <strong>
            {listaFiltrada.length}
          </strong>

        </div>

        {loading ? (
          <div className="rocam-goals-empty">
            Carregando metas...
          </div>

        ) : listaFiltrada.length ===
          0 ? (
          <div className="rocam-goals-empty">
            Nenhum Estagiário ROCAM encontrado.
          </div>

        ) : (
          <div className="rocam-goals-table-wrap">

            <table className="rocam-goals-table">

              <thead>
                <tr>
                  <th>
                    Estagiário
                  </th>

                  <th>
                    Horas
                  </th>

                  <th>
                    Patrulhas
                  </th>

                  <th>
                    Avaliações
                  </th>

                  <th>
                    Média
                  </th>

                  <th>
                    Questionários
                  </th>

                  <th>
                    Progresso
                  </th>

                  <th>
                    Situação
                  </th>

                  <th>
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>

                {listaFiltrada.map(
                  (item) => (
                    <tr
                      key={
                        item._id ||
                        item.user
                      }
                    >

                      <td>
                        <div className="rocam-goals-person">

                          <div className="rocam-goals-avatar">
                            {iniciais(
                              item.nome
                            )}
                          </div>

                          <div>
                            <strong>
                              {item.patente
                                ? `${item.patente} `
                                : ""}
                              {item.nome}
                            </strong>

                            <small>
                              Funcional{" "}
                              {item.funcional}
                            </small>
                          </div>

                        </div>
                      </td>

                      <td>
                        <strong>
                          {formatarNumero(
                            item.horas
                          )}
                          h
                        </strong>

                        <small>
                          /{" "}
                          {formatarNumero(
                            item.metaHoras
                          )}
                          h
                        </small>
                      </td>

                      <td>
                        <strong>
                          {item.patrulhas}
                        </strong>

                        <small>
                          /{" "}
                          {item.metaPatrulhas}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {item.avaliacoes}
                        </strong>

                        <small>
                          /{" "}
                          {item.metaAvaliacoes}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {formatarNumero(
                            item.media
                          )}
                          %
                        </strong>
                      </td>

                      <td>
                        <strong>
                          {item.questionarios}
                        </strong>

                        <small>
                          /{" "}
                          {item.metaQuestionarios}
                        </small>
                      </td>

                      <td>
                        <div className="rocam-goals-progress-cell">

                          <div className="rocam-goals-progress-top">
                            <strong>
                              {Math.round(
                                item.percentual
                              )}
                              %
                            </strong>
                          </div>

                          <div className="rocam-goals-progress-track">
                            <span
                              style={{
                                width:
                                  `${item.percentual}%`
                              }}
                            />
                          </div>

                        </div>
                      </td>

                      <td>
                        <span
                          className={`rocam-goals-status ${
                            item.situacao ===
                            "Apto"
                              ? "ready"
                              : item.situacao ===
                                "Aguardando aprovação"
                              ? "waiting"
                              : ""
                          }`}
                        >
                          {item.situacao}
                        </span>
                      </td>

                      <td>
                        <div className="rocam-goals-actions">

                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/rocam/estagiarios/${item.user}`
                              )
                            }
                          >
                            Ficha
                          </button>

                          <button
                            type="button"
                            className="edit"
                            onClick={() =>
                              abrirEdicao(
                                item
                              )
                            }
                          >
                            Editar metas
                          </button>

                        </div>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* ===================================================
          MODAL DE METAS
      =================================================== */}

      {modalAberto &&
        selecionado && (
          <div
            className="rocam-goals-modal-overlay"
            onClick={() =>
              !salvando &&
              setModalAberto(
                false
              )
            }
          >

            <div
              className="rocam-goals-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="rocam-goals-modal-header">

                <div>
                  <small>
                    AJUSTE INDIVIDUAL
                  </small>

                  <h2>
                    Metas do Estágio
                  </h2>

                  <p>
                    {selecionado.patente
                      ? `${selecionado.patente} `
                      : ""}
                    {selecionado.nome}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setModalAberto(
                      false
                    )
                  }
                  disabled={
                    salvando
                  }
                >
                  ×
                </button>

              </div>

              <div className="rocam-goals-form-grid">

                {/* HORAS */}

                <div className="rocam-goals-field">

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        form
                          .horasPatrulhamento
                          .habilitada
                      }
                      onChange={(e) =>
                        alterarMeta(
                          "horasPatrulhamento",
                          "habilitada",
                          e.target.checked
                        )
                      }
                    />

                    Horas de patrulhamento
                  </label>

                  <input
                    type="number"
                    min="0"
                    disabled={
                      !form
                        .horasPatrulhamento
                        .habilitada
                    }
                    value={
                      form
                        .horasPatrulhamento
                        .valor
                    }
                    onChange={(e) =>
                      alterarMeta(
                        "horasPatrulhamento",
                        "valor",
                        numero(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

                {/* PATRULHAS */}

                <div className="rocam-goals-field">

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        form
                          .quantidadePatrulhas
                          .habilitada
                      }
                      onChange={(e) =>
                        alterarMeta(
                          "quantidadePatrulhas",
                          "habilitada",
                          e.target.checked
                        )
                      }
                    />

                    Quantidade de patrulhas
                  </label>

                  <input
                    type="number"
                    min="0"
                    disabled={
                      !form
                        .quantidadePatrulhas
                        .habilitada
                    }
                    value={
                      form
                        .quantidadePatrulhas
                        .valor
                    }
                    onChange={(e) =>
                      alterarMeta(
                        "quantidadePatrulhas",
                        "valor",
                        numero(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

                {/* AVALIAÇÕES */}

                <div className="rocam-goals-field">

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        form
                          .quantidadeAvaliacoes
                          .habilitada
                      }
                      onChange={(e) =>
                        alterarMeta(
                          "quantidadeAvaliacoes",
                          "habilitada",
                          e.target.checked
                        )
                      }
                    />

                    Quantidade de avaliações
                  </label>

                  <input
                    type="number"
                    min="0"
                    disabled={
                      !form
                        .quantidadeAvaliacoes
                        .habilitada
                    }
                    value={
                      form
                        .quantidadeAvaliacoes
                        .valor
                    }
                    onChange={(e) =>
                      alterarMeta(
                        "quantidadeAvaliacoes",
                        "valor",
                        numero(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

                {/* MÉDIA */}

                <div className="rocam-goals-field">

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        form
                          .mediaMinimaAvaliacoes
                          .habilitada
                      }
                      onChange={(e) =>
                        alterarMeta(
                          "mediaMinimaAvaliacoes",
                          "habilitada",
                          e.target.checked
                        )
                      }
                    />

                    Média mínima avaliações
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={
                      !form
                        .mediaMinimaAvaliacoes
                        .habilitada
                    }
                    value={
                      form
                        .mediaMinimaAvaliacoes
                        .valor
                    }
                    onChange={(e) =>
                      alterarMeta(
                        "mediaMinimaAvaliacoes",
                        "valor",
                        numero(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

                {/* QUESTIONÁRIOS */}

                <div className="rocam-goals-field">

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        form
                          .quantidadeQuestionarios
                          .habilitada
                      }
                      onChange={(e) =>
                        alterarMeta(
                          "quantidadeQuestionarios",
                          "habilitada",
                          e.target.checked
                        )
                      }
                    />

                    Quantidade de questionários
                  </label>

                  <input
                    type="number"
                    min="0"
                    disabled={
                      !form
                        .quantidadeQuestionarios
                        .habilitada
                    }
                    value={
                      form
                        .quantidadeQuestionarios
                        .valor
                    }
                    onChange={(e) =>
                      alterarMeta(
                        "quantidadeQuestionarios",
                        "valor",
                        numero(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

                {/* APROVEITAMENTO */}

                <div className="rocam-goals-field">

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        form
                          .aproveitamentoQuestionarios
                          .habilitada
                      }
                      onChange={(e) =>
                        alterarMeta(
                          "aproveitamentoQuestionarios",
                          "habilitada",
                          e.target.checked
                        )
                      }
                    />

                    Aproveitamento questionários
                  </label>

                  <input
                    type="number"
                    min="0"
                    max="100"
                    disabled={
                      !form
                        .aproveitamentoQuestionarios
                        .habilitada
                    }
                    value={
                      form
                        .aproveitamentoQuestionarios
                        .valor
                    }
                    onChange={(e) =>
                      alterarMeta(
                        "aproveitamentoQuestionarios",
                        "valor",
                        numero(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

                {/* AUSÊNCIAS */}

                <div className="rocam-goals-field">

                  <label>
                    <input
                      type="checkbox"
                      checked={
                        form
                          .ausenciasInjustificadas
                          .habilitada
                      }
                      onChange={(e) =>
                        alterarMeta(
                          "ausenciasInjustificadas",
                          "habilitada",
                          e.target.checked
                        )
                      }
                    />

                    Máximo de ausências injustificadas
                  </label>

                  <input
                    type="number"
                    min="0"
                    disabled={
                      !form
                        .ausenciasInjustificadas
                        .habilitada
                    }
                    value={
                      form
                        .ausenciasInjustificadas
                        .maximo
                    }
                    onChange={(e) =>
                      alterarMeta(
                        "ausenciasInjustificadas",
                        "maximo",
                        numero(
                          e.target.value
                        )
                      )
                    }
                  />

                </div>

              </div>

              <div className="rocam-goals-observation">

                <label>
                  Observações da alteração
                </label>

                <textarea
                  rows="4"
                  value={
                    form.observacoes
                  }
                  onChange={(e) =>
                    setForm(
                      (anterior) => ({
                        ...anterior,

                        observacoes:
                          e.target.value
                      })
                    )
                  }
                  placeholder="Informe uma observação, se necessário..."
                />

              </div>

              <div className="rocam-goals-modal-actions">

                <button
                  type="button"
                  className="cancel"
                  onClick={() =>
                    setModalAberto(
                      false
                    )
                  }
                  disabled={
                    salvando
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="save"
                  onClick={
                    salvar
                  }
                  disabled={
                    salvando
                  }
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar metas"}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}