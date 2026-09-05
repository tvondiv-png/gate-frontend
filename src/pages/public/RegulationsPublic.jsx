import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/regulations.css";
import "../../styles/animations.css";

const normalizarCategoria = (categoria) => {
  if (categoria === "ROCAM") {
    return "ROCAM";
  }

  return "GERAL";
};

export default function RegulationsPublic() {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [aba, setAba] = useState("GERAL");
  const [busca, setBusca] = useState("");

  /* =========================================================
     CARREGAR
  ========================================================= */

  useEffect(() => {
    api
      .get("/api/regulations/public")
      .then((res) => {
        setRegs(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      })
      .catch((err) => {
        console.error(
          "Erro ao carregar regulamentos:",
          err
        );

        setRegs([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /* =========================================================
     RESUMO
  ========================================================= */

  const resumo = useMemo(() => {
    return {
      total: regs.length,

      gerais: regs.filter(
        (r) =>
          normalizarCategoria(
            r.categoria
          ) === "GERAL"
      ).length,

      rocam: regs.filter(
        (r) =>
          normalizarCategoria(
            r.categoria
          ) === "ROCAM"
      ).length
    };
  }, [regs]);

  /* =========================================================
     FILTRAR
  ========================================================= */

  const filtrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    return regs.filter((reg) => {
      const categoria =
        normalizarCategoria(
          reg.categoria
        );

      if (categoria !== aba) {
        return false;
      }

      if (!termo) {
        return true;
      }

      const texto = `
        ${reg.titulo || ""}
        ${reg.descricao || ""}
        ${reg.conteudo || ""}
      `.toLowerCase();

      return texto.includes(
        termo
      );
    });
  }, [
    regs,
    aba,
    busca
  ]);

  return (
    <div className="regulations-page page-enter">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="regulations-hero">

        <div className="regulations-hero-main">

          <div className="regulations-hero-top">

            <img
              src="/anchieta-logo.png"
              alt="2º BPChq Anchieta"
              className="regulations-logo"
            />

            <div>
              <span className="regulations-kicker">
                DOCUMENTAÇÃO INSTITUCIONAL
              </span>

              <h1>
                Regulamentos Oficiais
              </h1>
            </div>

          </div>

          <p>
            Consulte normas, diretrizes e
            regulamentos publicados oficialmente
            pelo 2º BPChq Anchieta.
          </p>

        </div>

        <div className="regulations-hero-side">

          <div className="regulations-stat-card">

            <small>
              Total publicado
            </small>

            <strong>
              {loading
                ? "..."
                : resumo.total}
            </strong>

            <span>
              Documentos disponíveis
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <section className="regulations-summary">

        <div className="regulations-summary-card">

          <small>
            Regulamentos Gerais
          </small>

          <strong>
            {loading
              ? "..."
              : resumo.gerais}
          </strong>

        </div>

        <div className="regulations-summary-card rocam">

          <small>
            Regulamentos ROCAM
          </small>

          <strong>
            {loading
              ? "..."
              : resumo.rocam}
          </strong>

        </div>

      </section>

      {/* =====================================================
          TOOLBAR
      ===================================================== */}

      <section className="regulations-toolbar">

        <div className="regulations-tabs">

          <button
            type="button"
            className={`regulations-tab ${
              aba === "GERAL"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setAba("GERAL")
            }
          >
            Regulamentos Gerais

            <span>
              {resumo.gerais}
            </span>
          </button>

          <button
            type="button"
            className={`regulations-tab rocam ${
              aba === "ROCAM"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setAba("ROCAM")
            }
          >
            Regulamentos ROCAM

            <span>
              {resumo.rocam}
            </span>
          </button>

        </div>

        <div className="regulations-search-wrap">

          <input
            type="text"
            className="regulations-search"
            placeholder={
              aba === "ROCAM"
                ? "Buscar no Regulamento ROCAM..."
                : "Buscar regulamento..."
            }
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
          />

        </div>

      </section>

      {/* =====================================================
          TÍTULO DA ÁREA
      ===================================================== */}

      <section
        className={`regulations-category-header ${
          aba === "ROCAM"
            ? "rocam"
            : ""
        }`}
      >

        <div>

          <span>
            {aba === "ROCAM"
              ? "NORMAS ESPECIALIZADAS"
              : "DOCUMENTAÇÃO GERAL"}
          </span>

          <h2>
            {aba === "ROCAM"
              ? "Regulamentos ROCAM"
              : "Regulamentos Gerais"}
          </h2>

          <p>
            {aba === "ROCAM"
              ? "Normas, critérios, diretrizes e regulamentações específicas relacionadas à ROCAM."
              : "Normas institucionais, regulamentos internos e demais documentos gerais do batalhão."}
          </p>

        </div>

      </section>

      {/* =====================================================
          CONTEÚDO
      ===================================================== */}

      {loading ? (

        <div className="regulations-empty-box">

          <div className="regulations-spinner" />

          <strong>
            Carregando regulamentos...
          </strong>

        </div>

      ) : filtrados.length === 0 ? (

        <div className="regulations-empty-box">

          <strong>
            Nenhum regulamento encontrado.
          </strong>

          <span>
            {busca
              ? "Tente alterar os termos da busca."
              : aba === "ROCAM"
              ? "Nenhum Regulamento ROCAM foi publicado."
              : "Nenhum regulamento geral foi publicado."}
          </span>

        </div>

      ) : (

        <div className="regulations-list">

          {filtrados.map(
            (reg, i) => {

              const categoria =
                normalizarCategoria(
                  reg.categoria
                );

              return (

                <article
                  key={reg._id}
                  className={`regulation-doc ${
                    categoria ===
                    "ROCAM"
                      ? "rocam"
                      : ""
                  } fade-up`}
                >

                  <header className="doc-header">

                    <div className="doc-header-main">

                      <span className="doc-badge">
                        {categoria ===
                        "ROCAM"
                          ? "ROCAM"
                          : "REGULAMENTO"}
                      </span>

                      <h2>
                        {reg.titulo}
                      </h2>

                    </div>

                    <div className="doc-number">
                      {String(
                        i + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </div>

                  </header>

                  {reg.descricao && (

                    <p className="desc">
                      {reg.descricao}
                    </p>

                  )}

                  {reg.conteudo && (

                    <div className="regulation-content">

                      <pre className="conteudo">
                        {reg.conteudo}
                      </pre>

                    </div>

                  )}

                  {reg.arquivoPdf && (

                    <div className="regulation-actions">

                      <a
                        href={
                          reg.arquivoPdf
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-link"
                      >
                        📄 Abrir Documento Oficial
                      </a>

                    </div>

                  )}

                  <footer className="regulation-footer">

                    <span>
                      {categoria ===
                      "ROCAM"
                        ? "Regulamentação ROCAM"
                        : "Regulamentação Institucional"}
                    </span>

                    <span>
                      {reg.createdAt
                        ? new Date(
                            reg.createdAt
                          ).toLocaleDateString(
                            "pt-BR"
                          )
                        : "-"}
                    </span>

                  </footer>

                </article>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}