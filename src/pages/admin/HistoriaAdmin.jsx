import { useEffect, useState } from "react";
import api from "../../api/api";
import { useToast, useConfirm } from "../../contexts/ToastContext";
import "../../styles/admin-module-premium.css";

export default function HistoriaAdmin() {
  const toast = useToast();
  const confirm = useConfirm();

  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [secoes, setSecoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const carregar = async () => {
    try {
      const res = await api.get("/api/historia");
      setTitulo(res.data?.titulo || "");
      setResumo(res.data?.resumo || "");
      setSecoes(
        Array.isArray(res.data?.secoes)
          ? res.data.secoes.map((s) => ({
              titulo: s.titulo || "",
              corpo: s.corpo || ""
            }))
          : []
      );
    } catch {
      toast.error("Erro ao carregar a história");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSecao = (i, campo, valor) => {
    setSecoes((lista) =>
      lista.map((s, idx) => (idx === i ? { ...s, [campo]: valor } : s))
    );
  };

  const mover = (i, dir) => {
    setSecoes((lista) => {
      const j = i + dir;
      if (j < 0 || j >= lista.length) return lista;
      const nova = [...lista];
      [nova[i], nova[j]] = [nova[j], nova[i]];
      return nova;
    });
  };

  const removerSecao = async (i) => {
    const ok = await confirm({
      title: "Remover seção",
      message: `Remover a seção "${secoes[i].titulo || "sem título"}"?`,
      confirmText: "Remover",
      tone: "danger"
    });
    if (!ok) return;
    setSecoes((lista) => lista.filter((_, idx) => idx !== i));
  };

  const adicionarSecao = () => {
    setSecoes((lista) => [...lista, { titulo: "", corpo: "" }]);
  };

  const salvar = async () => {
    if (!titulo.trim()) {
      toast.warning("Informe o título da página");
      return;
    }
    try {
      setSaving(true);
      const res = await api.put("/api/historia", {
        titulo: titulo.trim(),
        resumo,
        secoes: secoes.filter((s) => s.titulo.trim())
      });
      setSecoes(
        (res.data?.secoes || []).map((s) => ({
          titulo: s.titulo || "",
          corpo: s.corpo || ""
        }))
      );
      toast.success("História atualizada");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const restaurar = async () => {
    const ok = await confirm({
      title: "Restaurar conteúdo padrão",
      message:
        "Isso substitui todo o texto atual pelo conteúdo original do documento institucional. Continuar?",
      confirmText: "Restaurar",
      tone: "danger"
    });
    if (!ok) return;
    try {
      setSaving(true);
      const res = await api.post("/api/historia/restaurar");
      setTitulo(res.data?.titulo || "");
      setResumo(res.data?.resumo || "");
      setSecoes(
        (res.data?.secoes || []).map((s) => ({
          titulo: s.titulo || "",
          corpo: s.corpo || ""
        }))
      );
      toast.success("Conteúdo padrão restaurado");
    } catch {
      toast.error("Erro ao restaurar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-module-page">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>História do Anchieta</h1>
          <p>Edite o conteúdo exibido na página pública /historia.</p>
        </div>
        <button className="admin-module-btn blue" onClick={carregar}>
          ↻ Recarregar
        </button>
      </div>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Cabeçalho</h2>
            <span>Título e texto de abertura.</span>
          </div>
        </div>

        <input
          className="admin-module-input"
          placeholder="Título da página"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <div style={{ marginTop: 12 }}>
          <textarea
            className="admin-module-textarea"
            placeholder="Resumo / parágrafo de abertura"
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            rows={5}
          />
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Seções ({secoes.length})</h2>
            <span>Use uma linha em branco para separar parágrafos.</span>
          </div>
          <button className="admin-module-btn green" onClick={adicionarSecao}>
            + Adicionar seção
          </button>
        </div>

        {secoes.map((s, i) => (
          <div
            key={i}
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10,
              padding: 14,
              marginBottom: 14
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 8
              }}
            >
              <strong style={{ color: "#c9a24d" }}>
                {String(i + 1).padStart(2, "0")}
              </strong>
              <input
                className="admin-module-input"
                style={{ flex: 1 }}
                placeholder="Título da seção"
                value={s.titulo}
                onChange={(e) => setSecao(i, "titulo", e.target.value)}
              />
              <button
                className="admin-module-btn blue"
                onClick={() => mover(i, -1)}
                disabled={i === 0}
              >
                ↑
              </button>
              <button
                className="admin-module-btn blue"
                onClick={() => mover(i, 1)}
                disabled={i === secoes.length - 1}
              >
                ↓
              </button>
              <button
                className="admin-module-btn danger"
                onClick={() => removerSecao(i)}
              >
                Remover
              </button>
            </div>
            <textarea
              className="admin-module-textarea"
              placeholder="Conteúdo da seção"
              value={s.corpo}
              onChange={(e) => setSecao(i, "corpo", e.target.value)}
              rows={10}
            />
          </div>
        ))}

        {secoes.length === 0 && (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>
            Nenhuma seção. Clique em "Adicionar seção".
          </p>
        )}
      </section>

      <div className="admin-module-actions">
        <button
          className="admin-module-btn"
          onClick={salvar}
          disabled={saving}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          className="admin-module-btn danger"
          onClick={restaurar}
          disabled={saving}
        >
          Restaurar conteúdo padrão
        </button>
      </div>
    </div>
  );
}
