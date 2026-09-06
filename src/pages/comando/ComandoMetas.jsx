import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useToast, useConfirm } from "../../contexts/ToastContext";
import "../../styles/admin-module-premium.css";
import "../../styles/comando-metas.css";

const CATEGORIAS = [
  { value: "OFICIAIS_SUPERIORES", label: "Oficiais Superiores" },
  { value: "OFICIAIS_INTERMEDIARIOS", label: "Oficiais Intermediários" },
  { value: "OFICIAIS_SUBALTERNOS", label: "Oficiais Subalternos" },
  { value: "PRACAS_ESPECIAIS", label: "Praças Especiais" },
  { value: "PRACAS_GRADUADAS", label: "Praças Graduadas" },
  { value: "PRACAS", label: "Praças" },
  { value: "ESTAGIARIOS", label: "Estagiários" }
];

const FORM_INICIAL = {
  titulo: "",
  descricao: "",
  tipo: "HORAS",
  periodo: "SEMANAL",
  valorAlvo: "",
  alvo: "TODOS",
  categorias: []
};

const fData = (d) => (d ? new Date(d).toLocaleDateString("pt-BR") : "-");
const labelCat = (v) =>
  CATEGORIAS.find((c) => c.value === v)?.label || v;

function Barra({ pct }) {
  const v = Math.max(0, Math.min(100, Number(pct || 0)));
  return (
    <div className="cm-bar">
      <div
        className="cm-bar-fill"
        style={{
          width: `${v}%`,
          background: v >= 100 ? "#3fb950" : "linear-gradient(90deg,#c9a24d,#e6c982)"
        }}
      />
    </div>
  );
}

