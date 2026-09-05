import { useEffect, useMemo, useState } from "react";
import {
  fetchPenalCodeAdmin,
  createPenalCodeAdmin,
  updatePenalCodeAdmin,
  toggleActivePenalCodeAdmin,
  toggleHighlightPenalCodeAdmin,
  deletePenalCodeAdmin
} from "../../services/penalCodeAdminService";
import { fetchPenalCodeStats } from "../../services/penalCodeService";
import "../../styles/admin-module-premium.css";

const EMPTY_FORM = {
  artigo: "",
  codigo: "",
  titulo: "",
  tipo: "INFRACAO",
  categoria: "",
  descricao: "",
  multa: 0,
  prisaoMeses: 0,
  semFianca: false,
  palavrasChave: "",
  observacoes: "",
  ordem: 0,
  destaque: false,
  ativo: true
};

const badgeClass = (value) => {
  if (value === "CRIME") return "danger";
  if (value === "INFRACAO") return "warning";
  return "neutral";
};

export default function PenalCodeAdmin() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    infracoes: 0,
    crimes: 0,
    semFianca: 0,
    destaques: 0,
    categorias: []
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [ativo, setAtivo] = useState("");
  const [destaqueFiltro, setDestaqueFiltro] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const carregar = async () => {
    try {
      setLoading(true);

      const params = {};
      if (search.trim()) params.q = search.trim();
      if (tipo) params.tipo = tipo;
      if (categoria) params.categoria = categoria;
      if (ativo !== "") params.ativo = ativo;
      if (destaqueFiltro !== "") params.destaque = destaqueFiltro;

      const [lista, resumo] = await Promise.all([
        fetchPenalCodeAdmin(params),
        fetchPenalCodeStats()
      ]);

      setItems(Array.isArray(lista) ? lista : []);
      setStats(
        resumo || {
          total: 0,
          infracoes: 0,
          crimes: 0,
          semFianca: 0,
          destaques: 0,
          categorias: []
        }
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar artigos penais.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const categorias = useMemo(() => {
    return [...new Set(items.map((item) => item.categoria).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR")
    );
  }, [items]);

  const abrirNovo = () => {
    setEditandoId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const abrirEditar = (item) => {
    setEditandoId(item._id);
    setForm({
      artigo: item.artigo || "",
      codigo: item.codigo || "",
      titulo: item.titulo || "",
      tipo: item.tipo || "INFRACAO",
      categoria: item.categoria || "",
      descricao: item.descricao || "",
      multa: Number(item.multa || 0),
      prisaoMeses: Number(item.prisaoMeses || 0),
      semFianca: !!item.semFianca,
      palavrasChave: Array.isArray(item.palavrasChave) ? item.palavrasChave.join(", ") : "",
      observacoes: Array.isArray(item.observacoes) ? item.observacoes.join(", ") : "",
      ordem: Number(item.ordem || 0),
      destaque: !!item.destaque,
      ativo: item.ativo !== false
    });
    setModalOpen(true);
  };

  const salvar = async () => {
    try {
      if (!form.artigo || !form.codigo || !form.titulo || !form.tipo || !form.categoria || !form.descricao) {
        alert("Preencha artigo, código, título, tipo, categoria e descrição.");
        return;
      }

      setSaving(true);

      const payload = {
        ...form,
        multa: Number(form.multa || 0),
        prisaoMeses: Number(form.prisaoMeses || 0),
        ordem: Number(form.ordem || 0)
      };

      if (editandoId) {
        await updatePenalCodeAdmin(editandoId, payload);
        alert("Artigo atualizado com sucesso.");
      } else {
        await createPenalCodeAdmin(payload);
        alert("Artigo criado com sucesso.");
      }

      setModalOpen(false);
      setEditandoId(null);
      setForm(EMPTY_FORM);
      await carregar();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erro ao salvar artigo.");
    } finally {
      setSaving(false);
    }
  };

  const alternarAtivo = async (id) => {
    try {
      await toggleActivePenalCodeAdmin(id);
      await carregar();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erro ao alterar status.");
    }
  };

  const alternarDestaque = async (id) => {
    try {
      await toggleHighlightPenalCodeAdmin(id);
      await carregar();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erro ao alterar destaque.");
    }
  };

  const excluir = async (id) => {
    if (!window.confirm("Deseja realmente excluir este artigo?")) return;

    try {
      await deletePenalCodeAdmin(id);
      alert("Artigo excluído com sucesso.");
      await carregar();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erro ao excluir artigo.");
    }
  };

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Código Penal — Administração</h1>
          <p>Painel dinâmico de gestão dos artigos penais exibidos no painel do usuário.</p>
        </div>

        <div className="admin-module-actions" style={{ marginTop: 0 }}>
          <button className="admin-module-btn blue" onClick={carregar}>
            Recarregar
          </button>
          <button className="admin-module-btn green" onClick={abrirNovo}>
            Novo artigo
          </button>
        </div>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>{stats.total || 0}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Infrações</small>
          <strong>{stats.infracoes || 0}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Crimes</small>
          <strong>{stats.crimes || 0}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Sem fiança</small>
          <strong>{stats.semFianca || 0}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Destaques</small>
          <strong>{stats.destaques || 0}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Filtros</h2>
            <span>Refine a consulta administrativa dos artigos.</span>
          </div>
        </div>

        <div className="admin-module-grid">
          <input
            className="admin-module-input"
            placeholder="Buscar por artigo, código, título, descrição ou categoria"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="INFRACAO">Infração</option>
            <option value="CRIME">Crime</option>
          </select>

          <select
            className="admin-module-select"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            className="admin-module-select"
            value={ativo}
            onChange={(e) => setAtivo(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>

          <select
            className="admin-module-select"
            value={destaqueFiltro}
            onChange={(e) => setDestaqueFiltro(e.target.value)}
          >
            <option value="">Todos os destaques</option>
            <option value="true">Somente destaque</option>
            <option value="false">Sem destaque</option>
          </select>
        </div>

        <div className="admin-module-actions">
          <button className="admin-module-btn" onClick={carregar}>
            Aplicar filtros
          </button>

          <button
            className="admin-module-btn blue"
            onClick={() => {
              setSearch("");
              setTipo("");
              setCategoria("");
              setAtivo("");
              setDestaqueFiltro("");
            }}
          >
            Limpar
          </button>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Artigos cadastrados</h2>
            <span>Total exibido: {items.length}</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Artigo</th>
                <th>Código</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Multa</th>
                <th>Prisão</th>
                <th>Fiança</th>
                <th>Destaque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    Carregando artigos...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ textAlign: "center" }}>
                    Nenhum artigo encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.artigo}</td>
                    <td>{item.codigo}</td>
                    <td>{item.titulo}</td>
                    <td>
                      <span className={`admin-module-badge ${badgeClass(item.tipo)}`}>
                        {item.tipo}
                      </span>
                    </td>
                    <td>{item.categoria}</td>
                    <td>
                      {Number(item.multa || 0).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL"
                      })}
                    </td>
                    <td>{item.prisaoMeses ? `${item.prisaoMeses} meses` : "—"}</td>
                    <td>
                      <span className={`admin-module-badge ${item.semFianca ? "danger" : "success"}`}>
                        {item.semFianca ? "Sem fiança" : "Permitida"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-module-badge ${item.destaque ? "warning" : "neutral"}`}>
                        {item.destaque ? "Sim" : "Não"}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-module-badge ${item.ativo ? "success" : "danger"}`}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="admin-module-actions" style={{ marginTop: 0 }}>
                        <button className="admin-module-btn" onClick={() => abrirEditar(item)}>
                          Editar
                        </button>
                        <button className="admin-module-btn blue" onClick={() => alternarDestaque(item._id)}>
                          Destaque
                        </button>
                        <button className="admin-module-btn" onClick={() => alternarAtivo(item._id)}>
                          {item.ativo ? "Desativar" : "Ativar"}
                        </button>
                        <button className="admin-module-btn danger" onClick={() => excluir(item._id)}>
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="admin-module-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="admin-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-module-section-title">
              <div>
                <h2>{editandoId ? "Editar artigo penal" : "Novo artigo penal"}</h2>
                <span>Esse conteúdo refletirá no painel do usuário.</span>
              </div>
            </div>

            <div className="admin-module-grid">
              <input
                className="admin-module-input"
                placeholder="Artigo"
                value={form.artigo}
                onChange={(e) => setForm((prev) => ({ ...prev, artigo: e.target.value }))}
              />

              <input
                className="admin-module-input"
                placeholder="Código"
                value={form.codigo}
                onChange={(e) => setForm((prev) => ({ ...prev, codigo: e.target.value }))}
              />

              <input
                className="admin-module-input"
                placeholder="Título"
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
              />

              <select
                className="admin-module-select"
                value={form.tipo}
                onChange={(e) => setForm((prev) => ({ ...prev, tipo: e.target.value }))}
              >
                <option value="INFRACAO">Infração</option>
                <option value="CRIME">Crime</option>
              </select>

              <input
                className="admin-module-input"
                placeholder="Categoria"
                value={form.categoria}
                onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
              />

              <input
                className="admin-module-input"
                type="number"
                placeholder="Ordem"
                value={form.ordem}
                onChange={(e) => setForm((prev) => ({ ...prev, ordem: e.target.value }))}
              />

              <input
                className="admin-module-input"
                type="number"
                placeholder="Multa"
                value={form.multa}
                onChange={(e) => setForm((prev) => ({ ...prev, multa: e.target.value }))}
              />

              <input
                className="admin-module-input"
                type="number"
                placeholder="Prisão em meses"
                value={form.prisaoMeses}
                onChange={(e) => setForm((prev) => ({ ...prev, prisaoMeses: e.target.value }))}
              />

              <select
                className="admin-module-select"
                value={String(form.semFianca)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    semFianca: e.target.value === "true"
                  }))
                }
              >
                <option value="false">Com fiança</option>
                <option value="true">Sem fiança</option>
              </select>

              <select
                className="admin-module-select"
                value={String(form.destaque)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    destaque: e.target.value === "true"
                  }))
                }
              >
                <option value="false">Sem destaque</option>
                <option value="true">Em destaque</option>
              </select>

              <select
                className="admin-module-select"
                value={String(form.ativo)}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ativo: e.target.value === "true"
                  }))
                }
              >
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <textarea
                className="admin-module-textarea"
                placeholder="Descrição"
                value={form.descricao}
                onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
              />

              <textarea
                className="admin-module-textarea"
                placeholder="Palavras-chave separadas por vírgula"
                value={form.palavrasChave}
                onChange={(e) => setForm((prev) => ({ ...prev, palavrasChave: e.target.value }))}
              />

              <textarea
                className="admin-module-textarea"
                placeholder="Observações separadas por vírgula"
                value={form.observacoes}
                onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
              />
            </div>

            <div className="admin-module-actions">
              <button className="admin-module-btn green" onClick={salvar} disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>

              <button className="admin-module-btn blue" onClick={() => setModalOpen(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}