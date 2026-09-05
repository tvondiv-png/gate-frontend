import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "../../styles/comando-efetivo.css";

const MINIMO_PATRULHA_MIN = 360;

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

const formatarMinutos = (min) => {
  if (!min) return "0h";

  const h = Math.floor(min / 60);
  const m = min % 60;

  if (!h) return `${m}min`;
  if (!m) return `${h}h`;

  return `${h}h ${m}min`;
};

const badgeHoras = (min) => {
  if ((min || 0) === 0) return "danger";
  if ((min || 0) < MINIMO_PATRULHA_MIN) return "warning";
  return "success";
};

const badgeStatus = (status) => {
  if (status === "Ativo") return "success";
  if (status === "Ausente") return "warning";
  return "danger";
};

const labelCategoria = (categoria) => {
  const labels = {
    OFICIAIS_SUPERIORES: "Oficiais Superiores",
    OFICIAIS_INTERMEDIARIOS: "Oficiais Intermediários",
    OFICIAIS_SUBALTERNOS: "Oficiais Subalternos",
    PRACAS_ESPECIAIS: "Praças Especiais",
    PRACAS_GRADUADAS: "Praças Graduadas",
    PRACAS: "Praças",
    ESTAGIARIOS: "Estagiários"
  };

  return labels[categoria] || categoria || "-";
};

