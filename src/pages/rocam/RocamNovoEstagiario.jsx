import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-novo-estagiario.css";

const CRITERIOS_PADRAO = [
  {
    chave: "fardamento",
    nome: "Fardamento",
    descricao: "Apresentação pessoal e fardamento de acordo com o padrão estabelecido."
  },
  {
    chave: "postura",
    nome: "Postura",
    descricao: "Postura profissional, disciplina e comportamento durante o serviço."
  },
  {
    chave: "pilotagem",
    nome: "Pilotagem",
    descricao: "Domínio técnico, segurança e condução da motocicleta."
  },
  {
    chave: "acompanhamento",
    nome: "Acompanhamento",
    descricao: "Desempenho durante acompanhamento e atuação operacional."
  },
  {
    chave: "comunicacao",
    nome: "Comunicação",
    descricao: "Clareza na comunicação e emprego adequado da rede."
  },
  {
    chave: "procedimento",
    nome: "Procedimento operacional",
    descricao: "Conhecimento e execução dos procedimentos operacionais."
  },
  {
    chave: "iniciativa",
    nome: "Iniciativa",
    descricao: "Capacidade de iniciativa dentro dos limites e procedimentos da equipe."
  },
  {
    chave: "trabalhoEquipe",
    nome: "Trabalho em equipe",
    descricao: "Integração, cooperação e atuação coordenada com a equipe ROCAM."
  },
  {
    chave: "conhecimento",
    nome: "Conhecimento técnico",
    descricao: "Conhecimento dos procedimentos, normas e atribuições relacionadas à ROCAM."
  },
  {
    chave: "compreensao",
    nome: "Compreensão",
    descricao: "Capacidade de compreender orientações, correções e instruções."
  }
];

const QUESTIONARIOS_PADRAO = [
  {
    chave: "doutrina",
    nome: "Doutrina ROCAM",
    descricao: "Questionário de conhecimentos relacionados à doutrina ROCAM."
  },
  {
    chave: "procedimentos",
    nome: "Procedimentos operacionais",
    descricao: "Avaliação teórica sobre procedimentos empregados no serviço."
  },
  {
    chave: "pilotagem",
    nome: "Pilotagem e segurança",
    descricao: "Conhecimentos relacionados à pilotagem e segurança operacional."
  }
];

