import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useOutletContext
} from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-bracais.css";

/* =========================================================
   ORDEM DAS PATENTES
========================================================= */

const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

/* =========================================================
   HELPERS
========================================================= */

const formatarData = (data) => {
  if (!data) {
    return "-";
  }

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

const hojeInput = () => {
  const agora =
    new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      agora.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${ano}-${mes}-${dia}`;
};

const iniciaisNome = (nome) => {
  return String(
    nome || "R"
  )
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) =>
      parte
        .charAt(0)
        .toUpperCase()
    )
    .join("");
};

/* =========================================================
   PÁGINA
========================================================= */

export default function RocamBracais() {
  const {
    contexto
  } =
    useOutletContext();

  /* =======================================================
     DADOS
  ======================================================= */

  const [
    bracais,
    setBracais
  ] = useState([]);

  const [
    elegiveis,
    setElegiveis
  ] = useState([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    salvando,
    setSalvando
  ] = useState(false);

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

  /* =======================================================
     MODAL
  ======================================================= */

  const [
    modalAberto,
    setModalAberto
  ] = useState(false);

  const [
    userId,
    setUserId
  ] = useState("");

  const [
    dataIngresso,
    setDataIngresso
  ] = useState(
    hojeInput()
  );

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar = async () => {
    try {
      setLoading(true);
      setErro("");

      const [
        resBracais,
        resElegiveis
      ] =
        await Promise.all([
          api.get(
            "/api/rocam/comando/bracais"
          ),

          api.get(
            "/api/rocam/comando/elegiveis"
          )
        ]);

      setBracais(
        Array.isArray(
          resBracais.data
        )
          ? resBracais.data
          : []
      );

      setElegiveis(
        Array.isArray(
          resElegiveis.data
        )
          ? resElegiveis.data
          : []
      );

    } catch (err) {
      console.error(
        "Erro ao carregar Braçais ROCAM:",
        err
      );

      setErro(
        err.response?.data
          ?.message ||
          "Não foi possível carregar os Braçais ROCAM."
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
     FILTRO DA LISTA DE BRAÇAIS
  ======================================================= */

  const listaFiltrada =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return bracais;
      }

      return bracais.filter(
        (item) => {
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
      );
    }, [
      bracais,
      busca
    ]);

  /* =======================================================
     POLICIAIS DISPONÍVEIS

     ORDEM:
     1. PATENTE
     2. NOME

     O backend já retira quem possui
     vínculo ROCAM ativo.
  ======================================================= */

  const policiaisDisponiveis =
    useMemo(() => {
      return [...elegiveis]
        .filter(
          (item) =>
            item?.user ||
            item?._id
        )
        .sort((a, b) => {
          const ordemA =
            ORDEM_PATENTES[
              a.patente
            ] || 999;

          const ordemB =
            ORDEM_PATENTES[
              b.patente
            ] || 999;

          if (
            ordemA !== ordemB
          ) {
            return (
              ordemA -
              ordemB
            );
          }

          return String(
            a.nome || ""
          ).localeCompare(
            String(
              b.nome || ""
            ),
            "pt-BR"
          );
        });
    }, [
      elegiveis
    ]);

  /* =======================================================
     ABRIR MODAL
  ======================================================= */

  const abrirModal = () => {
    setErro("");
    setSucesso("");

    setUserId("");

    setDataIngresso(
      hojeInput()
    );

    setModalAberto(
      true
    );
  };

  /* =======================================================
     FECHAR MODAL
  ======================================================= */

  const fecharModal = () => {
    if (salvando) {
      return;
    }

    setModalAberto(
      false
    );

    setUserId("");

    setDataIngresso(
      hojeInput()
    );
  };

  /* =======================================================
     DESIGNAR BRAÇAL DIRETAMENTE

     NÃO:
     - cria estágio;
     - cria metas;
     - exige avaliações.

     SIM:
     - cria/ativa RocamProfile;
     - papelRocam = BRACAL_ROCAM;
     - atualiza Hierarchy.qualificacaoRocam.
  ======================================================= */

  const designarBracal =
    async () => {
      if (!userId) {
        setErro(
          "Selecione o policial."
        );

        return;
      }

      if (!dataIngresso) {
        setErro(
          "Informe a data de ingresso na ROCAM."
        );

        return;
      }

      try {
        setSalvando(true);

        setErro("");
        setSucesso("");

        await api.post(
          "/api/rocam/comando/designar",
          {
            userId,

            papelRocam:
              "BRACAL_ROCAM",

            dataIngresso
          }
        );

        setModalAberto(
          false
        );

        setUserId("");

        setDataIngresso(
          hojeInput()
        );

        setSucesso(
          "Braçal ROCAM designado com sucesso."
        );

        await carregar();

      } catch (err) {
        console.error(
          "Erro ao designar Braçal ROCAM:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível designar o Braçal ROCAM."
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
      <div className="rocam-bracais-page">

        <section className="rocam-bracais-denied">

          <span>
            ACESSO RESTRITO
          </span>

          <h1>
            Braçais ROCAM
          </h1>

          <p>
            Esta página é exclusiva
            para o Comando ROCAM,
            Comando do Batalhão e
            Superadministração.
          </p>

        </section>

      </div>
    );
  }

  /* =======================================================
     TELA
  ======================================================= */

  return (
    <div className="rocam-bracais-page">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="rocam-bracais-hero">

        <div>

          <span className="rocam-bracais-kicker">
            COMANDO ROCAM • EFETIVO
          </span>

          <h1>
            Braçais ROCAM
          </h1>

          <p>
            Consulte o efetivo de
            Braçais ROCAM e realize
            designações diretas de
            policiais que já possuem
            a qualificação, sem
            necessidade de estágio.
          </p>

        </div>

        <div className="rocam-bracais-hero-actions">

          <div className="rocam-bracais-total">

            <small>
              BRAÇAIS ATIVOS
            </small>

            <strong>
              {bracais.length}
            </strong>

          </div>

          <button
            type="button"
            className="rocam-bracais-add-btn"
            onClick={
              abrirModal
            }
          >
            + Designar Braçal
          </button>

        </div>

      </section>

      {/* ===================================================
          AVISOS
      =================================================== */}

      {erro && (
        <div className="rocam-bracais-alert error">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rocam-bracais-alert success">
          {sucesso}
        </div>
      )}

      {/* ===================================================
          FERRAMENTAS
      =================================================== */}

      <section className="rocam-bracais-tools">

        <div className="rocam-bracais-search">

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
            placeholder="Buscar por nome, patente ou funcional..."
          />

        </div>

        <button
          type="button"
          className="rocam-bracais-refresh"
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

      <section className="rocam-bracais-section">

        <div className="rocam-bracais-section-header">

          <div>

            <small>
              EFETIVO ATIVO
            </small>

            <h2>
              Braçais cadastrados
            </h2>

          </div>

          <strong>
            {listaFiltrada.length}
          </strong>

        </div>

        {loading ? (
          <div className="rocam-bracais-empty">
            Carregando Braçais ROCAM...
          </div>
        ) : listaFiltrada.length ===
          0 ? (
          <div className="rocam-bracais-empty">

            {busca
              ? "Nenhum Braçal encontrado para a busca informada."
              : "Nenhum Braçal ROCAM ativo."}

          </div>
        ) : (
          <div className="rocam-bracais-grid">

            {listaFiltrada.map(
              (item) => (
                <article
                  key={
                    item._id ||
                    item.user
                  }
                  className="rocam-bracal-card"
                >

                  <div className="rocam-bracal-card-top">

                    <div className="rocam-bracal-avatar">
                      {iniciaisNome(
                        item.nome
                      )}
                    </div>

                    <div className="rocam-bracal-main">

                      <small>
                        BRAÇAL ROCAM
                      </small>

                      <strong>
                        {item.patente
                          ? `${item.patente} `
                          : ""}
                        {item.nome ||
                          "-"}
                      </strong>

                      <span>
                        Funcional{" "}
                        {item.funcional ||
                          "-"}
                      </span>

                    </div>

                    <div className="rocam-bracal-status">
                      ATIVO
                    </div>

                  </div>

                  <div className="rocam-bracal-info-grid">

                    <div>
                      <small>
                        INGRESSO ROCAM
                      </small>

                      <strong>
                        {formatarData(
                          item.dataIngressoRocam
                        )}
                      </strong>
                    </div>

                    <div>
                      <small>
                        SITUAÇÃO
                      </small>

                      <strong>
                        {item.situacaoRocam ||
                          "ATIVO"}
                      </strong>
                    </div>

                  </div>

                  <div className="rocam-bracal-footer">

                    <span>
                      Qualificação operacional
                      ativa no efetivo ROCAM.
                    </span>

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </section>

      {/* ===================================================
          INFORMAÇÃO
      =================================================== */}

      <section className="rocam-bracais-info-box">

        <div className="rocam-bracais-info-icon">
          i
        </div>

        <div>

          <strong>
            Designação direta
          </strong>

          <p>
            Utilize esta opção para
            policiais que já possuem
            qualificação de Braçal ROCAM.
            A designação não cria estágio,
            metas ou avaliações. Caso o
            policial precise realizar o
            estágio, utilize
            <b> Novo Estagiário ROCAM</b>.
          </p>

        </div>

      </section>

      {/* ===================================================
          MODAL
      =================================================== */}

      {modalAberto && (
        <div
          className="rocam-bracais-modal-overlay"
          onClick={
            fecharModal
          }
        >

          <div
            className="rocam-bracais-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="rocam-bracais-modal-header">

              <div>

                <small>
                  COMANDO ROCAM
                </small>

                <h2>
                  Designar Braçal ROCAM
                </h2>

                <p>
                  Cadastro direto sem
                  Estágio ROCAM.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  fecharModal
                }
                disabled={salvando}
              >
                ×
              </button>

            </div>

            <div className="rocam-bracais-modal-warning">

              <strong>
                Designação direta
              </strong>

              <p>
                O policial selecionado
                entrará imediatamente
                como Braçal ROCAM. Não
                serão criadas metas,
                avaliações ou estágio.
              </p>

            </div>

            <div className="rocam-bracais-field">

              <label>
                Policial *
              </label>

              <select
                value={userId}
                onChange={(e) =>
                  setUserId(
                    e.target.value
                  )
                }
              >

                <option value="">
                  Selecione o policial
                </option>

                {policiaisDisponiveis.map(
                  (item) => {
                    const id =
                      item.user ||
                      item._id;

                    return (
                      <option
                        key={id}
                        value={id}
                      >
                        {item.patente
                          ? `${item.patente} `
                          : ""}
                        {item.nome}
                        {" • "}
                        {item.funcional}
                      </option>
                    );
                  }
                )}

              </select>

              {policiaisDisponiveis.length ===
                0 && (
                <small className="rocam-bracais-field-note">
                  Nenhum policial disponível
                  para nova designação.
                </small>
              )}

            </div>

            <div className="rocam-bracais-field">

              <label>
                Data de ingresso ROCAM *
              </label>

              <input
                type="date"
                value={
                  dataIngresso
                }
                onChange={(e) =>
                  setDataIngresso(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="rocam-bracais-summary">

              <div>
                <small>
                  PAPEL
                </small>

                <strong>
                  BRAÇAL ROCAM
                </strong>
              </div>

              <div>
                <small>
                  ESTÁGIO
                </small>

                <strong>
                  NÃO
                </strong>
              </div>

              <div>
                <small>
                  METAS
                </small>

                <strong>
                  NÃO
                </strong>
              </div>

              <div>
                <small>
                  HIERARQUIA
                </small>

                <strong>
                  AUTOMÁTICA
                </strong>
              </div>

            </div>

            <div className="rocam-bracais-modal-actions">

              <button
                type="button"
                className="cancel"
                onClick={
                  fecharModal
                }
                disabled={
                  salvando
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirm"
                onClick={
                  designarBracal
                }
                disabled={
                  salvando ||
                  !userId ||
                  !dataIngresso
                }
              >
                {salvando
                  ? "Designando..."
                  : "Confirmar designação"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}