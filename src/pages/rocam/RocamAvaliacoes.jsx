import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useOutletContext
} from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-avaliacoes.css";

const formatarDataHora = (
  data
) => {
  if (!data) return "-";

  const valor =
    new Date(data);

  if (
    Number.isNaN(
      valor.getTime()
    )
  ) {
    return "-";
  }

  return valor.toLocaleString(
    "pt-BR"
  );
};

const statusLabel = (
  status
) => {
  switch (status) {
    case "PENDENTE_COMANDO":
      return "Pendente";

    case "VALIDADA":
      return "Validada";

    case "DEVOLVIDA":
      return "Devolvida";

    default:
      return status || "-";
  }
};

export default function RocamAvaliacoes() {
  const {
    contexto
  } =
    useOutletContext();

  const [
    avaliacoes,
    setAvaliacoes
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    filtro,
    setFiltro
  ] = useState(
    "PENDENTE_COMANDO"
  );

  const [
    busca,
    setBusca
  ] = useState("");

  const [
    selecionada,
    setSelecionada
  ] = useState(null);

  const [
    comentario,
    setComentario
  ] = useState("");

  const [
    processando,
    setProcessando
  ] = useState(false);

  const [
    erro,
    setErro
  ] = useState("");

  const [
    sucesso,
    setSucesso
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
            `/api/rocam/comando/avaliacoes?status=${encodeURIComponent(
              filtro
            )}`
          );

        setAvaliacoes(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(
          "Erro ao carregar avaliações:",
          err
        );

        setErro(
          err.response?.data?.message ||
            "Não foi possível carregar as avaliações ROCAM."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    carregar();
  }, [filtro]);

  /* =========================================================
     FILTRAR LOCAL
  ========================================================= */

  const lista =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return avaliacoes;
      }

      return avaliacoes.filter(
        (item) =>
          String(
            item.nomeEstagiario ||
              ""
          )
            .toLowerCase()
            .includes(termo) ||
          String(
            item.funcionalEstagiario ||
              ""
          ).includes(termo) ||
          String(
            item.nomeAvaliador ||
              ""
          )
            .toLowerCase()
            .includes(termo)
      );
    }, [
      avaliacoes,
      busca
    ]);

  /* =========================================================
     RESUMO
  ========================================================= */

  const resumo =
    useMemo(() => {
      const total =
        avaliacoes.length;

      const pendentes =
        avaliacoes.filter(
          (item) =>
            item.status ===
            "PENDENTE_COMANDO"
        ).length;

      const validadas =
        avaliacoes.filter(
          (item) =>
            item.status ===
            "VALIDADA"
        ).length;

      const devolvidas =
        avaliacoes.filter(
          (item) =>
            item.status ===
            "DEVOLVIDA"
        ).length;

      return {
        total,
        pendentes,
        validadas,
        devolvidas
      };
    }, [avaliacoes]);

  /* =========================================================
     VALIDAR
  ========================================================= */

  const validar =
    async () => {
      if (!selecionada) {
        return;
      }

      try {
        setProcessando(true);
        setErro("");
        setSucesso("");

        await api.patch(
          `/api/rocam/comando/avaliacoes/${selecionada._id}/validar`,
          {
            comentarioComando:
              comentario
          }
        );

        setSucesso(
          "Avaliação validada com sucesso."
        );

        setSelecionada(null);
        setComentario("");

        await carregar();
      } catch (err) {
        console.error(
          "Erro ao validar:",
          err
        );

        setErro(
          err.response?.data?.message ||
            "Não foi possível validar a avaliação."
        );
      } finally {
        setProcessando(false);
      }
    };

  /* =========================================================
     DEVOLVER
  ========================================================= */

  const devolver =
    async () => {
      if (!selecionada) {
        return;
      }

      if (
        !comentario.trim()
      ) {
        setErro(
          "Informe o motivo da devolução no comentário do Comando."
        );

        return;
      }

      try {
        setProcessando(true);
        setErro("");
        setSucesso("");

        await api.patch(
          `/api/rocam/comando/avaliacoes/${selecionada._id}/devolver`,
          {
            comentarioComando:
              comentario.trim()
          }
        );

        setSucesso(
          "Avaliação devolvida ao Braçal ROCAM."
        );

        setSelecionada(null);
        setComentario("");

        await carregar();
      } catch (err) {
        console.error(
          "Erro ao devolver:",
          err
        );

        setErro(
          err.response?.data?.message ||
            "Não foi possível devolver a avaliação."
        );
      } finally {
        setProcessando(false);
      }
    };

  /* =========================================================
     SEGURANÇA VISUAL
  ========================================================= */

  if (
    !contexto?.podeGerenciar
  ) {
    return (
      <div className="rocam-reviews-page">

        <section className="rocam-reviews-denied">
          <span>
            ACESSO RESTRITO
          </span>

          <h1>
            Avaliações ROCAM
          </h1>

          <p>
            Essa área é exclusiva
            do Comando ROCAM,
            Subcomando ROCAM,
            Comando do Batalhão
            e Superadmin.
          </p>
        </section>

      </div>
    );
  }

  return (
    <div className="rocam-reviews-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="rocam-reviews-hero">

        <div>
          <span className="rocam-reviews-kicker">
            COMANDO ROCAM
          </span>

          <h1>
            Avaliações
          </h1>

          <p>
            Analise as avaliações
            realizadas pelos Braçais
            ROCAM antes de incorporá-las
            ao progresso oficial do
            estágio.
          </p>
        </div>

        <div className="rocam-reviews-hero-icon">
          <img
            src="/rocam-logo.png"
            alt="ROCAM"
          />
        </div>

      </section>

      {/* =====================================================
          ALERTAS
      ===================================================== */}

      {erro && (
        <div className="rocam-reviews-alert error">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rocam-reviews-alert success">
          {sucesso}
        </div>
      )}

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <section className="rocam-reviews-summary">

        <div>
          <small>
            TOTAL
          </small>

          <strong>
            {resumo.total}
          </strong>
        </div>

        <div className="pending">
          <small>
            PENDENTES
          </small>

          <strong>
            {resumo.pendentes}
          </strong>
        </div>

        <div className="success">
          <small>
            VALIDADAS
          </small>

          <strong>
            {resumo.validadas}
          </strong>
        </div>

        <div className="danger">
          <small>
            DEVOLVIDAS
          </small>

          <strong>
            {resumo.devolvidas}
          </strong>
        </div>

      </section>

      {/* =====================================================
          FILTROS
      ===================================================== */}

      <section className="rocam-reviews-toolbar">

        <div className="rocam-reviews-search">

          <label>
            Localizar avaliação
          </label>

          <input
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            placeholder="Estagiário, funcional ou avaliador"
          />

        </div>

        <div className="rocam-reviews-filter">

          <label>
            Situação
          </label>

          <select
            value={filtro}
            onChange={(e) =>
              setFiltro(
                e.target.value
              )
            }
          >
            <option value="PENDENTE_COMANDO">
              Pendentes
            </option>

            <option value="VALIDADA">
              Validadas
            </option>

            <option value="DEVOLVIDA">
              Devolvidas
            </option>

            <option value="TODAS">
              Todas
            </option>
          </select>

        </div>

      </section>

      {/* =====================================================
          LISTA
      ===================================================== */}

      {loading ? (

        <div className="rocam-reviews-empty">
          Carregando avaliações...
        </div>

      ) : lista.length === 0 ? (

        <div className="rocam-reviews-empty">

          <strong>
            Nenhuma avaliação
          </strong>

          <span>
            Não existem avaliações
            correspondentes ao filtro.
          </span>

        </div>

      ) : (

        <section className="rocam-reviews-grid">

          {lista.map(
            (item) => (
              <article
                key={item._id}
                className={`rocam-review-card ${
                  item.status
                    ?.toLowerCase()
                    .replace(
                      "_comando",
                      ""
                    )
                }`}
              >

                <div className="rocam-review-head">

                  <div>
                    <small>
                      {item.patenteEstagiario ||
                        "ESTAGIÁRIO ROCAM"}
                    </small>

                    <h2>
                      {item.nomeEstagiario}
                    </h2>

                    <span>
                      Funcional{" "}
                      {item.funcionalEstagiario}
                    </span>
                  </div>

                  <div className="rocam-review-note">

                    <small>
                      NOTA
                    </small>

                    <strong>
                      {Number(
                        item.notaPercentual ||
                          0
                      ).toFixed(0)}
                      %
                    </strong>

                  </div>

                </div>

                <div className="rocam-review-meta">

                  <span>
                    Avaliador:{" "}
                    <strong>
                      {item.nomeAvaliador ||
                        "-"}
                    </strong>
                  </span>

                  <span>
                    {formatarDataHora(
                      item.dataAvaliacao ||
                        item.createdAt
                    )}
                  </span>

                  <span
                    className={`status ${item.status}`}
                  >
                    {statusLabel(
                      item.status
                    )}
                  </span>

                </div>

                <div className="rocam-review-criteria">

                  {(item.criterios || []).map(
                    (
                      criterio,
                      index
                    ) => (
                      <div
                        key={
                          `${criterio.codigo}-${index}`
                        }
                        className={
                          criterio.resposta ===
                          "ATENDE"
                            ? "ok"
                            : "fail"
                        }
                      >

                        <span>
                          {criterio.resposta ===
                          "ATENDE"
                            ? "✓"
                            : "×"}
                        </span>

                        <strong>
                          {criterio.label}
                        </strong>

                      </div>
                    )
                  )}

                </div>

                {item.comentarioBracal && (
                  <div className="rocam-review-comment">
                    <small>
                      COMENTÁRIO DO BRAÇAL
                    </small>

                    <p>
                      {item.comentarioBracal}
                    </p>
                  </div>
                )}

                {item.comentarioComando && (
                  <div className="rocam-review-command-comment">
                    <small>
                      COMENTÁRIO DO COMANDO
                    </small>

                    <p>
                      {item.comentarioComando}
                    </p>
                  </div>
                )}

                <div className="rocam-review-footer">

                  <span>
                    {item.totalAtende || 0}
                    {" atende • "}
                    {item.totalNaoAtende || 0}
                    {" não atende"}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelecionada(
                        item
                      );

                      setComentario(
                        item.comentarioComando ||
                          ""
                      );
                    }}
                  >
                    Abrir análise
                  </button>

                </div>

              </article>
            )
          )}

        </section>

      )}

      {/* =====================================================
          MODAL / ANÁLISE
      ===================================================== */}

      {selecionada && (
        <div
          className="rocam-review-modal-backdrop"
          onClick={() =>
            !processando &&
            setSelecionada(null)
          }
        >

          <div
            className="rocam-review-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="rocam-review-modal-header">

              <div>
                <small>
                  ANÁLISE DO COMANDO ROCAM
                </small>

                <h2>
                  {selecionada.nomeEstagiario}
                </h2>

                <span>
                  Avaliação realizada por{" "}
                  {selecionada.nomeAvaliador}
                </span>
              </div>

              <strong>
                {Number(
                  selecionada.notaPercentual ||
                    0
                ).toFixed(0)}
                %
              </strong>

            </div>

            <div className="rocam-review-modal-criteria">

              {(selecionada.criterios || []).map(
                (
                  criterio,
                  index
                ) => (
                  <div
                    key={
                      `${criterio.codigo}-${index}`
                    }
                    className={
                      criterio.resposta ===
                      "ATENDE"
                        ? "ok"
                        : "fail"
                    }
                  >

                    <span>
                      {criterio.resposta ===
                      "ATENDE"
                        ? "✓"
                        : "×"}
                    </span>

                    <div>
                      <strong>
                        {criterio.label}
                      </strong>

                      <small>
                        {criterio.resposta ===
                        "ATENDE"
                          ? "Atende"
                          : "Não atende"}
                      </small>

                      {criterio.comentario && (
                        <p>
                          {criterio.comentario}
                        </p>
                      )}
                    </div>

                  </div>
                )
              )}

            </div>

            {selecionada.comentarioBracal && (
              <div className="rocam-review-modal-bracal">

                <small>
                  OBSERVAÇÃO DO BRAÇAL
                </small>

                <p>
                  {selecionada.comentarioBracal}
                </p>

              </div>
            )}

            <div className="rocam-review-modal-field">

              <label>
                Comentário do Comando
              </label>

              <textarea
                rows="5"
                value={comentario}
                onChange={(e) =>
                  setComentario(
                    e.target.value
                  )
                }
                placeholder="Registre observações da análise..."
              />

            </div>

            <div className="rocam-review-modal-actions">

              <button
                type="button"
                className="cancel"
                onClick={() =>
                  setSelecionada(null)
                }
                disabled={processando}
              >
                Fechar
              </button>

              {selecionada.status ===
                "PENDENTE_COMANDO" && (
                <>

                  <button
                    type="button"
                    className="return"
                    onClick={devolver}
                    disabled={processando}
                  >
                    {processando
                      ? "Processando..."
                      : "Devolver ao Braçal"}
                  </button>

                  <button
                    type="button"
                    className="validate"
                    onClick={validar}
                    disabled={processando}
                  >
                    {processando
                      ? "Processando..."
                      : "Validar Avaliação"}
                  </button>

                </>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}