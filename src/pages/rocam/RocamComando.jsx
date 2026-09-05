import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useOutletContext
} from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-comando.css";

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
   CARD
========================================================= */

function CardComando({
  titulo,
  subtitulo,
  pessoa,
  onDesignar,
  onRemover
}) {
  return (
    <article className="rocam-command-card">

      <div className="rocam-command-card-header">

        <div>
          <small>
            {subtitulo}
          </small>

          <h2>
            {titulo}
          </h2>
        </div>

        <div className="rocam-command-card-badge">
          ROCAM
        </div>

      </div>

      {pessoa ? (
        <>
          <div className="rocam-command-person">

            <div className="rocam-command-avatar">
              {iniciaisNome(
                pessoa.nome
              )}
            </div>

            <div className="rocam-command-person-data">

              <strong>
                {pessoa.patente
                  ? `${pessoa.patente} `
                  : ""}
                {pessoa.nome ||
                  "-"}
              </strong>

              <span>
                Funcional{" "}
                {pessoa.funcional ||
                  "-"}
              </span>

              <small>
                Ingresso ROCAM:{" "}
                {formatarData(
                  pessoa.dataIngressoRocam
                )}
              </small>

            </div>

          </div>

          <div className="rocam-command-status">
            <span>
              SITUAÇÃO
            </span>

            <strong>
              {pessoa.situacaoRocam ||
                "ATIVO"}
            </strong>
          </div>

          <div className="rocam-command-card-actions">

            <button
              type="button"
              className="replace"
              onClick={
                onDesignar
              }
            >
              Substituir
            </button>

            <button
              type="button"
              className="remove"
              onClick={
                onRemover
              }
            >
              Remover
            </button>

          </div>
        </>
      ) : (
        <div className="rocam-command-empty">

          <strong>
            Nenhum policial designado
          </strong>

          <p>
            Ainda não existe policial
            ativo nesta função.
          </p>

          <button
            type="button"
            onClick={
              onDesignar
            }
          >
            + Designar
          </button>

        </div>
      )}

    </article>
  );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function RocamComando() {
  const {
    contexto
  } =
    useOutletContext();

  const [
    hierarchy,
    setHierarchy
  ] = useState({
    comando: [],
    subcomando: []
  });

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

  /* =======================================================
     MODAL DESIGNAÇÃO
  ======================================================= */

  const [
    modalDesignacao,
    setModalDesignacao
  ] = useState(false);

  const [
    papelSelecionado,
    setPapelSelecionado
  ] = useState("");

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
     MODAL REMOÇÃO
  ======================================================= */

  const [
    modalRemocao,
    setModalRemocao
  ] = useState(false);

  const [
    pessoaRemocao,
    setPessoaRemocao
  ] = useState(null);

  const [
    motivoRemocao,
    setMotivoRemocao
  ] = useState("");

  const [
    boletimRemocao,
    setBoletimRemocao
  ] = useState("");

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar =
    async () => {
      try {
        setLoading(true);
        setErro("");

        const [
          resHierarchy,
          resElegiveis
        ] =
          await Promise.all([
            api.get(
              "/api/rocam/hierarquia"
            ),

            api.get(
              "/api/rocam/comando/elegiveis"
            )
          ]);

        setHierarchy({
          comando:
            Array.isArray(
              resHierarchy.data
                ?.comando
            )
              ? resHierarchy.data
                  .comando
              : [],

          subcomando:
            Array.isArray(
              resHierarchy.data
                ?.subcomando
            )
              ? resHierarchy.data
                  .subcomando
              : []
        });

        setElegiveis(
          Array.isArray(
            resElegiveis.data
          )
            ? resElegiveis.data
            : []
        );

      } catch (err) {
        console.error(
          "Erro ao carregar Comando ROCAM:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível carregar o Comando ROCAM."
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
     ELEGÍVEIS EM ORDEM DE PATENTE
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
     TITULAR ATUAL
  ======================================================= */

  const comandante =
    hierarchy.comando?.[0] ||
    null;

  const subcomandante =
    hierarchy.subcomando?.[0] ||
    null;

  /* =======================================================
     ABRIR DESIGNAÇÃO
  ======================================================= */

  const abrirDesignacao =
    (papel) => {
      setErro("");
      setSucesso("");

      setPapelSelecionado(
        papel
      );

      setUserId("");

      setDataIngresso(
        hojeInput()
      );

      setModalDesignacao(
        true
      );
    };

  /* =======================================================
     FECHAR DESIGNAÇÃO
  ======================================================= */

  const fecharDesignacao =
    () => {
      if (salvando) {
        return;
      }

      setModalDesignacao(
        false
      );

      setPapelSelecionado(
        ""
      );

      setUserId("");
    };

  /* =======================================================
     DESIGNAR
  ======================================================= */

  const designar =
    async () => {
      if (!userId) {
        setErro(
          "Selecione o policial."
        );

        return;
      }

      if (
        !papelSelecionado
      ) {
        setErro(
          "Função ROCAM inválida."
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
              papelSelecionado,

            dataIngresso
          }
        );

        setModalDesignacao(
          false
        );

        setSucesso(
          papelSelecionado ===
            "COMANDO_ROCAM"
            ? "Comando ROCAM atualizado com sucesso."
            : "Subcomando ROCAM atualizado com sucesso."
        );

        setUserId("");

        setPapelSelecionado(
          ""
        );

        await carregar();

      } catch (err) {
        console.error(
          "Erro ao designar função ROCAM:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível realizar a designação."
        );

      } finally {
        setSalvando(false);
      }
    };

  /* =======================================================
     ABRIR REMOÇÃO
  ======================================================= */

  const abrirRemocao =
    (pessoa) => {
      setErro("");
      setSucesso("");

      setPessoaRemocao(
        pessoa
      );

      setMotivoRemocao(
        ""
      );

      setBoletimRemocao(
        ""
      );

      setModalRemocao(
        true
      );
    };

  /* =======================================================
     FECHAR REMOÇÃO
  ======================================================= */

  const fecharRemocao =
    () => {
      if (salvando) {
        return;
      }

      setModalRemocao(
        false
      );

      setPessoaRemocao(
        null
      );

      setMotivoRemocao(
        ""
      );

      setBoletimRemocao(
        ""
      );
    };

  /* =======================================================
     REMOVER DA ROCAM

     Usa o desligamento que já existe.
  ======================================================= */

  const remover =
    async () => {
      if (
        !pessoaRemocao?.user
      ) {
        setErro(
          "Policial inválido."
        );

        return;
      }

      if (
        !motivoRemocao.trim()
      ) {
        setErro(
          "Informe o motivo da remoção."
        );

        return;
      }

      try {
        setSalvando(true);

        setErro("");
        setSucesso("");

        await api.patch(
          `/api/rocam/comando/desligar/${pessoaRemocao.user}`,
          {
            motivo:
              motivoRemocao.trim(),

            numeroBoletim:
              boletimRemocao.trim()
          }
        );

        setModalRemocao(
          false
        );

        setPessoaRemocao(
          null
        );

        setMotivoRemocao(
          ""
        );

        setBoletimRemocao(
          ""
        );

        setSucesso(
          "Policial removido da função ROCAM com sucesso."
        );

        await carregar();

      } catch (err) {
        console.error(
          "Erro ao remover função ROCAM:",
          err
        );

        setErro(
          err.response?.data
            ?.message ||
            "Não foi possível remover o policial da ROCAM."
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
      <div className="rocam-command-page">

        <section className="rocam-command-denied">

          <span>
            ACESSO RESTRITO
          </span>

          <h1>
            Comando ROCAM
          </h1>

          <p>
            Esta área é exclusiva
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
    <div className="rocam-command-page">

      {/* ===================================================
          HERO
      =================================================== */}

      <section className="rocam-command-hero">

        <div>

          <span className="rocam-command-kicker">
            ESTRUTURA DE COMANDO • ROCAM
          </span>

          <h1>
            Comando ROCAM
          </h1>

          <p>
            Gerencie o Comando e
            Subcomando ROCAM de forma
            independente da função
            institucional geral do
            policial no Batalhão.
          </p>

        </div>

        <div className="rocam-command-hero-summary">

          <div>
            <small>
              COMANDO
            </small>

            <strong>
              {comandante
                ? "DESIGNADO"
                : "VAGO"}
            </strong>
          </div>

          <div>
            <small>
              SUBCOMANDO
            </small>

            <strong>
              {subcomandante
                ? "DESIGNADO"
                : "VAGO"}
            </strong>
          </div>

        </div>

      </section>

      {/* ===================================================
          AVISOS
      =================================================== */}

      {erro && (
        <div className="rocam-command-alert error">
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="rocam-command-alert success">
          {sucesso}
        </div>
      )}

      {/* ===================================================
          CARREGANDO
      =================================================== */}

      {loading ? (
        <div className="rocam-command-loading">
          Carregando estrutura ROCAM...
        </div>
      ) : (
        <section className="rocam-command-grid">

          <CardComando
            titulo="Comando ROCAM"
            subtitulo="COMANDANTE ROCAM"
            pessoa={
              comandante
            }
            onDesignar={() =>
              abrirDesignacao(
                "COMANDO_ROCAM"
              )
            }
            onRemover={() =>
              abrirRemocao(
                comandante
              )
            }
          />

          <CardComando
            titulo="Subcomando ROCAM"
            subtitulo="SUBCOMANDANTE ROCAM"
            pessoa={
              subcomandante
            }
            onDesignar={() =>
              abrirDesignacao(
                "SUBCOMANDO_ROCAM"
              )
            }
            onRemover={() =>
              abrirRemocao(
                subcomandante
              )
            }
          />

        </section>
      )}

      {/* ===================================================
          EXPLICAÇÃO
      =================================================== */}

      <section className="rocam-command-info">

        <div>
          <strong>
            Estrutura independente
          </strong>

          <p>
            A função de Comando ROCAM
            ou Subcomando ROCAM é
            registrada no módulo ROCAM.
            A patente e a função geral
            do policial no Batalhão
            permanecem independentes.
          </p>
        </div>

      </section>

      {/* ===================================================
          MODAL DE DESIGNAÇÃO
      =================================================== */}

      {modalDesignacao && (
        <div
          className="rocam-command-modal-overlay"
          onClick={
            fecharDesignacao
          }
        >

          <div
            className="rocam-command-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="rocam-command-modal-header">

              <div>

                <small>
                  COMANDO ROCAM
                </small>

                <h2>
                  {papelSelecionado ===
                  "COMANDO_ROCAM"
                    ? "Designar Comandante ROCAM"
                    : "Designar Subcomandante ROCAM"}
                </h2>

                <p>
                  Seleção direta de
                  policial para a função.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  fecharDesignacao
                }
                disabled={
                  salvando
                }
              >
                ×
              </button>

            </div>

            <div className="rocam-command-field">

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

            </div>

            <div className="rocam-command-field">

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

            <div className="rocam-command-modal-actions">

              <button
                type="button"
                className="cancel"
                disabled={
                  salvando
                }
                onClick={
                  fecharDesignacao
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirm"
                disabled={
                  salvando ||
                  !userId ||
                  !dataIngresso
                }
                onClick={
                  designar
                }
              >
                {salvando
                  ? "Salvando..."
                  : "Confirmar designação"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ===================================================
          MODAL DE REMOÇÃO
      =================================================== */}

      {modalRemocao && (
        <div
          className="rocam-command-modal-overlay"
          onClick={
            fecharRemocao
          }
        >

          <div
            className="rocam-command-modal danger"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="rocam-command-modal-header">

              <div>

                <small>
                  COMANDO ROCAM
                </small>

                <h2>
                  Remover da função ROCAM
                </h2>

                <p>
                  {pessoaRemocao?.patente ||
                    ""}{" "}
                  {pessoaRemocao?.nome ||
                    ""}
                </p>

              </div>

            </div>

            <div className="rocam-command-warning">

              O policial será retirado
              do vínculo ROCAM ativo.
              O histórico será
              preservado.

            </div>

            <div className="rocam-command-field">

              <label>
                Motivo *
              </label>

              <textarea
                rows="5"
                value={
                  motivoRemocao
                }
                onChange={(e) =>
                  setMotivoRemocao(
                    e.target.value
                  )
                }
                placeholder="Informe o motivo da remoção..."
              />

            </div>

            <div className="rocam-command-field">

              <label>
                Número do boletim
              </label>

              <input
                type="text"
                value={
                  boletimRemocao
                }
                onChange={(e) =>
                  setBoletimRemocao(
                    e.target.value
                  )
                }
                placeholder="Opcional"
              />

            </div>

            <div className="rocam-command-modal-actions">

              <button
                type="button"
                className="cancel"
                disabled={
                  salvando
                }
                onClick={
                  fecharRemocao
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="remove"
                disabled={
                  salvando ||
                  !motivoRemocao.trim()
                }
                onClick={
                  remover
                }
              >
                {salvando
                  ? "Removendo..."
                  : "Confirmar remoção"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}