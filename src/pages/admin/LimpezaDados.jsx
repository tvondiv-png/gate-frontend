import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useToast, useConfirm } from "../../contexts/ToastContext";
import "../../styles/admin-module-premium.css";
import "./limpeza-dados.css";

export default function LimpezaDados() {
  const toast = useToast();
  const confirm = useConfirm();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecionadas, setSelecionadas] = useState([]);
  const [textoConfirmacao, setTextoConfirmacao] = useState("");
  const [limpando, setLimpando] = useState(false);
  const [ultimoResultado, setUltimoResultado] = useState(null);

  const carregar = () => {
    setLoading(true);
    api
      .get("/api/superadmin/limpeza-dados")
      .then((res) => setCategorias(res.data?.categorias || []))
      .catch(() => toast.error("Erro ao carregar as contagens de dados"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleCategoria = (chave) => {
    setSelecionadas((prev) =>
      prev.includes(chave) ? prev.filter((c) => c !== chave) : [...prev, chave]
    );
  };

  const selecionarTudo = () => {
    setSelecionadas(categorias.map((c) => c.chave));
  };

  const limparSelecao = () => {
    setSelecionadas([]);
  };

  const totalSelecionado = useMemo(() => {
    return categorias
      .filter((c) => selecionadas.includes(c.chave))
      .reduce((acc, c) => acc + (c.total || 0), 0);
  }, [categorias, selecionadas]);

  const podeLimpar =
    selecionadas.length > 0 && textoConfirmacao.trim() === "LIMPAR" && !limpando;

  const executarLimpeza = async () => {
    const nomes = categorias
      .filter((c) => selecionadas.includes(c.chave))
      .map((c) => c.label)
      .join("\n• ");

    const ok = await confirm({
      tone: "danger",
      message: `Isso vai apagar PERMANENTEMENTE (não dá pra desfazer):\n\n• ${nomes}\n\nUsuários, hierarquia, quadro ROCAM, conteúdo do site e Código Penal NÃO são afetados. Confirma?`
    });

    if (!ok) return;

    try {
      setLimpando(true);
      const res = await api.post("/api/superadmin/limpeza-dados", {
        categorias: selecionadas,
        confirmacao: "LIMPAR"
      });

      setUltimoResultado(res.data?.resultado || null);
      setSelecionadas([]);
      setTextoConfirmacao("");
      toast.success("Limpeza concluída com sucesso");
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao limpar dados");
    } finally {
      setLimpando(false);
    }
  };

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Limpeza de Dados</h1>
          <p>
            Apaga dados operacionais/RP por categoria. Restrito ao superadmin.
          </p>
        </div>
      </div>

      <div className="admin-module-alert danger">
        <strong>Sempre preservado, não importa o que for marcado abaixo:</strong>{" "}
        usuários, hierarquia (patente/função), quadro ROCAM (quem é o quê),
        conteúdo do site (regulamento, história, galeria, slides) e o Código
        Penal cadastrado.
      </div>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Categorias</h2>
            <span>
              {loading
                ? "Carregando..."
                : `${categorias.length} categorias disponíveis`}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="admin-module-btn" type="button" onClick={selecionarTudo}>
              Selecionar tudo
            </button>
            <button className="admin-module-btn" type="button" onClick={limparSelecao}>
              Desmarcar tudo
            </button>
          </div>
        </div>

        {!loading && (
          <div className="ld-lista">
            {categorias.map((cat) => (
              <label key={cat.chave} className="ld-item">
                <input
                  type="checkbox"
                  checked={selecionadas.includes(cat.chave)}
                  onChange={() => toggleCategoria(cat.chave)}
                />
                <span className="ld-item-label">{cat.label}</span>
                <span className="ld-item-total">
                  {cat.total} {cat.total === 1 ? "registro" : "registros"}
                </span>
              </label>
            ))}
          </div>
        )}
      </section>

      {selecionadas.length > 0 && (
        <section className="admin-module-section">
          <div className="admin-module-section-title">
            <div>
              <h2>Confirmar limpeza</h2>
              <span>
                {selecionadas.length} categoria(s) selecionada(s) —{" "}
                {totalSelecionado} registro(s) no total
              </span>
            </div>
          </div>

          <p className="ld-aviso">
            Essa ação é <strong>irreversível</strong>. Digite <strong>LIMPAR</strong>{" "}
            no campo abaixo pra habilitar o botão.
          </p>

          <input
            className="admin-module-input"
            value={textoConfirmacao}
            onChange={(e) => setTextoConfirmacao(e.target.value)}
            placeholder='Digite "LIMPAR" pra confirmar'
          />

          <div style={{ marginTop: 14 }}>
            <button
              className="admin-module-btn danger"
              type="button"
              disabled={!podeLimpar}
              onClick={executarLimpeza}
            >
              {limpando ? "Limpando..." : "Limpar dados selecionados"}
            </button>
          </div>
        </section>
      )}

      {ultimoResultado && (
        <section className="admin-module-section">
          <div className="admin-module-section-title">
            <div>
              <h2>Resultado da última limpeza</h2>
            </div>
          </div>

          <pre className="ld-resultado">
            {JSON.stringify(ultimoResultado, null, 2)}
          </pre>
        </section>
      )}
    </div>
  );
}
