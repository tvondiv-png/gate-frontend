import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-avaliar-estagiario.css";

const formatarData = (data) => {
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

  return valor.toLocaleDateString(
    "pt-BR"
  );
};

export default function RocamAvaliarEstagiario() {
  const navigate =
    useNavigate();

  const [
    estagiarios,
    setEstagiarios
  ] = useState([]);

  const [
    selecionado,
    setSelecionado
  ] = useState(null);

  const [
    criterios,
    setCriterios
  ] = useState([]);

  const [
    comentario,
    setComentario
  ] = useState("");

  const [
    busca,
    setBusca
  ] = useState("");

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    carregandoFicha,
    setCarregandoFicha
  ] = useState(false);

  const [
    enviando,
    setEnviando
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
     LISTAR ESTAGIÁRIOS
  ========================================================= */

  const carregarEstagiarios =
    async () => {
      try {
        setLoading(true);
        setErro("");

        const res =
          await api.get(
            "/api/rocam/avaliacoes/estagiarios"
          );

        setEstagiarios(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(
          "Erro ao carregar estagiários:",
          err
        );

        setErro(
          err.response?.data?.message ||
            "Não foi possível carregar os estagiários."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    carregarEstagiarios();
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
        (item) =>
          String(
            item.nome || ""
          )
            .toLowerCase()
            .includes(termo) ||
          String(
            item.funcional || ""
          ).includes(termo) ||
          String(
            item.patente || ""
          )
            .toLowerCase()
            .includes(termo)
      );
    }, [
      estagiarios,
      busca
    ]);

  /* =========================================================
     ABRIR AVALIAÇÃO
  ========================================================= */

  const abrirAvaliacao =
    async (item) => {
      try {
        setCarregandoFicha(true);
        setErro("");
        setSucesso("");

        const res =
          await api.get(
            `/api/rocam/avaliacoes/estagiarios/${item.user}`
          );

        const dados =
          res.data;

        setSelecionado(
          dados
        );

        setCriterios(
          (
            dados.stage
              ?.criteriosAvaliacao ||
            []
          ).map(
            (criterio) => ({
              codigo:
                criterio.codigo,

              label:
                criterio.label,

              resposta: "",

              comentario: ""
            })
          )
        );

        setComentario("");
      } catch (err) {
        console.error(
          "Erro ao abrir avaliação:",
          err
        );

        setErro(
          err.response?.data?.message ||
            "Não foi possível abrir a avaliação."
        );
      } finally {
        setCarregandoFicha(false);
      }
    };

  /* =========================================================
     RESPONDER CRITÉRIO
  ========================================================= */

  const responder = (
    codigo,
    resposta
  ) => {
    setCriterios(
      (anteriores) =>
        anteriores.map(
          (item) =>
            item.codigo === codigo
              ? {
                  ...item,
                  resposta
                }
              : item
        )
    );
  };

  /* =========================================================
     NOTA EM TEMPO REAL
  ========================================================= */

  const resultado =
    useMemo(() => {
      const respondidos =
        criterios.filter(
          (item) =>
            item.resposta
        );

      const atende =
        respondidos.filter(
          (item) =>
            item.resposta ===
            "ATENDE"
        ).length;

      const naoAtende =
        respondidos.filter(
          (item) =>
            item.resposta ===
            "NAO_ATENDE"
        ).length;

      const nota =
        criterios.length > 0
          ? (
              atende /
              criterios.length
            ) *
            100
          : 0;

      return {
        respondidos:
          respondidos.length,

        atende,

        naoAtende,

        nota
      };
    }, [criterios]);

  /* =========================================================
     ENVIAR
  ========================================================= */

  const enviar =
    async () => {
      if (!selecionado) {
        return;
      }

      const faltando =
        criterios.some(
          (item) =>
            !item.resposta
        );

      if (faltando) {
        setErro(
          "Responda todos os critérios antes de enviar."
        );

        return;
      }

      try {
        setEnviando(true);
        setErro("");
        setSucesso("");

        await api.post(
          `/api/rocam/avaliacoes/estagiarios/${selecionado.profile.user}`,
          {
            criterios,

            comentarioBracal:
              comentario
          }
        );

        setSucesso(
          "Avaliação enviada ao Comando ROCAM."
        );

        setSelecionado(null);
        setCriterios([]);
        setComentario("");

        await carregarEstagiarios();
      } catch (err) {
        console.error(
          "Erro ao enviar avaliação:",
          err
        );

        setErro(
          err.response?.data?.message ||
            "Não foi possível enviar a avaliação."
        );
      } finally {
        setEnviando(false);
      }
    };

  return (
    <div className="rocam-evaluate-page">

      <section className="rocam-evaluate-hero">

        <div>
          <span>
            BRAÇAL ROCAM
          </span>

          <h1>
            Avaliar Estagiário
          </h1>

          <p>
            Avaliação prática do
            Estagiário ROCAM com base
            nos critérios definidos pelo
            Comando.
          </p>
        </div>

        <div className="rocam-evaluate-hero-mark">
          <img
            src="/rocam-logo.png"
            alt="ROCAM"
          />
        </div>

      </section>

      {erro && (
        <div className="rocam-evaluate-alert error">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rocam-evaluate-alert success">
          {sucesso}
        </div>
      )}

      {!selecionado ? (
        <>
          <section className="rocam-evaluate-toolbar">

            <div>
              <label>
                Localizar Estagiário
              </label>

              <input
                value={busca}
                onChange={(e) =>
                  setBusca(
                    e.target.value
                  )
                }
                placeholder="Nome, funcional ou patente"
              />
            </div>

          </section>

          {loading ? (
            <div className="rocam-evaluate-empty">
              Carregando estagiários...
            </div>
          ) : (
            <section className="rocam-evaluate-trainee-grid">

              {listaFiltrada.map(
                (item) => (
                  <article
                    key={
                      item.user
                    }
                    className="rocam-evaluate-trainee"
                  >

                    <div className="rocam-evaluate-avatar">
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

                    <small>
                      {item.patente ||
                        "Policial"}
                    </small>

                    <h2>
                      {item.nome}
                    </h2>

                    <p>
                      Funcional{" "}
                      {item.funcional}
                    </p>

                    <span>
                      Ingresso ROCAM:{" "}
                      {formatarData(
                        item.dataIngressoRocam
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        abrirAvaliacao(
                          item
                        )
                      }
                      disabled={
                        carregandoFicha
                      }
                    >
                      Iniciar avaliação
                    </button>

                  </article>
                )
              )}

            </section>
          )}
        </>
      ) : (
        <>

          <section className="rocam-evaluate-selected">

            <button
              type="button"
              className="rocam-evaluate-back"
              onClick={() => {
                setSelecionado(null);
                setCriterios([]);
              }}
            >
              ← Voltar
            </button>

            <div>

              <small>
                ESTAGIÁRIO ROCAM
              </small>

              <h2>
                {selecionado
                  .profile
                  .patente || ""}{" "}
                {selecionado
                  .profile
                  .nome}
              </h2>

              <span>
                Funcional{" "}
                {selecionado
                  .profile
                  .funcional}
              </span>

            </div>

            <div className="rocam-evaluate-score">

              <small>
                NOTA PARCIAL
              </small>

              <strong>
                {resultado.nota.toFixed(
                  0
                )}
                %
              </strong>

            </div>

          </section>

          <section className="rocam-evaluate-criteria">

            {criterios.map(
              (
                criterio,
                index
              ) => (
                <article
                  key={
                    criterio.codigo
                  }
                  className={`rocam-evaluate-criterion ${
                    criterio.resposta ===
                    "ATENDE"
                      ? "ok"
                      : criterio.resposta ===
                        "NAO_ATENDE"
                      ? "fail"
                      : ""
                  }`}
                >

                  <div className="rocam-evaluate-criterion-number">
                    {String(
                      index + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>

                  <div className="rocam-evaluate-criterion-main">

                    <strong>
                      {criterio.label}
                    </strong>

                    <span>
                      Selecione o resultado
                      observado durante o
                      serviço.
                    </span>

                  </div>

                  <div className="rocam-evaluate-answers">

                    <button
                      type="button"
                      className={
                        criterio.resposta ===
                        "ATENDE"
                          ? "selected"
                          : ""
                      }
                      onClick={() =>
                        responder(
                          criterio.codigo,
                          "ATENDE"
                        )
                      }
                    >
                      ✓ Atende
                    </button>

                    <button
                      type="button"
                      className={`negative ${
                        criterio.resposta ===
                        "NAO_ATENDE"
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        responder(
                          criterio.codigo,
                          "NAO_ATENDE"
                        )
                      }
                    >
                      × Não atende
                    </button>

                  </div>

                </article>
              )
            )}

          </section>

          <section className="rocam-evaluate-summary">

            <div className="rocam-evaluate-numbers">

              <div>
                <small>
                  RESPONDIDOS
                </small>

                <strong>
                  {
                    resultado.respondidos
                  }
                  /
                  {criterios.length}
                </strong>
              </div>

              <div className="positive">
                <small>
                  ATENDE
                </small>

                <strong>
                  {resultado.atende}
                </strong>
              </div>

              <div className="negative">
                <small>
                  NÃO ATENDE
                </small>

                <strong>
                  {
                    resultado.naoAtende
                  }
                </strong>
              </div>

              <div>
                <small>
                  NOTA
                </small>

                <strong>
                  {resultado.nota.toFixed(
                    0
                  )}
                  %
                </strong>
              </div>

            </div>

            <div className="rocam-evaluate-comment">

              <label>
                Comentário do Braçal
              </label>

              <textarea
                rows="5"
                value={comentario}
                onChange={(e) =>
                  setComentario(
                    e.target.value
                  )
                }
                placeholder="Observações da avaliação..."
              />

            </div>

            <div className="rocam-evaluate-actions">

              <span>
                A avaliação será enviada
                ao Comando ROCAM para
                análise.
              </span>

              <button
                type="button"
                onClick={enviar}
                disabled={
                  enviando ||
                  resultado.respondidos !==
                    criterios.length
                }
              >
                {enviando
                  ? "Enviando..."
                  : "Enviar avaliação"}
              </button>

            </div>

          </section>

        </>
      )}

    </div>
  );
}