import { useEffect, useMemo, useState } from "react";
import {
  fetchPenalCode,
  fetchPenalCodeHighlights,
  fetchPenalCodeStats
} from "../../services/penalCodeService";
import "./user-penal-code.css";

import { useToast } from "../../contexts/ToastContext";
const QUICK_FILTERS = [
  { key: "TODOS", label: "Todos" },
  { key: "INFRACAO", label: "Infrações" },
  { key: "CRIME", label: "Crimes" },
  { key: "SEM_FIANCA", label: "Sem fiança" },
  { key: "COM_MULTA", label: "Com multa" },
  { key: "COM_PRISAO", label: "Com prisão" }
];

function formatCurrency(value) {
  if (!value) return "—";
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getSeverity(item) {
  if (item.semFianca || item.prisaoMeses >= 40) {
    return { label: "Gravíssimo", color: "#ef4444" };
  }
  if (item.prisaoMeses >= 15) {
    return { label: "Grave", color: "#f59e0b" };
  }
  if (item.prisaoMeses > 0) {
    return { label: "Médio", color: "#3b82f6" };
  }
  return { label: "Administrativo", color: "#22c55e" };
}

function getRelatedArticles(selected, items) {
  if (!selected) return [];
  return items
    .filter((item) => item._id !== selected._id)
    .filter(
      (item) =>
        item.categoria === selected.categoria ||
        item.tipo === selected.tipo
    )
    .slice(0, 4);
}

export default function UserPenalCode() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("TODOS");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    infracoes: 0,
    crimes: 0,
    semFianca: 0,
    categorias: []
  });
  const [highlights, setHighlights] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("penal_favorites") || "[]");
    } catch {
      return [];
    }
  });

  const [recent, setRecent] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("penal_recent") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("penal_favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem("penal_recent", JSON.stringify(recent));
  }, [recent]);

  const carregarTudo = async () => {
    setLoading(true);
    try {
      const [lista, resumo, destaques] = await Promise.all([
        fetchPenalCode(),
        fetchPenalCodeStats(),
        fetchPenalCodeHighlights()
      ]);

      setItems(lista);
      setStats(resumo || {});
      setHighlights(destaques || []);
      setSelected((prev) => prev || lista[0] || null);
    } catch (err) {
      console.error("Erro ao carregar código penal:", err);
      toast.error("Erro ao carregar código penal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        String(item.artigo || "").toLowerCase().includes(term) ||
        String(item.codigo || "").toLowerCase().includes(term) ||
        String(item.titulo || "").toLowerCase().includes(term) ||
        String(item.descricao || "").toLowerCase().includes(term) ||
        String(item.categoria || "").toLowerCase().includes(term) ||
        (item.palavrasChave || []).some((k) =>
          String(k).toLowerCase().includes(term)
        );

      if (!matchesSearch) return false;

      if (filter === "TODOS") return true;
      if (filter === "INFRACAO") return item.tipo === "INFRACAO";
      if (filter === "CRIME") return item.tipo === "CRIME";
      if (filter === "SEM_FIANCA") return item.semFianca;
      if (filter === "COM_MULTA") return Number(item.multa || 0) > 0;
      if (filter === "COM_PRISAO") return Number(item.prisaoMeses || 0) > 0;

      return true;
    });
  }, [items, search, filter]);

  const favoritosItens = useMemo(() => {
    return items.filter((item) => favorites.includes(item._id));
  }, [favorites, items]);

  const recentesItens = useMemo(() => {
    return recent
      .map((id) => items.find((item) => item._id === id))
      .filter(Boolean)
      .slice(0, 6);
  }, [recent, items]);

  const relatedArticles = useMemo(() => {
    return getRelatedArticles(selected, items);
  }, [selected, items]);

  const handleSelect = (item) => {
    setSelected(item);

    setRecent((prev) => {
      const next = [item._id, ...prev.filter((id) => id !== item._id)];
      return next.slice(0, 10);
    });
  };

  const toggleFavorite = (itemId) => {
    setFavorites((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const selectedSeverity = selected ? getSeverity(selected) : null;

  return (
    <div className="penal-page">
      <section className="penal-hero">
        <div>
          <span className="penal-kicker">CONSULTA OPERACIONAL</span>
          <h1>Código Penal — Brasil Capital</h1>
          <p>
            Consulta oficial de infrações, multas e crimes aplicáveis no RP,
            com busca rápida e detalhamento completo.
          </p>
        </div>

        <div className="penal-summary-grid">
          <div className="penal-summary-card">
            <small>Artigos</small>
            <strong>{stats.total || 0}</strong>
          </div>
          <div className="penal-summary-card">
            <small>Infrações</small>
            <strong>{stats.infracoes || 0}</strong>
          </div>
          <div className="penal-summary-card">
            <small>Crimes</small>
            <strong>{stats.crimes || 0}</strong>
          </div>
          <div className="penal-summary-card">
            <small>Sem fiança</small>
            <strong>{stats.semFianca || 0}</strong>
          </div>
        </div>
      </section>

      <section className="penal-toolbar">
        <div className="penal-search-box">
          <input
            type="text"
            placeholder="Busque por artigo, nome, descrição ou palavra-chave"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="penal-filters">
          {QUICK_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={filter === item.key ? "active" : ""}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="penal-quick-access">
          <strong>Atalhos rápidos</strong>
          <div className="penal-chip-row">
            {highlights.map((item) => (
              <button
                key={item._id}
                type="button"
                className="penal-chip"
                onClick={() => handleSelect(item)}
              >
                {item.artigo} — {item.titulo}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="penal-dashboard-grid">
        <div className="penal-left-column">
          <div className="penal-side-block">
            <div className="penal-side-header">
              <h3>Resultados</h3>
              <span>{filteredItems.length} item(ns)</span>
            </div>

            <div className="penal-list">
              {loading ? (
                <div className="penal-empty-state">Carregando artigos...</div>
              ) : filteredItems.length === 0 ? (
                <div className="penal-empty-state">
                  Nenhum artigo encontrado para a busca/filtro aplicado.
                </div>
              ) : (
                filteredItems.map((item) => {
                  const severity = getSeverity(item);
                  const isFavorite = favorites.includes(item._id);

                  return (
                    <div
                      key={item._id}
                      className={`penal-list-card ${
                        selected?._id === item._id ? "selected" : ""
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="penal-list-top">
                        <div>
                          <span className="penal-article-code">{item.artigo}</span>
                          <h4>{item.titulo}</h4>
                        </div>

                        <button
                          type="button"
                          className={`penal-fav-btn ${isFavorite ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item._id);
                          }}
                        >
                          {isFavorite ? "★" : "☆"}
                        </button>
                      </div>

                      <p>{item.descricao}</p>

                      <div className="penal-list-meta">
                        <span className="penal-badge neutral">{item.tipo}</span>
                        <span className="penal-badge neutral">{item.categoria}</span>
                        {item.semFianca && (
                          <span className="penal-badge danger">Sem fiança</span>
                        )}
                        <span
                          className="penal-badge"
                          style={{
                            borderColor: severity.color,
                            color: severity.color
                          }}
                        >
                          {severity.label}
                        </span>
                      </div>

                      <div className="penal-list-values">
                        <div>
                          <small>Multa</small>
                          <strong>{item.multa ? formatCurrency(item.multa) : "—"}</strong>
                        </div>
                        <div>
                          <small>Prisão</small>
                          <strong>{item.prisaoMeses ? `${item.prisaoMeses} meses` : "—"}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="penal-right-column">
          <div className="penal-side-block">
            <h3>Destaques pessoais</h3>

            <div className="penal-mini-section">
              <strong>Favoritos</strong>
              {favoritosItens.length === 0 ? (
                <p>Nenhum favorito salvo.</p>
              ) : (
                <div className="penal-mini-list">
                  {favoritosItens.slice(0, 5).map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className="penal-mini-item"
                      onClick={() => handleSelect(item)}
                    >
                      {item.artigo} — {item.titulo}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="penal-mini-section">
              <strong>Consultados recentemente</strong>
              {recentesItens.length === 0 ? (
                <p>Nenhum histórico recente.</p>
              ) : (
                <div className="penal-mini-list">
                  {recentesItens.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className="penal-mini-item"
                      onClick={() => handleSelect(item)}
                    >
                      {item.artigo} — {item.titulo}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selected && (
            <div className="penal-detail-panel">
              <div className="penal-detail-header">
                <div>
                  <span className="penal-detail-article">{selected.artigo}</span>
                  <h2>{selected.titulo}</h2>
                </div>

                <button
                  type="button"
                  className={`penal-fav-btn large ${
                    favorites.includes(selected._id) ? "active" : ""
                  }`}
                  onClick={() => toggleFavorite(selected._id)}
                >
                  {favorites.includes(selected._id) ? "★ Favorito" : "☆ Favoritar"}
                </button>
              </div>

              <div className="penal-detail-badges">
                <span className="penal-badge neutral">{selected.tipo}</span>
                <span className="penal-badge neutral">{selected.categoria}</span>
                {selected.semFianca && (
                  <span className="penal-badge danger">Sem fiança</span>
                )}
                {selectedSeverity && (
                  <span
                    className="penal-badge"
                    style={{
                      borderColor: selectedSeverity.color,
                      color: selectedSeverity.color
                    }}
                  >
                    {selectedSeverity.label}
                  </span>
                )}
              </div>

              <div className="penal-detail-grid">
                <div className="penal-detail-box">
                  <small>Multa</small>
                  <strong>
                    {selected.multa ? formatCurrency(selected.multa) : "Não aplicável"}
                  </strong>
                </div>

                <div className="penal-detail-box">
                  <small>Pena</small>
                  <strong>
                    {selected.prisaoMeses
                      ? `${selected.prisaoMeses} meses`
                      : "Sem pena de prisão"}
                  </strong>
                </div>

                <div className="penal-detail-box">
                  <small>Fiança</small>
                  <strong>{selected.semFianca ? "Não aplicável" : "Permitida"}</strong>
                </div>

                <div className="penal-detail-box">
                  <small>Classificação</small>
                  <strong>{selected.tipo === "CRIME" ? "Conduta penal" : "Infração administrativa"}</strong>
                </div>
              </div>

              <div className="penal-detail-text">
                <h4>Descrição legal</h4>
                <p>{selected.descricao}</p>
              </div>

              <div className="penal-detail-text">
                <h4>Palavras-chave operacionais</h4>
                <div className="penal-chip-row">
                  {(selected.palavrasChave || []).map((item) => (
                    <span key={item} className="penal-chip static">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="penal-detail-text">
                <h4>Observações</h4>
                {!selected.observacoes || selected.observacoes.length === 0 ? (
                  <p>Sem observações complementares.</p>
                ) : (
                  <ul>
                    {selected.observacoes.map((obs, index) => (
                      <li key={index}>{obs}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="penal-detail-text">
                <h4>Artigos relacionados</h4>
                <div className="penal-related-grid">
                  {relatedArticles.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      className="penal-related-card"
                      onClick={() => handleSelect(item)}
                    >
                      <strong>{item.artigo}</strong>
                      <span>{item.titulo}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="penal-footer-note">
        <strong>⚠️ Importante</strong>
        <p>
          Este documento é referência in-game para policiais, advogados e cidadãos.
          A aplicação depende do contexto do RP e das regras complementares do servidor.
          Dúvidas devem ser esclarecidas com a administração ou corregedoria.
        </p>
      </section>
    </div>
  );
}