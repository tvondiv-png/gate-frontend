import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

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
   PATENTES
========================================================= */

const PATENTES = [
  "Coronel PM",
  "Tenente-Coronel PM",
  "Major PM",
  "Capitão PM",
  "1º Tenente PM",
  "2º Tenente PM",
  "Aspirante a Oficial PM",
  "Subtenente PM",
  "1º Sargento PM",
  "2º Sargento PM",
  "3º Sargento PM",
  "Cabo PM",
  "Soldado 1ª Classe PM",
  "Soldado 2ª Classe PM"
];

/* =========================================================
   FUNÇÕES
========================================================= */

const FUNCOES = [
  "Comando do Batalhão",
  "Subcomando do Batalhão",
  "Coordenador Geral",
  "Coordenador Operacional",
  "Coordenador Administrativo",
  "Recursos Humanos",
  "Setor Justiça e Disciplina",
  "Comunicação Social",
  "Operacional"
];

/* =========================================================
   CURSOS
========================================================= */

const CURSOS = [
  "Curso Modulação",
  "SAT-B",
  "Escola ESSgt",
  "Academia Barro Branco",
  "Tiro Básico",
  "Tiro Avançado",
  "POP",
  "Curso de Abordagem"
];

/* =========================================================
   MEDALHAS
========================================================= */

const MEDALHAS = [
  "Láurea do Mérito Pessoal – 5º Grau",
  "Láurea do Mérito Pessoal – 4º Grau",
  "Láurea do Mérito Pessoal – 3º Grau",
  "Láurea do Mérito Pessoal – 2º Grau",
  "Láurea do Mérito Pessoal – 1º Grau"
];

/* =========================================================
   CATEGORIAS
========================================================= */

const CATEGORIAS = [
  {
    value: "OFICIAIS_SUPERIORES",
    label: "Oficiais Superiores"
  },
  {
    value: "OFICIAIS_INTERMEDIARIOS",
    label: "Oficiais Intermediários"
  },
  {
    value: "OFICIAIS_SUBALTERNOS",
    label: "Oficiais Subalternos"
  },
  {
    value: "PRACAS_ESPECIAIS",
    label: "Praças Especiais"
  },
  {
    value: "PRACAS_GRADUADAS",
    label: "Praças Graduadas"
  },
  {
    value: "PRACAS",
    label: "Praças"
  },
  {
    value: "ESTAGIARIOS",
    label: "Estagiários"
  }
];

/* =========================================================
   QUALIFICAÇÕES ROCAM
========================================================= */

const QUALIFICACOES_ROCAM = [
  {
    value: "NENHUM",
    label: "Não pertence à ROCAM"
  },
  {
    value: "ESTAGIARIO_ROCAM",
    label: "Estagiário ROCAM"
  },
  {
    value: "BRACAL_ROCAM",
    label: "Braçal ROCAM"
  }
];

/* =========================================================
   HELPERS
========================================================= */

const getUserId = (p) => {
  if (!p) return "";

  if (
    typeof p.user === "object" &&
    p.user?._id
  ) {
    return p.user._id;
  }

  if (p.user) {
    return p.user;
  }

  return p._id;
};

const formatarDataInput = (data) => {
  if (!data) return "";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "UTC"
    }
  ).format(d);
};

const formatarData = (data) => {
  if (!data) return "-";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      timeZone: "UTC"
    }
  ).format(d);
};

const badgeStatus = (status) => {
  if (status === "Ativo") {
    return "success";
  }

  if (status === "Ausente") {
    return "warning";
  }

  return "danger";
};

const getRocamLabel = (valor) => {
  if (valor === "BRACAL_ROCAM") {
    return "Braçal ROCAM";
  }

  if (valor === "ESTAGIARIO_ROCAM") {
    return "Estagiário ROCAM";
  }

  return "-";
};

