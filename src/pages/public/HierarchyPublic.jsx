import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "./hierarchy-public.css";
import { INSIGNIAS } from "../../utils/insignias";

import { useToast } from "../../contexts/ToastContext";
const ORDEM_CATEGORIAS = [
  "OFICIAIS_SUPERIORES",
  "OFICIAIS_INTERMEDIARIOS",
  "OFICIAIS_SUBALTERNOS",
  "PRACAS_ESPECIAIS",
  "PRACAS_GRADUADAS",
  "PRACAS",
  "ESTAGIARIOS"
];

const LABEL_CATEGORIAS = {
  OFICIAIS_SUPERIORES: "Oficiais Superiores",
  OFICIAIS_INTERMEDIARIOS: "Oficiais Intermediários",
  OFICIAIS_SUBALTERNOS: "Oficiais Subalternos",
  PRACAS_ESPECIAIS: "Praças Especiais",
  PRACAS_GRADUADAS: "Praças Graduadas",
  PRACAS: "Praças",
  ESTAGIARIOS: "Estagiários"
};

const formatarData = (valor) => {
  if (!valor) return "-";

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "UTC"
  }).format(data);
};

const normalizarPatente = (p) =>
  (p || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ºª]/g, "")
    .replace(/[–—]/g, "-")
    .toUpperCase()
    .trim();

const ORDEM_PATENTES = {
  "CORONEL PM": 1,
  "TENENTE-CORONEL PM": 2,
  "MAJOR PM": 3,
  "CAPITAO PM": 4,
  "1 TENENTE PM": 5,
  "2 TENENTE PM": 6,
  "ASPIRANTE A OFICIAL PM": 7,
  "ASPIRANTE-A-OFICIAL PM": 7,
  "ASPIRANTE PM": 7,
  "SUBTENENTE PM": 8,
  "1 SARGENTO PM": 9,
  "2 SARGENTO PM": 10,
  "3 SARGENTO PM": 11,
  "CABO PM": 12,
  "SOLDADO 1 CLASSE PM": 13,
  "SOLDADO 2 CLASSE PM": 14
};

const ordenarPorPatente = (lista = []) => {
  return [...lista].sort((a, b) => {
    const pa = normalizarPatente(a.patente);
    const pb = normalizarPatente(b.patente);

    const ordemA = ORDEM_PATENTES[pa] || 999;
    const ordemB = ORDEM_PATENTES[pb] || 999;

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    return String(a.nome || "").localeCompare(
      String(b.nome || ""),
      "pt-BR"
    );
  });
};

const filtrarLista = (lista = [], termo = "") => {
  const busca = termo.trim().toLowerCase();

  if (!busca) {
    return lista;
  }

  return lista.filter((m) => {
    const nome = String(m.nome || "").toLowerCase();
    const funcional = String(m.funcional || "").toLowerCase();
    const patente = String(m.patente || "").toLowerCase();
    const funcao = String(m.funcao || "").toLowerCase();

    return (
      nome.includes(busca) ||
      funcional.includes(busca) ||
      patente.includes(busca) ||
      funcao.includes(busca)
    );
  });
};

const StatusPill = ({ status }) => {
  const ativo =
    String(status || "").toLowerCase() === "ativo";

  return (
    <span
      className={`status-pill ${
        ativo ? "ativo" : "inativo"
      }`}
    >
      {status || "-"}
    </span>
  );
};

const PatenteCell = ({ patente }) => {
  return (
    <div className="patente-cell">
      {INSIGNIAS[patente] && (
        <img
          src={INSIGNIAS[patente]}
          alt={patente}
          className="insignia"
        />
      )}

      <span>{patente || "-"}</span>
    </div>
  );
};