export default function ComandoMetas() {
  const toast = useToast();
  const confirm = useConfirm();

  const [metas, setMetas] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [detalhe, setDetalhe] = useState(null); // { meta, policiais }
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  const carregar = async () => {
    try {
      const res = await api.get("/api/comando/metas");
      setMetas(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao carregar metas");
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumo = useMemo(
    () => ({
      total: metas.length,
      ativas: metas.filter((m) => m.ativa).length,
      expiradas: metas.filter((m) => m.expirada).length
    }),
    [metas]
  );

  const toggleCategoria = (v) => {
    setForm((f) => ({
      ...f,
      categorias: f.categorias.includes(v)
        ? f.categorias.filter((c) => c !== v)
        : [...f.categorias, v]
    }));
  };

  const criar = async () => {
    if (!form.titulo.trim()) return toast.warning("Informe o título");
    if (!form.valorAlvo || Number(form.valorAlvo) < 1)
      return toast.warning("Informe o valor da meta");
    if (form.alvo === "CATEGORIAS" && form.categorias.length === 0)
      return toast.warning("Selecione ao menos uma categoria");

    try {
      setSalvando(true);
      await api.post("/api/comando/metas", {
        ...form,
        valorAlvo: Number(form.valorAlvo)
      });
      toast.success("Meta publicada. Os policiais foram notificados.");
      setForm(FORM_INICIAL);
      await carregar();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao criar meta");
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (meta) => {
    const ok = await confirm({
      title: meta.expirada
        ? "Prazo encerrado — excluir meta?"
        : "Excluir meta ativa?",
      message: meta.expirada
        ? `O prazo da meta "${meta.titulo}" já encerrou (${fData(
            meta.dataFim
          )}). Deseja excluí-la definitivamente?`
        : `A meta "${meta.titulo}" ainda está no prazo. Excluir mesmo assim?`,
      confirmText: "Excluir",
      tone: "danger"
    });
    if (!ok) return;
    try {
      await api.delete(`/api/comando/metas/${meta._id}`);
      toast.success("Meta excluída");
      if (detalhe?.meta?._id === meta._id) setDetalhe(null);
      await carregar();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao excluir");
    }
  };

  const abrirDetalhe = async (meta) => {
    if (detalhe?.meta?._id === meta._id) {
      setDetalhe(null);
      return;
    }
    try {
      setCarregandoDetalhe(true);
      const res = await api.get(`/api/comando/metas/${meta._id}`);
      setDetalhe(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao carregar detalhe");
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const unidade = form.tipo === "HORAS" ? "horas" : "ações";

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Metas do Comando</h1>
          <p>
            Estabeleça metas de horas de patrulhamento ou de ações, para todos
            ou por categoria, e acompanhe o cumprimento.
          </p>
        </div>
        <button className="admin-module-btn blue" onClick={carregar}>
          ↻ Recarregar
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Ativas</small>
          <strong>{resumo.ativas}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Prazo encerrado</small>
          <strong>{resumo.expiradas}</strong>
        </div>
      </section>

      {/* ============ NOVA META ============ */}
      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Nova meta</h2>
            <span>O período é calculado automaticamente (semana ou mês atual).</span>
          </div>
        </div>

        <div className="admin-module-grid">
          <input
            className="admin-module-input"
            placeholder="Título da meta"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
          />
          <select
            className="admin-module-input"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="HORAS">Horas de patrulhamento</option>
            <option value="ACOES">Ações aprovadas</option>
          </select>
          <select
            className="admin-module-input"
            value={form.periodo}
            onChange={(e) => setForm({ ...form, periodo: e.target.value })}
          >
            <option value="SEMANAL">Por semana</option>
            <option value="MENSAL">Por mês</option>
          </select>
          <input
            className="admin-module-input"
            type="number"
            min="1"
            placeholder={`Meta (${unidade})`}
            value={form.valorAlvo}
            onChange={(e) => setForm({ ...form, valorAlvo: e.target.value })}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            className="admin-module-textarea"
            placeholder="Descrição / orientação (opcional)"
            rows={3}
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={{ marginRight: 16 }}>
            <input
              type="radio"
              name="alvo"
              checked={form.alvo === "TODOS"}
              onChange={() => setForm({ ...form, alvo: "TODOS" })}
            />{" "}
            Todos os policiais
          </label>
          <label>
            <input
              type="radio"
              name="alvo"
              checked={form.alvo === "CATEGORIAS"}
              onChange={() => setForm({ ...form, alvo: "CATEGORIAS" })}
            />{" "}
            Por categoria
          </label>
        </div>

        {form.alvo === "CATEGORIAS" && (
          <div className="cm-cats">
            {CATEGORIAS.map((c) => (
              <label key={c.value} className="cm-cat">
                <input
                  type="checkbox"
                  checked={form.categorias.includes(c.value)}
                  onChange={() => toggleCategoria(c.value)}
                />{" "}
                {c.label}
              </label>
            ))}
          </div>
        )}

        <div className="admin-module-actions">
          <button className="admin-module-btn" onClick={criar} disabled={salvando}>
            {salvando ? "Publicando..." : "Publicar meta"}
          </button>
        </div>
      </section>

      {/* ============ METAS ============ */}
      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Metas publicadas</h2>
            <span>Total: {metas.length}</span>
          </div>
        </div>

        {metas.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Nenhuma meta publicada.</p>
        )}

        <div className="cm-list">
          {metas.map((m) => (
            <div
              key={m._id}
              className={`cm-card ${m.expirada ? "expirada" : ""}`}
            >
              <div className="cm-card-head">
                <div>
                  <strong>{m.titulo}</strong>
                  <div className="cm-tags">
                    <span className="cm-tag">
                      {m.tipo === "HORAS" ? "Horas" : "Ações"}
                    </span>
                    <span className="cm-tag">
                      {m.periodo === "MENSAL" ? "Mensal" : "Semanal"}
                    </span>
                    <span className="cm-tag">
                      Meta: {m.valorAlvo} {m.tipo === "HORAS" ? "h" : "ações"}
                    </span>
                    <span className="cm-tag">
                      {m.alvo === "TODOS"
                        ? "Todos"
                        : m.categorias.map(labelCat).join(", ")}
                    </span>
                    <span className="cm-tag">Prazo: {fData(m.dataFim)}</span>
                  </div>
                </div>
                {m.expirada && (
                  <span className="cm-expirada-badge">⏰ Prazo encerrado</span>
                )}
              </div>

              {m.descricao && <p className="cm-desc">{m.descricao}</p>}

              <div className="cm-resumo">
                <div className="cm-resumo-num">
                  <strong>
                    {m.resumo.atingiram}/{m.resumo.totalAfetados}
                  </strong>
                  <span>atingiram</span>
                </div>
                <div style={{ flex: 1 }}>
                  <Barra pct={m.resumo.percentualMedio} />
                  <small className="cm-muted">
                    {m.resumo.percentualMedio}% de progresso médio
                  </small>
                </div>
              </div>

              {m.expirada && (
                <p className="cm-lembrete">
                  O prazo desta meta encerrou. Ela permanece registrada até o
                  Comando decidir excluí-la.
                </p>
              )}

              <div className="cm-card-actions">
                <button
                  className="admin-module-btn blue"
                  onClick={() => abrirDetalhe(m)}
                >
                  {detalhe?.meta?._id === m._id
                    ? "Ocultar acompanhamento"
                    : "Ver acompanhamento"}
                </button>
                <button
                  className="admin-module-btn danger"
                  onClick={() => excluir(m)}
                >
                  Excluir
                </button>
              </div>

              {detalhe?.meta?._id === m._id && (
                <div className="cm-detalhe">
                  {carregandoDetalhe ? (
                    <p className="cm-muted">Carregando...</p>
                  ) : (
                    <div className="admin-module-table-wrap">
                      <table className="admin-module-table">
                        <thead>
                          <tr>
                            <th>Funcional</th>
                            <th>Policial</th>
                            <th>Categoria</th>
                            <th>Progresso</th>
                            <th>Situação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detalhe.policiais || []).map((p) => (
                            <tr key={p.funcional}>
                              <td>{p.funcional}</td>
                              <td>
                                {p.patente} {p.nome}
                              </td>
                              <td>{labelCat(p.categoria)}</td>
                              <td style={{ minWidth: 160 }}>
                                <Barra pct={p.percentual} />
                                <small className="cm-muted">
                                  {p.atual} / {p.alvo}
                                </small>
                              </td>
                              <td>
                                <span
                                  className={`admin-module-badge ${
                                    p.atingiu ? "success" : "warning"
                                  }`}
                                >
                                  {p.atingiu ? "Atingiu" : `${p.percentual}%`}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {(detalhe.policiais || []).length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: "center" }}>
                                Nenhum policial no alvo desta meta.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
