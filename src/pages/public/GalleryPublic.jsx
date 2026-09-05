import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/gallery-public-premium.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

function getImageUrl(imagem) {
  if (!imagem) return "";

  if (imagem.startsWith("http")) {
    return imagem;
  }

  if (imagem.startsWith("/")) {
    return `${API_URL}${imagem}`;
  }

  return `${API_URL}/uploads/gallery/${imagem}`;
}

export default function GalleryPublic() {
  const [items, setItems] = useState([]);
  const [ativo, setAtivo] = useState(null);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] =
    useState("Todas");

  const [loading, setLoading] =
    useState(true);

  /* =========================================================
     CARREGAR GALERIA
  ========================================================= */

  useEffect(() => {
    const carregar = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          "/api/gallery/public"
        );

        setItems(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(
          "Erro ao carregar galeria pública:",
          err
        );

        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, []);

  /* =========================================================
     CATEGORIAS
  ========================================================= */

  const categorias = useMemo(() => {
    const lista = [
      ...new Set(
        items
          .map(
            (item) =>
              item.categoria
          )
          .filter(Boolean)
      )
    ];

    return [
      "Todas",
      ...lista
    ];
  }, [items]);

  /* =========================================================
     FILTROS
  ========================================================= */

  const filtrados = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    return items.filter((item) => {
      const matchCategoria =
        categoria === "Todas" ||
        item.categoria === categoria;

      const texto = `
        ${item.titulo || ""}
        ${item.descricao || ""}
        ${item.categoria || ""}
      `.toLowerCase();

      const matchBusca =
        !termo ||
        texto.includes(termo);

      return (
        matchCategoria &&
        matchBusca
      );
    });
  }, [
    items,
    busca,
    categoria
  ]);

  /* =========================================================
     FECHAR MODAL COM ESC
  ========================================================= */

  useEffect(() => {
    const fecharEsc = (e) => {
      if (e.key === "Escape") {
        setAtivo(null);
      }
    };

    window.addEventListener(
      "keydown",
      fecharEsc
    );

    return () => {
      window.removeEventListener(
        "keydown",
        fecharEsc
      );
    };
  }, []);

  return (
    <div className="gallery-public-page">

      <div className="gallery-public-container">

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="gallery-public-hero">

          <div className="gallery-public-hero-main">

            <div className="gallery-public-hero-top">

              <img
                src="/anchieta-logo.png"
                alt="2º BPChq Anchieta"
                className="gallery-public-logo"
              />

              <div>
                <span className="gallery-public-kicker">
                  REGISTROS INSTITUCIONAIS
                </span>

                <h1 className="gallery-public-title">
                  Galeria Institucional
                </h1>
              </div>

            </div>

            <p className="gallery-public-description">
              Registros visuais, atividades
              operacionais e conteúdos
              institucionais publicados
              oficialmente pelo 2º BPChq
              Anchieta.
            </p>

          </div>

          <div className="gallery-public-hero-side">

            <div className="gallery-public-stat">

              <small>
                Total de registros
              </small>

              <strong>
                {loading
                  ? "..."
                  : items.length}
              </strong>

              <span>
                Itens publicados
              </span>

            </div>

          </div>

        </section>

        {/* ===================================================
            FILTROS
        =================================================== */}

        <section className="gallery-public-toolbar">

          <div className="gallery-public-search-card">

            <div className="gallery-public-field">

              <label>
                Buscar
              </label>

              <input
                type="text"
                className="gallery-public-input"
                placeholder="Título, descrição ou categoria..."
                value={busca}
                onChange={(e) =>
                  setBusca(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

          <div className="gallery-public-filters-card">

            <div className="gallery-public-field">

              <label>
                Categoria
              </label>

              <select
                className="gallery-public-select"
                value={categoria}
                onChange={(e) =>
                  setCategoria(
                    e.target.value
                  )
                }
              >

                {categorias.map(
                  (cat) => (
                    <option
                      key={cat}
                      value={cat}
                    >
                      {cat}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

        </section>

        {/* ===================================================
            RESUMO
        =================================================== */}

        <div className="gallery-public-summary">

          <span className="gallery-public-chip">
            Exibindo:{" "}
            {loading
              ? "..."
              : filtrados.length}
          </span>

          <span className="gallery-public-chip">
            Categoria: {categoria}
          </span>

        </div>

        {/* ===================================================
            CONTEÚDO
        =================================================== */}

        {loading ? (

          <div className="gallery-public-empty">

            <div className="gallery-spinner" />

            <strong>
              Carregando galeria...
            </strong>

          </div>

        ) : filtrados.length ===
          0 ? (

          <div className="gallery-public-empty">

            <strong>
              Nenhuma imagem encontrada.
            </strong>

            <span>
              Tente alterar a busca ou
              selecionar outra categoria.
            </span>

          </div>

        ) : (

          <div className="gallery-public-grid">

            {filtrados.map(
              (item) => {
                const imageUrl =
                  getImageUrl(
                    item.imagem
                  );

                return (
                  <article
                    key={item._id}
                    className="gallery-public-card"
                    onClick={() =>
                      setAtivo(item)
                    }
                  >

                    <div className="gallery-public-image-wrap">

                      <img
                        src={imageUrl}
                        alt={
                          item.titulo ||
                          "Registro institucional"
                        }
                        className="gallery-public-image"
                      />

                      <div className="gallery-public-image-overlay" />

                      <span className="gallery-public-category">
                        {item.categoria ||
                          "Geral"}
                      </span>

                    </div>

                    <div className="gallery-public-body">

                      <h3>
                        {item.titulo}
                      </h3>

                      <p>
                        {item.descricao ||
                          "Sem descrição cadastrada."}
                      </p>

                      <div className="gallery-public-meta">

                        <span>
                          Publicado
                        </span>

                        <span>
                          {item.createdAt
                            ? new Date(
                                item.createdAt
                              ).toLocaleDateString(
                                "pt-BR"
                              )
                            : "-"}
                        </span>

                      </div>

                      <div className="gallery-public-actions">

                        <button
                          type="button"
                          className="gallery-public-btn"
                          onClick={(e) => {
                            e.stopPropagation();

                            setAtivo(
                              item
                            );
                          }}
                        >
                          Visualizar
                        </button>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>
        )}

      </div>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {ativo && (

        <div
          className="gallery-public-modal"
          onClick={() =>
            setAtivo(null)
          }
        >

          <div
            className="gallery-public-modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="gallery-public-modal-grid">

              <div className="gallery-public-modal-image-wrap">

                <img
                  src={getImageUrl(
                    ativo.imagem
                  )}
                  alt={
                    ativo.titulo ||
                    "Imagem institucional"
                  }
                  className="gallery-public-modal-image"
                />

              </div>

              <div className="gallery-public-modal-body">

                <span className="gallery-public-modal-kicker">
                  {ativo.categoria ||
                    "Geral"}
                </span>

                <h2>
                  {ativo.titulo}
                </h2>

                <p>
                  {ativo.descricao ||
                    "Sem descrição cadastrada."}
                </p>

                <div className="gallery-public-modal-meta">

                  <div>
                    <small>
                      Categoria
                    </small>

                    <strong>
                      {ativo.categoria ||
                        "Geral"}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Publicado em
                    </small>

                    <strong>
                      {ativo.createdAt
                        ? new Date(
                            ativo.createdAt
                          ).toLocaleString(
                            "pt-BR"
                          )
                        : "-"}
                    </strong>
                  </div>

                </div>

                <button
                  type="button"
                  className="gallery-public-close"
                  onClick={() =>
                    setAtivo(null)
                  }
                >
                  Fechar
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}