export default function HierarchyPublic() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [rocam, setRocam] = useState(null);

  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState("geral");

  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      setLoading(true);

      const [resGeral, resRocam] = await Promise.all([
        api.get("/api/hierarchy/public"),
        api.get("/api/hierarchy/rocam")
      ]);

      setData(resGeral.data || {});
      setRocam(resRocam.data || null);
    } catch (err) {
      console.error(
        "Erro ao carregar hierarquia:",
        err
      );

      toast.error("Erro ao carregar hierarquia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const totalGeral = useMemo(() => {
    if (!data) return 0;

    return ORDEM_CATEGORIAS.reduce(
      (acc, key) =>
        acc + (data[key]?.total || 0),
      0
    );
  }, [data]);

  const membrosFiltradosPorCategoria =
    useMemo(() => {
      if (!data) return {};

      const resultado = {};

      ORDEM_CATEGORIAS.forEach((key) => {
        const categoria = data[key];

        if (
          !categoria ||
          !Array.isArray(categoria.membros)
        ) {
          resultado[key] = [];
          return;
        }

        const ordenada =
          ordenarPorPatente(
            categoria.membros
          );

        resultado[key] =
          filtrarLista(
            ordenada,
            busca
          );
      });

      return resultado;
    }, [data, busca]);

  const rocamFiltrada = useMemo(() => {
    const comando =
      ordenarPorPatente(
        rocam?.comando?.membros || []
      );

    const subcomando =
      ordenarPorPatente(
        rocam?.subcomando?.membros || []
      );

    const bracais =
      ordenarPorPatente(
        rocam?.bracais?.membros || []
      );

    const estagiarios =
      ordenarPorPatente(
        rocam?.estagiarios?.membros || []
      );

    return {
      comando:
        filtrarLista(comando, busca),

      subcomando:
        filtrarLista(subcomando, busca),

      bracais:
        filtrarLista(
          bracais,
          busca
        ),

      estagiarios:
        filtrarLista(
          estagiarios,
          busca
        )
    };
  }, [rocam, busca]);

  if (loading) {
    return (
      <div className="hierarchy-public-page">
        <div className="hierarchy-loading-card">
          <div className="hierarchy-spinner" />

          <p>
            Carregando hierarquia...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="hierarchy-public-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hierarchy-public-hero">

        <div className="hierarchy-public-hero-content">

          <img
            src="/anchieta-logo.png"
            alt="2º BPChq Anchieta"
            className="hierarchy-public-logo"
          />

          <span className="hierarchy-public-kicker">
            2º BPChq • ANCHIETA
          </span>

          <h1>
            Estrutura Institucional
          </h1>

          <p>
            Consulte a composição hierárquica
            do efetivo do batalhão e a
            estrutura específica da ROCAM.
          </p>

        </div>

        <div className="hierarchy-public-hero-side">

          <div className="hierarchy-stat-card">

            <span>
              Efetivo total
            </span>

            <strong>
              {totalGeral}
            </strong>

          </div>

          <div className="hierarchy-stat-card rocam">

            <span>
              Efetivo ROCAM
            </span>

            <strong>
              {rocam?.total || 0}
            </strong>

          </div>

        </div>

      </section>

      {/* =====================================================
          ABAS
      ===================================================== */}

      <section className="hierarchy-tabs">

        <button
          type="button"
          className={
            aba === "geral"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("geral")
          }
        >
          Hierarquia Geral
        </button>

        <button
          type="button"
          className={
            aba === "rocam"
              ? "active rocam"
              : "rocam"
          }
          onClick={() =>
            setAba("rocam")
          }
        >
          Hierarquia ROCAM
        </button>

      </section>

      {/* =====================================================
          BUSCA
      ===================================================== */}

      <section className="hierarchy-toolbar">

        <div className="hierarchy-toolbar-left">

          <h2>
            {aba === "geral"
              ? "Quadro Geral"
              : "Quadro ROCAM"}
          </h2>

          <p>
            Busque por nome, funcional,
            patente ou função.
          </p>

        </div>

        <div className="hierarchy-toolbar-right">

          <input
            type="text"
            placeholder="Buscar integrante..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
            className="hierarchy-search-input"
          />

        </div>

      </section>

      {/* =====================================================
          ABA GERAL
      ===================================================== */}

      {aba === "geral" && (
        <>
          <section className="hierarchy-summary">

            <div className="summary-card total">
              <span className="numero">
                {totalGeral}
              </span>

              <span className="label">
                EFETIVO TOTAL
              </span>
            </div>

            {ORDEM_CATEGORIAS.map(
              (key) => {
                const c = data?.[key];

                if (
                  !c ||
                  c.total === 0
                ) {
                  return null;
                }

                return (
                  <div
                    key={key}
                    className="summary-card"
                    style={{
                      borderColor:
                        c.cor ||
                        "rgba(148,163,184,0.20)"
                    }}
                  >
                    <span className="numero">
                      {c.total}
                    </span>

                    <span className="label">
                      {LABEL_CATEGORIAS[
                        key
                      ] ||
                        c.categoria ||
                        key}
                    </span>
                  </div>
                );
              }
            )}

          </section>

          <section className="hierarchy-content">

            {ORDEM_CATEGORIAS.map(
              (key) => {
                const c = data?.[key];

                const membrosOrdenados =
                  membrosFiltradosPorCategoria[
                    key
                  ] || [];

                if (
                  !c ||
                  c.total === 0
                ) {
                  return null;
                }

                if (
                  busca &&
                  membrosOrdenados.length ===
                    0
                ) {
                  return null;
                }

                return (
                  <div
                    key={key}
                    className="category-block"
                  >

                    <div
                      className="category-header"
                      style={{
                        borderColor:
                          c.cor ||
                          "rgba(148,163,184,0.25)"
                      }}
                    >

                      <div>

                        <span
                          className="category-badge"
                          style={{
                            background:
                              `${
                                c.cor ||
                                "#94a3b8"
                              }18`,

                            borderColor:
                              `${
                                c.cor ||
                                "#94a3b8"
                              }55`,

                            color:
                              c.cor ||
                              "#cbd5e1"
                          }}
                        >
                          {LABEL_CATEGORIAS[
                            key
                          ] ||
                            c.categoria ||
                            key}
                        </span>

                        <h2>
                          {LABEL_CATEGORIAS[
                            key
                          ] ||
                            c.categoria ||
                            key}{" "}

                          <small>
                            (
                            {
                              membrosOrdenados.length
                            }
                            )
                          </small>
                        </h2>

                      </div>

                    </div>

                    <div className="hierarchy-table-wrapper">

                      <table className="hierarchy-table">

                        <thead>
                          <tr>
                            <th>
                              Funcional
                            </th>

                            <th>
                              Nome
                            </th>

                            <th>
                              Patente
                            </th>

                            <th>
                              Função
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
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody>

                          {membrosOrdenados.map(
                            (m, i) => {
                              const cursos =
                                m.cursos ??
                                [];

                              const medalhas =
                                m.medalhas ??
                                [];

                              return (
                                <tr
                                  key={
                                    m._id ||
                                    m.funcional ||
                                    i
                                  }
                                  className="table-row"
                                  style={{
                                    animationDelay:
                                      `${
                                        (i %
                                          10) *
                                        0.04
                                      }s`
                                  }}
                                >

                                  <td>
                                    {m.funcional ||
                                      "-"}
                                  </td>

                                  <td>
                                    {m.nome ||
                                      "-"}
                                  </td>

                                  <td>
                                    <PatenteCell
                                      patente={
                                        m.patente
                                      }
                                    />
                                  </td>

                                  <td>
                                    {m.funcao ||
                                      "-"}
                                  </td>

                                  <td>
                                    {formatarData(
                                      m.dataEntrada
                                    )}
                                  </td>

                                  <td>
                                    {formatarData(
                                      m.dataUltimaPromocao ||
                                        m.ultimaPromocao
                                    )}
                                  </td>

                                  <td>
                                    {cursos.length >
                                    0 ? (
                                      <div className="hover-info">

                                        <span className="count-badge">
                                          {
                                            cursos.length
                                          }
                                        </span>

                                        <div className="tooltip">
                                          {cursos.map(
                                            (
                                              curso,
                                              idx
                                            ) => (
                                              <div
                                                key={
                                                  idx
                                                }
                                              >
                                                •{" "}
                                                {
                                                  curso
                                                }
                                              </div>
                                            )
                                          )}
                                        </div>

                                      </div>
                                    ) : (
                                      <span className="muted-zero">
                                        0
                                      </span>
                                    )}
                                  </td>

                                  <td>
                                    {medalhas.length >
                                    0 ? (
                                      <div className="hover-info">

                                        <span className="count-badge">
                                          {
                                            medalhas.length
                                          }
                                        </span>

                                        <div className="tooltip">
                                          {medalhas.map(
                                            (
                                              medalha,
                                              idx
                                            ) => (
                                              <div
                                                key={
                                                  idx
                                                }
                                              >
                                                🏅{" "}
                                                {
                                                  medalha
                                                }
                                              </div>
                                            )
                                          )}
                                        </div>

                                      </div>
                                    ) : (
                                      <span className="muted-zero">
                                        0
                                      </span>
                                    )}
                                  </td>

                                  <td>
                                    <StatusPill
                                      status={
                                        m.status
                                      }
                                    />
                                  </td>

                                </tr>
                              );
                            }
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>
                );
              }
            )}

          </section>
        </>
      )}

      {/* =====================================================
          ABA ROCAM
      ===================================================== */}

      {aba === "rocam" && (
        <section className="hierarchy-content rocam-content">

          {/* =================================================
              COMANDO / SUBCOMANDO ROCAM
          ================================================= */}

          {[
            {
              chave: "comando",
              badge: "COMANDO ROCAM",
              titulo: "Comando ROCAM",
              qualifClasse: "comando",
              lista: rocamFiltrada.comando
            },
            {
              chave: "subcomando",
              badge: "SUBCOMANDO ROCAM",
              titulo: "Subcomando ROCAM",
              qualifClasse: "subcomando",
              lista: rocamFiltrada.subcomando
            }
          ].map((grupo) => (
            <div
              key={grupo.chave}
              className={`category-block rocam-block ${grupo.chave}`}
            >
              <div className="category-header">
                <div>
                  <span className="category-badge rocam-badge">
                    {grupo.badge}
                  </span>
                  <h2>
                    {grupo.titulo}{" "}
                    <small>({grupo.lista.length})</small>
                  </h2>
                </div>
              </div>

              <div className="hierarchy-table-wrapper">
                <table className="hierarchy-table rocam-table">
                  <thead>
                    <tr>
                      <th>Funcional</th>
                      <th>Nome</th>
                      <th>Patente</th>
                      <th>Função</th>
                      <th>Qualificação</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.lista.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="hierarchy-empty">
                          Nenhum policial neste grupo.
                        </td>
                      </tr>
                    ) : (
                      grupo.lista.map((m, i) => (
                        <tr key={m._id || m.funcional || i}>
                          <td>{m.funcional || "-"}</td>
                          <td>{m.nome || "-"}</td>
                          <td>
                            <PatenteCell patente={m.patente} />
                          </td>
                          <td>{m.funcao || "-"}</td>
                          <td>
                            <span
                              className={`rocam-qualification ${grupo.qualifClasse}`}
                            >
                              {grupo.titulo}
                            </span>
                          </td>
                          <td>
                            <StatusPill status={m.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* =================================================
              BRAÇAL ROCAM
          ================================================= */}

          <div className="category-block rocam-block bracal">

            <div className="category-header">

              <div>

                <span className="category-badge rocam-badge">
                  BRAÇAL ROCAM
                </span>

                <h2>
                  Braçais ROCAM{" "}

                  <small>
                    (
                    {
                      rocamFiltrada
                        .bracais
                        .length
                    }
                    )
                  </small>
                </h2>

              </div>

            </div>

            <div className="hierarchy-table-wrapper">

              <table className="hierarchy-table rocam-table">

                <thead>
                  <tr>
                    <th>
                      Funcional
                    </th>

                    <th>
                      Nome
                    </th>

                    <th>
                      Patente
                    </th>

                    <th>
                      Função
                    </th>

                    <th>
                      Qualificação
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {rocamFiltrada.bracais.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="hierarchy-empty"
                      >
                        Nenhum Braçal ROCAM encontrado.
                      </td>
                    </tr>
                  ) : (
                    rocamFiltrada.bracais.map(
                      (m, i) => (
                        <tr
                          key={
                            m._id ||
                            m.funcional ||
                            i
                          }
                        >

                          <td>
                            {m.funcional ||
                              "-"}
                          </td>

                          <td>
                            {m.nome ||
                              "-"}
                          </td>

                          <td>
                            <PatenteCell
                              patente={
                                m.patente
                              }
                            />
                          </td>

                          <td>
                            {m.funcao ||
                              "-"}
                          </td>

                          <td>
                            <span className="rocam-qualification bracal">
                              Braçal ROCAM
                            </span>
                          </td>

                          <td>
                            <StatusPill
                              status={
                                m.status
                              }
                            />
                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

          {/* =================================================
              ESTAGIÁRIO ROCAM
          ================================================= */}

          <div className="category-block rocam-block estagiario">

            <div className="category-header">

              <div>

                <span className="category-badge rocam-badge estagiario">
                  ESTÁGIO ROCAM
                </span>

                <h2>
                  Estagiários ROCAM{" "}

                  <small>
                    (
                    {
                      rocamFiltrada
                        .estagiarios
                        .length
                    }
                    )
                  </small>
                </h2>

              </div>

            </div>

            <div className="hierarchy-table-wrapper">

              <table className="hierarchy-table rocam-table">

                <thead>
                  <tr>
                    <th>
                      Funcional
                    </th>

                    <th>
                      Nome
                    </th>

                    <th>
                      Patente
                    </th>

                    <th>
                      Função
                    </th>

                    <th>
                      Qualificação
                    </th>

                    <th>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {rocamFiltrada.estagiarios.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="hierarchy-empty"
                      >
                        Nenhum Estagiário ROCAM encontrado.
                      </td>
                    </tr>
                  ) : (
                    rocamFiltrada.estagiarios.map(
                      (m, i) => (
                        <tr
                          key={
                            m._id ||
                            m.funcional ||
                            i
                          }
                        >

                          <td>
                            {m.funcional ||
                              "-"}
                          </td>

                          <td>
                            {m.nome ||
                              "-"}
                          </td>

                          <td>
                            <PatenteCell
                              patente={
                                m.patente
                              }
                            />
                          </td>

                          <td>
                            {m.funcao ||
                              "-"}
                          </td>

                          <td>
                            <span className="rocam-qualification estagiario">
                              Estagiário ROCAM
                            </span>
                          </td>

                          <td>
                            <StatusPill
                              status={
                                m.status
                              }
                            />
                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </section>
      )}

    </div>
  );
}