export default function ComandoEfetivo() {
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [fPatente, setFPatente] = useState("");
  const [fFuncao, setFFuncao] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [ordenacao, setOrdenacao] = useState("patente");

  const carregar = async () => {
    try {
      const [resHierarchy, resPatrol] = await Promise.all([
        api.get("/api/hierarchy"),
        api.get("/api/patrol-hours")
      ]);

      const hierarchy = Array.isArray(resHierarchy.data)
        ? resHierarchy.data
        : [];

      const patrol = Array.isArray(resPatrol.data)
        ? resPatrol.data
        : [];

      const mapaPatrol = new Map(
        patrol.map((p) => [
          Number(p.funcional),
          p
        ])
      );

      const combinado = hierarchy.map((u) => {
        const horas = mapaPatrol.get(
          Number(u.funcional)
        );

        return {
          ...u,
          horasSemanaMin:
            horas?.horasSemanaMin || 0,
          horasMesMin:
            horas?.horasMesMin || 0,
          horasSemanaTexto:
            formatarMinutos(
              horas?.horasSemanaMin || 0
            ),
          horasMesTexto:
            formatarMinutos(
              horas?.horasMesMin || 0
            ),
          ausenciaPatrulhamento:
            horas?.ausenciaPatrulhamento ||
            "normal",
          observacaoAusencia:
            horas?.observacaoAusencia ||
            ""
        };
      });

      setLista(combinado);
    } catch (err) {
      console.error(
        "Erro ao carregar efetivo:",
        err
      );

      setLista([]);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const patentes = useMemo(() => {
    return [
      ...new Set(
        lista
          .map((u) => u.patente)
          .filter(Boolean)
      )
    ].sort((a, b) => {
      const ordemA =
        ORDEM_PATENTES[a] || 999;

      const ordemB =
        ORDEM_PATENTES[b] || 999;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(a).localeCompare(
        String(b),
        "pt-BR"
      );
    });
  }, [lista]);

  const funcoes = useMemo(() => {
    return [
      ...new Set(
        lista
          .map((u) => u.funcao)
          .filter(Boolean)
      )
    ].sort((a, b) =>
      String(a).localeCompare(
        String(b),
        "pt-BR"
      )
    );
  }, [lista]);

  const categoriasLista = useMemo(() => {
    return [
      ...new Set(
        lista
          .map((u) => u.categoria)
          .filter(Boolean)
      )
    ].sort((a, b) =>
      String(a).localeCompare(
        String(b),
        "pt-BR"
      )
    );
  }, [lista]);

  const cardsCategoria = useMemo(() => {
    return {
      oficiaisSuperiores:
        lista.filter(
          (u) =>
            u.categoria ===
            "OFICIAIS_SUPERIORES"
        ).length,

      oficiaisIntermediarios:
        lista.filter(
          (u) =>
            u.categoria ===
            "OFICIAIS_INTERMEDIARIOS"
        ).length,

      oficiaisSubalternos:
        lista.filter(
          (u) =>
            u.categoria ===
            "OFICIAIS_SUBALTERNOS"
        ).length,

      pracasEspeciais:
        lista.filter(
          (u) =>
            u.categoria ===
            "PRACAS_ESPECIAIS"
        ).length,

      pracasGraduadas:
        lista.filter(
          (u) =>
            u.categoria ===
            "PRACAS_GRADUADAS"
        ).length,

      pracas:
        lista.filter(
          (u) =>
            u.categoria === "PRACAS"
        ).length,

      estagiarios:
        lista.filter(
          (u) =>
            u.categoria === "ESTAGIARIOS"
        ).length
    };
  }, [lista]);

  const filtrados = useMemo(() => {
    let dados = [...lista].filter((u) => {
      const texto = [
        u.nome,
        u.funcional,
        u.patente,
        u.funcao,
        u.categoria,
        u.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!busca ||
          texto.includes(
            busca.toLowerCase()
          )) &&
        (!fPatente ||
          u.patente === fPatente) &&
        (!fFuncao ||
          u.funcao === fFuncao) &&
        (!fStatus ||
          u.status === fStatus) &&
        (!fCategoria ||
          u.categoria === fCategoria)
      );
    });

    dados.sort((a, b) => {
      if (ordenacao === "patente") {
        const ordemA =
          ORDEM_PATENTES[
            a.patente
          ] || 999;

        const ordemB =
          ORDEM_PATENTES[
            b.patente
          ] || 999;

        if (ordemA !== ordemB) {
          return ordemA - ordemB;
        }

        return String(
          a.nome
        ).localeCompare(
          String(b.nome),
          "pt-BR"
        );
      }

      if (ordenacao === "nome") {
        return String(
          a.nome
        ).localeCompare(
          String(b.nome),
          "pt-BR"
        );
      }

      if (
        ordenacao ===
        "horasSemana"
      ) {
        return (
          (b.horasSemanaMin || 0) -
          (a.horasSemanaMin || 0)
        );
      }

      if (
        ordenacao ===
        "horasMes"
      ) {
        return (
          (b.horasMesMin || 0) -
          (a.horasMesMin || 0)
        );
      }

      return 0;
    });

    return dados;
  }, [
    lista,
    busca,
    fPatente,
    fFuncao,
    fStatus,
    fCategoria,
    ordenacao
  ]);

  const resumo = useMemo(() => {
    return {
      total: filtrados.length,

      ativos:
        filtrados.filter(
          (u) =>
            u.status === "Ativo"
        ).length,

      zeroHoras:
        filtrados.filter(
          (u) =>
            (u.horasSemanaMin || 0) ===
            0
        ).length,

      abaixo6h:
        filtrados.filter(
          (u) =>
            (u.horasSemanaMin || 0) >
              0 &&
            (u.horasSemanaMin || 0) <
              MINIMO_PATRULHA_MIN
        ).length
    };
  }, [filtrados]);

  const limparFiltros = () => {
    setBusca("");
    setFPatente("");
    setFFuncao("");
    setFStatus("");
    setFCategoria("");
    setOrdenacao("patente");
  };

  return (
    <div className="efetivo-page">

      {/* ===================================================
          CABEÇALHO
      =================================================== */}

      <section className="efetivo-header">

        <div>

          <span className="efetivo-kicker">
            2º BPChq • ANCHIETA
          </span>

          <h1>
            Efetivo do Batalhão
          </h1>

          <p>
            Visão consolidada do efetivo,
            hierarquia, situação funcional e
            horas de patrulhamento.
          </p>

        </div>

        <button
          className="efetivo-btn"
          type="button"
          onClick={carregar}
        >
          ↻ Atualizar dados
        </button>

      </section>

      {/* ===================================================
          CATEGORIAS
      =================================================== */}

      <section className="efetivo-categorias">

        <div className="efetivo-categoria-card blue">
          <small>
            Oficiais Superiores
          </small>

          <strong>
            {
              cardsCategoria
                .oficiaisSuperiores
            }
          </strong>
        </div>

        <div className="efetivo-categoria-card blue">
          <small>
            Oficiais Intermediários
          </small>

          <strong>
            {
              cardsCategoria
                .oficiaisIntermediarios
            }
          </strong>
        </div>

        <div className="efetivo-categoria-card blue">
          <small>
            Oficiais Subalternos
          </small>

          <strong>
            {
              cardsCategoria
                .oficiaisSubalternos
            }
          </strong>
        </div>

        <div className="efetivo-categoria-card purple">
          <small>
            Praças Especiais
          </small>

          <strong>
            {
              cardsCategoria
                .pracasEspeciais
            }
          </strong>
        </div>

        <div className="efetivo-categoria-card green">
          <small>
            Praças Graduadas
          </small>

          <strong>
            {
              cardsCategoria
                .pracasGraduadas
            }
          </strong>
        </div>

        <div className="efetivo-categoria-card green">
          <small>
            Praças
          </small>

          <strong>
            {
              cardsCategoria
                .pracas
            }
          </strong>
        </div>

        <div className="efetivo-categoria-card red">
          <small>
            Estagiários
          </small>

          <strong>
            {
              cardsCategoria
                .estagiarios
            }
          </strong>
        </div>

      </section>

      {/* ===================================================
          RESUMO
      =================================================== */}

      <section className="efetivo-resumo-grid">

        <div className="efetivo-resumo-card">
          <small>
            Resultado atual
          </small>

          <strong>
            {resumo.total}
          </strong>

          <span>
            Policiais no filtro
          </span>
        </div>

        <div className="efetivo-resumo-card success">
          <small>
            Ativos
          </small>

          <strong>
            {resumo.ativos}
          </strong>

          <span>
            Situação ativa
          </span>
        </div>

        <div className="efetivo-resumo-card danger">
          <small>
            Sem horas na semana
          </small>

          <strong>
            {resumo.zeroHoras}
          </strong>

          <span>
            Necessitam atenção
          </span>
        </div>

        <div className="efetivo-resumo-card warning">
          <small>
            Abaixo da meta
          </small>

          <strong>
            {resumo.abaixo6h}
          </strong>

          <span>
            Menos de 6 horas
          </span>
        </div>

      </section>

      {/* ===================================================
          FILTROS
      =================================================== */}

      <section className="efetivo-filter-panel">

        <div className="efetivo-filter-header">

          <div>
            <h2>
              Filtros do efetivo
            </h2>

            <span>
              Refine a consulta por patente,
              função, situação e categoria.
            </span>
          </div>

          <button
            className="efetivo-btn secondary"
            type="button"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>

        </div>

        <div className="efetivo-filtros">

          <input
            placeholder="Buscar nome, funcional, patente ou função..."
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
          />

          <select
            value={fPatente}
            onChange={(e) =>
              setFPatente(
                e.target.value
              )
            }
          >
            <option value="">
              Todas as patentes
            </option>

            {patentes.map((p) => (
              <option
                key={p}
                value={p}
              >
                {p}
              </option>
            ))}
          </select>

          <select
            value={fFuncao}
            onChange={(e) =>
              setFFuncao(
                e.target.value
              )
            }
          >
            <option value="">
              Todas as funções
            </option>

            {funcoes.map((f) => (
              <option
                key={f}
                value={f}
              >
                {f}
              </option>
            ))}
          </select>

          <select
            value={fStatus}
            onChange={(e) =>
              setFStatus(
                e.target.value
              )
            }
          >
            <option value="">
              Todos os status
            </option>

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

          <select
            value={fCategoria}
            onChange={(e) =>
              setFCategoria(
                e.target.value
              )
            }
          >
            <option value="">
              Todas as categorias
            </option>

            {categoriasLista.map(
              (c) => (
                <option
                  key={c}
                  value={c}
                >
                  {labelCategoria(
                    c
                  )}
                </option>
              )
            )}
          </select>

          <select
            value={ordenacao}
            onChange={(e) =>
              setOrdenacao(
                e.target.value
              )
            }
          >
            <option value="patente">
              Ordem hierárquica
            </option>

            <option value="nome">
              Nome
            </option>

            <option value="horasSemana">
              Horas da semana
            </option>

            <option value="horasMes">
              Horas do mês
            </option>
          </select>

        </div>

      </section>

      {/* ===================================================
          LISTAGEM
      =================================================== */}

      <section className="efetivo-list-panel">

        <div className="efetivo-list-header">

          <div>

            <h2>
              Relação do Efetivo
            </h2>

            <span>
              {filtrados.length} registro(s)
              localizado(s)
            </span>

          </div>

        </div>

        <div className="efetivo-table-wrap">

          <div className="efetivo-table">

            <div className="efetivo-row header">

              <div>
                Funcional
              </div>

              <div>
                Policial
              </div>

              <div>
                Patente
              </div>

              <div>
                Função
              </div>

              <div>
                Status
              </div>

              <div>
                Semana
              </div>

              <div>
                Mês
              </div>

              <div>
                Cursos
              </div>

              <div>
                Medalhas
              </div>

              <div>
                Consulta
              </div>

            </div>

            {filtrados.map((u) => (
              <div
                key={
                  u._id ||
                  u.funcional
                }
                className="efetivo-row"
              >

                <div
                  data-label="Funcional"
                  className="efetivo-functional"
                >
                  {u.funcional}
                </div>

                <div
                  data-label="Policial"
                  className="nome-cell"
                >
                  <strong>
                    {u.nome ||
                      "-"}
                  </strong>

                  <small>
                    {labelCategoria(
                      u.categoria
                    )}
                  </small>
                </div>

                <div data-label="Patente">
                  {u.patente ||
                    "-"}
                </div>

                <div data-label="Função">
                  {u.funcao ||
                    "-"}
                </div>

                <div data-label="Status">

                  <span
                    className={`pill ${badgeStatus(
                      u.status
                    )}`}
                  >
                    {u.status ||
                      "-"}
                  </span>

                </div>

                <div data-label="Horas Semana">

                  <span
                    className={`pill ${badgeHoras(
                      u.horasSemanaMin
                    )}`}
                  >
                    {
                      u.horasSemanaTexto
                    }
                  </span>

                </div>

                <div data-label="Horas Mês">
                  {
                    u.horasMesTexto
                  }
                </div>

                <div data-label="Cursos">
                  {Array.isArray(
                    u.cursos
                  )
                    ? u.cursos.length
                    : 0}
                </div>

                <div data-label="Medalhas">
                  {Array.isArray(
                    u.medalhas
                  )
                    ? u.medalhas
                        .length
                    : 0}
                </div>

                <div data-label="Consulta">

                  <button
                    className="mini-btn"
                    type="button"
                    onClick={() =>
                      navigate(
                        `/comando/consultas?busca=${encodeURIComponent(
                          u.funcional
                        )}`
                      )
                    }
                  >
                    Consultar
                  </button>

                </div>

              </div>
            ))}

            {filtrados.length === 0 && (
              <div className="efetivo-empty">
                Nenhum policial encontrado com os filtros selecionados.
              </div>
            )}

          </div>

        </div>

      </section>

    </div>
  );
}