export default function RocamNovoEstagiario() {
  const navigate = useNavigate();

  const { contexto, reloadContext } = useOutletContext();

  const [policiais, setPoliciais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    userId: "",
    dataEntradaRocam: new Date().toISOString().slice(0, 10),

    metaHoras: 60,
    metaAvaliacoes: 5,
    notaMinimaAvaliacoes: 70,

    exigirQuestionarios: true,
    notaMinimaQuestionarios: 70,

    criteriosAvaliacao: CRITERIOS_PADRAO.map((item) => item.chave),

    questionarios: QUESTIONARIOS_PADRAO.map((item) => item.chave),

    observacoes: ""
  });

  /* =========================================================
     CARREGAR POLICIAIS ELEGÍVEIS
  ========================================================= */

  const carregarElegiveis = async () => {
    try {
      setLoading(true);
      setErro("");

      const res = await api.get(
        "/api/rocam/comando/elegiveis"
      );

      setPoliciais(
        Array.isArray(res.data)
          ? res.data
          : res.data?.policiais || []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar policiais elegíveis:",
        err
      );

      setPoliciais([]);

      setErro(
        err.response?.data?.message ||
          "Não foi possível carregar os policiais disponíveis."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarElegiveis();
  }, []);

  /* =========================================================
     FILTRO
  ========================================================= */

  const policiaisFiltrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    if (!termo) {
      return policiais;
    }

    return policiais.filter((policial) => {
      const nome = String(
        policial.nome || ""
      ).toLowerCase();

      const funcional = String(
        policial.funcional || ""
      ).toLowerCase();

      const patente = String(
        policial.patente || ""
      ).toLowerCase();

      return (
        nome.includes(termo) ||
        funcional.includes(termo) ||
        patente.includes(termo)
      );
    });
  }, [policiais, busca]);

  const policialSelecionado = useMemo(
    () =>
      policiais.find(
        (policial) =>
          String(policial.user || policial.userId || policial._id) ===
          String(form.userId)
      ) || null,
    [policiais, form.userId]
  );

  /* =========================================================
     ALTERAÇÕES
  ========================================================= */

  const alterarCampo = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor
    }));
  };

  const alternarCriterio = (chave) => {
    setForm((anterior) => {
      const existe =
        anterior.criteriosAvaliacao.includes(chave);

      return {
        ...anterior,

        criteriosAvaliacao: existe
          ? anterior.criteriosAvaliacao.filter(
              (item) => item !== chave
            )
          : [
              ...anterior.criteriosAvaliacao,
              chave
            ]
      };
    });
  };

  const alternarQuestionario = (chave) => {
    setForm((anterior) => {
      const existe =
        anterior.questionarios.includes(chave);

      return {
        ...anterior,

        questionarios: existe
          ? anterior.questionarios.filter(
              (item) => item !== chave
            )
          : [
              ...anterior.questionarios,
              chave
            ]
      };
    });
  };

  /* =========================================================
     SALVAR
  ========================================================= */

  const cadastrar = async (e) => {
    e.preventDefault();

    setErro("");
    setSucesso("");

    if (!form.userId) {
      setErro(
        "Selecione o policial que iniciará o estágio ROCAM."
      );
      return;
    }

    if (!form.dataEntradaRocam) {
      setErro(
        "Informe a data de ingresso na ROCAM."
      );
      return;
    }

    if (
      Number(form.metaHoras) < 0 ||
      Number(form.metaAvaliacoes) < 0
    ) {
      setErro(
        "As metas não podem possuir valores negativos."
      );
      return;
    }

    if (form.criteriosAvaliacao.length === 0) {
      setErro(
        "Selecione pelo menos um critério de avaliação."
      );
      return;
    }

    if (
      form.exigirQuestionarios &&
      form.questionarios.length === 0
    ) {
      setErro(
        "Selecione pelo menos um questionário ou desative essa exigência."
      );
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        userId: form.userId,

        dataEntradaRocam:
          form.dataEntradaRocam,

        metas: {
          horasPatrulhamento:
            Number(form.metaHoras),

          quantidadeAvaliacoes:
            Number(form.metaAvaliacoes),

          notaMinimaAvaliacoes:
            Number(form.notaMinimaAvaliacoes),

          exigirQuestionarios:
            form.exigirQuestionarios,

          notaMinimaQuestionarios:
            form.exigirQuestionarios
              ? Number(form.notaMinimaQuestionarios)
              : 0
        },

        criteriosAvaliacao:
          form.criteriosAvaliacao,

        questionarios:
          form.exigirQuestionarios
            ? form.questionarios
            : [],

        observacoes:
          form.observacoes.trim()
      };

      await api.post(
        "/api/rocam/comando/estagiarios",
        payload
      );

      setSucesso(
        "Estagiário ROCAM cadastrado com sucesso."
      );

      if (reloadContext) {
        await reloadContext();
      }

      setTimeout(() => {
        navigate("/rocam/hierarquia");
      }, 1200);
    } catch (err) {
      console.error(
        "Erro ao cadastrar estagiário ROCAM:",
        err
      );

      setErro(
        err.response?.data?.message ||
          "Não foi possível cadastrar o estagiário ROCAM."
      );
    } finally {
      setSalvando(false);
    }
  };

  /* =========================================================
     SEGURANÇA VISUAL
     A segurança real continuará sendo feita no backend.
  ========================================================= */

  if (
    !contexto?.podeGerenciar &&
    !contexto?.superadmin &&
    !contexto?.comandoBatalhao
  ) {
    return (
      <div className="rocam-new-page">
        <section className="rocam-new-denied">
          <span>ACESSO RESTRITO</span>

          <h1>
            Administração ROCAM
          </h1>

          <p>
            Seu nível de acesso não permite cadastrar
            novos estagiários ROCAM.
          </p>

          <button
            type="button"
            onClick={() => navigate("/rocam")}
          >
            Voltar ao painel
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="rocam-new-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="rocam-new-hero">

        <div>
          <span className="rocam-new-kicker">
            COMANDO ROCAM
          </span>

          <h1>
            Novo Estagiário ROCAM
          </h1>

          <p>
            Cadastre o policial no estágio ROCAM e estabeleça
            as metas e critérios necessários para conclusão.
          </p>
        </div>

        <div className="rocam-new-hero-status">
          <small>
            PROCESSO
          </small>

          <strong>
            Ingresso no estágio
          </strong>

          <span>
            Metas individualizadas
          </span>
        </div>

      </section>

      {/* =====================================================
          ALERTAS
      ===================================================== */}

      {erro && (
        <div className="rocam-new-alert error">
          <strong>
            Não foi possível continuar
          </strong>

          <span>
            {erro}
          </span>
        </div>
      )}

      {sucesso && (
        <div className="rocam-new-alert success">
          <strong>
            Cadastro concluído
          </strong>

          <span>
            {sucesso}
          </span>
        </div>
      )}

      <form onSubmit={cadastrar}>

        {/* ===================================================
            1. POLICIAL
        =================================================== */}

        <section className="rocam-new-section">

          <div className="rocam-new-section-header">

            <div className="rocam-new-section-number">
              01
            </div>

            <div>
              <small>
                INGRESSO
              </small>

              <h2>
                Selecionar policial
              </h2>

              <p>
                Escolha um policial da hierarquia geral
                para iniciar o estágio ROCAM.
              </p>
            </div>

          </div>

          <div className="rocam-new-field">

            <label>
              Pesquisar policial
            </label>

            <input
              type="text"
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
              placeholder="Nome, funcional ou patente"
            />

          </div>

          {loading ? (

            <div className="rocam-new-empty">
              Carregando policiais disponíveis...
            </div>

          ) : policiaisFiltrados.length === 0 ? (

            <div className="rocam-new-empty">
              Nenhum policial elegível encontrado.
            </div>

          ) : (

            <div className="rocam-new-police-grid">

              {policiaisFiltrados.map(
                (policial) => {

                  const id = String(
                    policial.user ||
                    policial.userId ||
                    policial._id
                  );

                  const selecionado =
                    String(form.userId) === id;

                  return (
                    <button
                      type="button"
                      key={id}
                      className={`rocam-new-police-card ${
                        selecionado
                          ? "selected"
                          : ""
                      }`}
                      onClick={() =>
                        alterarCampo(
                          "userId",
                          id
                        )
                      }
                    >

                      <div className="rocam-new-police-check">
                        {selecionado
                          ? "✓"
                          : ""}
                      </div>

                      <div className="rocam-new-police-data">

                        <small>
                          {policial.patente || "Policial"}
                        </small>

                        <strong>
                          {policial.nome}
                        </strong>

                        <span>
                          Funcional:{" "}
                          {policial.funcional || "-"}
                        </span>

                      </div>

                    </button>
                  );
                }
              )}

            </div>

          )}

          {policialSelecionado && (

            <div className="rocam-new-selected">

              <div>
                <small>
                  POLICIAL SELECIONADO
                </small>

                <strong>
                  {policialSelecionado.patente || ""}{" "}
                  {policialSelecionado.nome}
                </strong>
              </div>

              <span>
                Funcional{" "}
                {policialSelecionado.funcional}
              </span>

            </div>

          )}

          <div className="rocam-new-grid-2">

            <div className="rocam-new-field">

              <label>
                Data de ingresso na ROCAM
              </label>

              <input
                type="date"
                value={form.dataEntradaRocam}
                onChange={(e) =>
                  alterarCampo(
                    "dataEntradaRocam",
                    e.target.value
                  )
                }
              />

              <small>
                Essa data será utilizada no histórico ROCAM.
              </small>

            </div>

          </div>

        </section>

        {/* ===================================================
            2. METAS
        =================================================== */}

        <section className="rocam-new-section">

          <div className="rocam-new-section-header">

            <div className="rocam-new-section-number">
              02
            </div>

            <div>
              <small>
                METAS DO ESTÁGIO
              </small>

              <h2>
                Critérios para conclusão
              </h2>

              <p>
                Estabeleça as exigências que serão acompanhadas
                automaticamente durante o estágio.
              </p>
            </div>

          </div>

          <div className="rocam-new-metrics-grid">

            <div className="rocam-new-metric">

              <span>
                HORAS DE PATRULHAMENTO
              </span>

              <input
                type="number"
                min="0"
                value={form.metaHoras}
                onChange={(e) =>
                  alterarCampo(
                    "metaHoras",
                    e.target.value
                  )
                }
              />

              <small>
                horas mínimas
              </small>

            </div>

            <div className="rocam-new-metric">

              <span>
                AVALIAÇÕES
              </span>

              <input
                type="number"
                min="0"
                value={form.metaAvaliacoes}
                onChange={(e) =>
                  alterarCampo(
                    "metaAvaliacoes",
                    e.target.value
                  )
                }
              />

              <small>
                avaliações mínimas
              </small>

            </div>

            <div className="rocam-new-metric">

              <span>
                NOTA DAS AVALIAÇÕES
              </span>

              <input
                type="number"
                min="0"
                max="100"
                value={form.notaMinimaAvaliacoes}
                onChange={(e) =>
                  alterarCampo(
                    "notaMinimaAvaliacoes",
                    e.target.value
                  )
                }
              />

              <small>
                percentual mínimo
              </small>

            </div>

          </div>

        </section>

        {/* ===================================================
            3. CRITÉRIOS DE AVALIAÇÃO
        =================================================== */}

        <section className="rocam-new-section">

          <div className="rocam-new-section-header">

            <div className="rocam-new-section-number">
              03
            </div>

            <div>
              <small>
                AVALIAÇÃO PRÁTICA
              </small>

              <h2>
                Critérios dos Braçais
              </h2>

              <p>
                Marque quais itens deverão ser avaliados
                pelos Braçais ROCAM durante o estágio.
              </p>
            </div>

          </div>

          <div className="rocam-new-options-grid">

            {CRITERIOS_PADRAO.map(
              (criterio) => {

                const ativo =
                  form.criteriosAvaliacao.includes(
                    criterio.chave
                  );

                return (
                  <button
                    key={criterio.chave}
                    type="button"
                    className={`rocam-new-option ${
                      ativo
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      alternarCriterio(
                        criterio.chave
                      )
                    }
                  >

                    <div className="rocam-new-option-check">
                      {ativo
                        ? "✓"
                        : ""}
                    </div>

                    <div>
                      <strong>
                        {criterio.nome}
                      </strong>

                      <span>
                        {criterio.descricao}
                      </span>
                    </div>

                  </button>
                );
              }
            )}

          </div>

          <div className="rocam-new-selection-count">
            <strong>
              {form.criteriosAvaliacao.length}
            </strong>

            <span>
              critérios selecionados
            </span>
          </div>

        </section>

        {/* ===================================================
            4. QUESTIONÁRIOS
        =================================================== */}

        <section className="rocam-new-section">

          <div className="rocam-new-section-header">

            <div className="rocam-new-section-number">
              04
            </div>

            <div>
              <small>
                CONHECIMENTO
              </small>

              <h2>
                Questionários do estágio
              </h2>

              <p>
                Determine se o estagiário deverá concluir
                avaliações teóricas durante o estágio.
              </p>
            </div>

          </div>

          <label className="rocam-new-switch-row">

            <div>
              <strong>
                Exigir questionários
              </strong>

              <span>
                Os questionários selecionados farão parte
                das metas para aprovação.
              </span>
            </div>

            <input
              type="checkbox"
              checked={
                form.exigirQuestionarios
              }
              onChange={(e) =>
                alterarCampo(
                  "exigirQuestionarios",
                  e.target.checked
                )
              }
            />

          </label>

          {form.exigirQuestionarios && (
            <>

              <div className="rocam-new-question-grid">

                {QUESTIONARIOS_PADRAO.map(
                  (questionario) => {

                    const ativo =
                      form.questionarios.includes(
                        questionario.chave
                      );

                    return (
                      <button
                        type="button"
                        key={questionario.chave}
                        className={`rocam-new-option ${
                          ativo
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          alternarQuestionario(
                            questionario.chave
                          )
                        }
                      >

                        <div className="rocam-new-option-check">
                          {ativo
                            ? "✓"
                            : ""}
                        </div>

                        <div>
                          <strong>
                            {questionario.nome}
                          </strong>

                          <span>
                            {questionario.descricao}
                          </span>
                        </div>

                      </button>
                    );
                  }
                )}

              </div>

              <div
                className="rocam-new-field"
                style={{
                  maxWidth: 300,
                  marginTop: 16
                }}
              >

                <label>
                  Nota mínima dos questionários
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    form.notaMinimaQuestionarios
                  }
                  onChange={(e) =>
                    alterarCampo(
                      "notaMinimaQuestionarios",
                      e.target.value
                    )
                  }
                />

              </div>

            </>
          )}

        </section>

        {/* ===================================================
            5. OBSERVAÇÕES
        =================================================== */}

        <section className="rocam-new-section">

          <div className="rocam-new-section-header">

            <div className="rocam-new-section-number">
              05
            </div>

            <div>
              <small>
                COMANDO ROCAM
              </small>

              <h2>
                Observações
              </h2>

              <p>
                Orientações adicionais para o período
                de estágio.
              </p>
            </div>

          </div>

          <div className="rocam-new-field">

            <label>
              Observação do Comando ROCAM
            </label>

            <textarea
              rows="5"
              value={form.observacoes}
              onChange={(e) =>
                alterarCampo(
                  "observacoes",
                  e.target.value
                )
              }
              placeholder="Digite orientações ou observações sobre o estágio..."
            />

          </div>

        </section>

        {/* ===================================================
            RESUMO / CONFIRMAÇÃO
        =================================================== */}

        <section className="rocam-new-confirm">

          <div className="rocam-new-confirm-info">

            <small>
              CONFIRMAÇÃO
            </small>

            <h2>
              Iniciar estágio ROCAM
            </h2>

            <p>
              Após o cadastro, o policial passará a constar
              na Hierarquia ROCAM como Estagiário ROCAM e
              suas metas poderão ser acompanhadas pelo
              Comando.
            </p>

          </div>

          <div className="rocam-new-confirm-summary">

            <div>
              <span>
                Policial
              </span>

              <strong>
                {policialSelecionado?.nome ||
                  "Não selecionado"}
              </strong>
            </div>

            <div>
              <span>
                Horas
              </span>

              <strong>
                {form.metaHoras}h
              </strong>
            </div>

            <div>
              <span>
                Avaliações
              </span>

              <strong>
                {form.metaAvaliacoes}
              </strong>
            </div>

            <div>
              <span>
                Critérios
              </span>

              <strong>
                {form.criteriosAvaliacao.length}
              </strong>
            </div>

          </div>

          <div className="rocam-new-actions">

            <button
              type="button"
              className="rocam-new-btn secondary"
              onClick={() =>
                navigate("/rocam")
              }
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="rocam-new-btn primary"
              disabled={
                salvando ||
                !form.userId
              }
            >
              {salvando
                ? "Cadastrando..."
                : "Cadastrar Estagiário ROCAM"}
            </button>

          </div>

        </section>

      </form>

    </div>
  );
}