const getRocamBadge = (valor) => {
  if (valor === "BRACAL_ROCAM") {
    return "success";
  }

  if (valor === "ESTAGIARIO_ROCAM") {
    return "warning";
  }

  return "";
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function HierarchyAdmin() {
  const [lista, setLista] = useState([]);

  const [editando, setEditando] =
    useState(null);

  const [
    policialOriginal,
    setPolicialOriginal
  ] = useState(null);

  const [salvando, setSalvando] =
    useState(false);

  /* =======================================================
     FORMULÁRIO
  ======================================================= */

  const [form, setForm] = useState({
    nome: "",
    funcional: "",
    patente: "",
    funcao: "",
    status: "Ativo",
    categoriaHierarquia: "",

    qualificacaoRocam: "NENHUM",

    dataEntrada: "",
    dataUltimaPromocao: "",

    cursos: [],
    medalhas: []
  });

  /* =======================================================
     CARREGAR HIERARQUIA
  ======================================================= */

  const load = async () => {
    try {
      const res = await api.get(
        "/api/hierarchy"
      );

      setLista(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar hierarquia:",
        err
      );

      setLista([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =======================================================
     ORDENAÇÃO
  ======================================================= */

  const listaOrdenada = useMemo(() => {
    return [...lista].sort((a, b) => {
      const ordemA =
        ORDEM_PATENTES[a.patente] ||
        999;

      const ordemB =
        ORDEM_PATENTES[b.patente] ||
        999;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return (
        a.nome || ""
      ).localeCompare(
        b.nome || "",
        "pt-BR"
      );
    });
  }, [lista]);

  /* =======================================================
     EDITAR
  ======================================================= */

  const editar = (p) => {
    const userId = getUserId(p);

    if (!userId) {
      alert(
        "ID do usuário não encontrado."
      );

      return;
    }

    setEditando(userId);

    setPolicialOriginal(p);

    setForm({
      nome:
        p.nome || "",

      funcional:
        p.funcional || "",

      patente:
        p.patente || "",

      funcao:
        p.funcao || "",

      status:
        p.status || "Ativo",

      categoriaHierarquia:
        p.categoria ||
        p.categoriaHierarquia ||
        "",

      qualificacaoRocam:
        p.qualificacaoRocam ||
        "NENHUM",

      dataEntrada:
        formatarDataInput(
          p.dataEntrada
        ),

      dataUltimaPromocao:
        formatarDataInput(
          p.dataUltimaPromocao
        ),

      cursos:
        Array.isArray(p.cursos)
          ? p.cursos
          : [],

      medalhas:
        Array.isArray(p.medalhas)
          ? p.medalhas
          : []
    });
  };

  /* =======================================================
     CURSOS / MEDALHAS
  ======================================================= */

  const toggleItem = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,

      [field]:
        prev[field].includes(value)
          ? prev[field].filter(
              (v) => v !== value
            )
          : [
              ...prev[field],
              value
            ]
    }));
  };

  /* =======================================================
     FECHAR MODAL
  ======================================================= */

  const fecharModal = () => {
    setEditando(null);

    setPolicialOriginal(null);

    setSalvando(false);
  };

  /* =======================================================
     SALVAR
  ======================================================= */

  const salvar = async () => {
    if (!editando) {
      alert(
        "ID do usuário não encontrado."
      );

      return;
    }

    const patenteAnterior =
      policialOriginal?.patente || "";

    const houvePromocao =
      patenteAnterior &&
      patenteAnterior !==
        form.patente;

    const payload = {
      ...form,
      houvePromocao
    };

    try {
      setSalvando(true);

      await api.put(
        `/api/hierarchy/${editando}`,
        payload
      );

      alert(
        houvePromocao
          ? "Hierarquia atualizada com sucesso. Promoção detectada e reset de ações ativado."
          : "Hierarquia atualizada com sucesso."
      );

      fecharModal();

      await load();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Erro ao salvar"
      );
    } finally {
      setSalvando(false);
    }
  };

  /* =======================================================
     EXCLUIR
  ======================================================= */

  const excluir = async (p) => {
    const userId = getUserId(p);

    if (!userId) {
      alert(
        "ID do usuário não encontrado."
      );

      return;
    }

    if (
      !window.confirm(
        "Excluir policial da hierarquia?"
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/api/hierarchy/${userId}`
      );

      await load();
    } catch (err) {
      console.error(err);

      alert(
        err.response?.data?.message ||
          "Erro ao excluir"
      );
    }
  };

  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo = useMemo(() => {
    return {
      total:
        lista.length,

      ativos:
        lista.filter(
          (x) =>
            x.status === "Ativo"
        ).length,

      ausentes:
        lista.filter(
          (x) =>
            x.status === "Ausente"
        ).length,

      afastados:
        lista.filter(
          (x) =>
            x.status === "Afastado"
        ).length,

      rocam:
        lista.filter(
          (x) =>
            x.qualificacaoRocam ===
              "BRACAL_ROCAM" ||
            x.qualificacaoRocam ===
              "ESTAGIARIO_ROCAM"
        ).length
    };
  }, [lista]);

  return (
    <div className="admin-module-page">

      {/* =====================================================
          TOPO
      ===================================================== */}

      <div className="admin-module-topbar">

        <div>
          <h1>
            Hierarquia – Administração
          </h1>

          <p>
            Gerencie dados hierárquicos,
            qualificações ROCAM, cursos,
            medalhas e situação funcional.
          </p>
        </div>

        <button
          className="admin-module-btn blue"
          onClick={load}
        >
          Recarregar
        </button>

      </div>

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <section className="admin-module-summary-grid">

        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>
            {resumo.total}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Ativos</small>
          <strong>
            {resumo.ativos}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Ausentes</small>
          <strong>
            {resumo.ausentes}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Afastados</small>
          <strong>
            {resumo.afastados}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>ROCAM</small>
          <strong>
            {resumo.rocam}
          </strong>
        </div>

      </section>

      {/* =====================================================
          TABELA
      ===================================================== */}

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              Policiais cadastrados
            </h2>

            <span>
              Visualização completa da
              hierarquia institucional.
            </span>
          </div>

        </div>

        <div className="admin-module-table-wrap">

          <table className="admin-module-table">

            <thead>
              <tr>
                <th>
                  Funcional
                </th>

                <th>
                  Nome
                </th>

                <th>
                  Categoria
                </th>

                <th>
                  Patente
                </th>

                <th>
                  Função
                </th>

                <th>
                  ROCAM
                </th>

                <th>
                  Status
                </th>

                <th>
                  Entrada
                </th>

                <th>
                  Última Promoção
                </th>

                <th>
                  Cursos
                </th>

                <th>
                  Medalhas
                </th>

                <th>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>

              {listaOrdenada.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="12"
                    style={{
                      textAlign:
                        "center"
                    }}
                  >
                    Nenhum policial
                    encontrado.
                  </td>
                </tr>
              ) : (
                listaOrdenada.map(
                  (p) => (
                    <tr key={p._id}>

                      <td>
                        {p.funcional}
                      </td>

                      <td>
                        {p.nome}
                      </td>

                      <td>
                        {p.categoria ||
                          p.categoriaHierarquia ||
                          "-"}
                      </td>

                      <td>
                        {p.patente ||
                          "-"}
                      </td>

                      <td>
                        {p.funcao ||
                          "-"}
                      </td>

                      <td>
                        {p.qualificacaoRocam &&
                        p.qualificacaoRocam !==
                          "NENHUM" ? (
                          <span
                            className={`admin-module-badge ${getRocamBadge(
                              p.qualificacaoRocam
                            )}`}
                          >
                            {getRocamLabel(
                              p.qualificacaoRocam
                            )}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td>
                        <span
                          className={`admin-module-badge ${badgeStatus(
                            p.status
                          )}`}
                        >
                          {p.status ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {formatarData(
                          p.dataEntrada
                        )}
                      </td>

                      <td>
                        {formatarData(
                          p.dataUltimaPromocao
                        )}
                      </td>

                      <td>
                        {Array.isArray(
                          p.cursos
                        )
                          ? p.cursos
                              .length
                          : 0}
                      </td>

                      <td>
                        {Array.isArray(
                          p.medalhas
                        )
                          ? p.medalhas
                              .length
                          : 0}
                      </td>

                      <td>

                        <div
                          className="admin-module-actions"
                          style={{
                            marginTop: 0
                          }}
                        >

                          <button
                            className="admin-module-btn"
                            onClick={() =>
                              editar(p)
                            }
                          >
                            Editar
                          </button>

                          <button
                            className="admin-module-btn danger"
                            onClick={() =>
                              excluir(p)
                            }
                          >
                            Excluir
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =====================================================
          MODAL DE EDIÇÃO
      ===================================================== */}

      {editando && (
        <div
          className="admin-module-modal-backdrop"
          onClick={fecharModal}
        >

          <div
            className="admin-module-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="admin-module-section-title">

              <div>

                <h2>
                  Editar policial
                </h2>

                <span>
                  Atualize os dados da
                  hierarquia. Ao trocar
                  a patente, o sistema
                  identifica promoção
                  automaticamente.
                </span>

              </div>

            </div>

            {/* =================================================
                PROMOÇÃO DETECTADA
            ================================================= */}

            {policialOriginal?.patente &&
              policialOriginal.patente !==
                form.patente && (
                <div
                  className="admin-module-section"
                  style={{
                    padding: 14,
                    marginBottom: 16
                  }}
                >

                  <strong
                    style={{
                      color:
                        "#f59e0b"
                    }}
                  >
                    Promoção detectada
                  </strong>

                  <p
                    style={{
                      margin:
                        "8px 0 0",
                      opacity: 0.85
                    }}
                  >
                    Patente anterior:{" "}
                    <strong>
                      {
                        policialOriginal.patente
                      }
                    </strong>

                    <br />

                    Nova patente:{" "}
                    <strong>
                      {form.patente ||
                        "-"}
                    </strong>

                    <br />

                    Ao salvar, será
                    ativado o
                    reset/subtração de
                    ações por promoção.
                  </p>

                </div>
              )}

            {/* =================================================
                DADOS PRINCIPAIS
            ================================================= */}

            <div className="admin-module-grid">

              <input
                className="admin-module-input"
                placeholder="Nome"
                value={form.nome}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nome:
                      e.target.value
                  })
                }
              />

              <input
                className="admin-module-input"
                placeholder="Funcional"
                value={form.funcional}
                onChange={(e) =>
                  setForm({
                    ...form,
                    funcional:
                      e.target.value
                  })
                }
              />

              {/* PATENTE */}

              <select
                className="admin-module-select"
                value={form.patente}
                onChange={(e) =>
                  setForm({
                    ...form,
                    patente:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Selecione a patente
                </option>

                {PATENTES.map((p) => (
                  <option
                    key={p}
                    value={p}
                  >
                    {p}
                  </option>
                ))}

              </select>

              {/* FUNÇÃO */}

              <select
                className="admin-module-select"
                value={form.funcao}
                onChange={(e) =>
                  setForm({
                    ...form,
                    funcao:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Selecione a função
                </option>

                {FUNCOES.map((f) => (
                  <option
                    key={f}
                    value={f}
                  >
                    {f}
                  </option>
                ))}

              </select>

              {/* STATUS */}

              <select
                className="admin-module-select"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status:
                      e.target.value
                  })
                }
              >

                <option value="Ativo">
                  Ativo
                </option>

                <option value="Ausente">
                  Ausente
                </option>

                <option value="Afastado">
                  Afastado
                </option>

              </select>

              {/* CATEGORIA */}

              <select
                className="admin-module-select"
                value={
                  form.categoriaHierarquia
                }
                onChange={(e) =>
                  setForm({
                    ...form,

                    categoriaHierarquia:
                      e.target.value
                  })
                }
              >

                <option value="">
                  Selecione a categoria
                </option>

                {CATEGORIAS.map(
                  (c) => (
                    <option
                      key={c.value}
                      value={c.value}
                    >
                      {c.label}
                    </option>
                  )
                )}

              </select>

              {/* =================================================
                  QUALIFICAÇÃO ROCAM
              ================================================= */}

              <select
                className="admin-module-select"
                value={
                  form.qualificacaoRocam
                }
                onChange={(e) =>
                  setForm({
                    ...form,

                    qualificacaoRocam:
                      e.target.value
                  })
                }
              >

                {QUALIFICACOES_ROCAM.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}

              </select>

              {/* DATA DE ENTRADA */}

              <input
                className="admin-module-input"
                type="date"
                value={
                  form.dataEntrada
                }
                onChange={(e) =>
                  setForm({
                    ...form,

                    dataEntrada:
                      e.target.value
                  })
                }
              />

              {/* ÚLTIMA PROMOÇÃO */}

              <input
                className="admin-module-input"
                type="date"
                value={
                  form.dataUltimaPromocao
                }
                onChange={(e) =>
                  setForm({
                    ...form,

                    dataUltimaPromocao:
                      e.target.value
                  })
                }
              />

            </div>

            {/* =================================================
                CURSOS E MEDALHAS
            ================================================= */}

            <div
              className="admin-module-grid-2"
              style={{
                marginTop: 16
              }}
            >

              {/* CURSOS */}

              <div
                className="admin-module-section"
                style={{
                  padding: 14
                }}
              >

                <strong>
                  Cursos
                </strong>

                <div
                  style={{
                    marginTop: 10,
                    display: "grid",
                    gap: 6
                  }}
                >

                  {CURSOS.map(
                    (c) => (
                      <label key={c}>

                        <input
                          type="checkbox"
                          checked={form.cursos.includes(
                            c
                          )}
                          onChange={() =>
                            toggleItem(
                              "cursos",
                              c
                            )
                          }
                        />{" "}

                        {c}

                      </label>
                    )
                  )}

                </div>

              </div>

              {/* MEDALHAS */}

              <div
                className="admin-module-section"
                style={{
                  padding: 14
                }}
              >

                <strong>
                  Medalhas
                </strong>

                <div
                  style={{
                    marginTop: 10,
                    display: "grid",
                    gap: 6
                  }}
                >

                  {MEDALHAS.map(
                    (m) => (
                      <label key={m}>

                        <input
                          type="checkbox"
                          checked={form.medalhas.includes(
                            m
                          )}
                          onChange={() =>
                            toggleItem(
                              "medalhas",
                              m
                            )
                          }
                        />{" "}

                        {m}

                      </label>
                    )
                  )}

                </div>

              </div>

            </div>

            {/* =================================================
                BOTÕES
            ================================================= */}

            <div className="admin-module-actions">

              <button
                className="admin-module-btn green"
                onClick={salvar}
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : "Salvar"}
              </button>

              <button
                className="admin-module-btn blue"
                onClick={fecharModal}
                disabled={salvando}
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}