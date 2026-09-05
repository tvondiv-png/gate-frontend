import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

const CATEGORIAS = [
  { value: "OFICIAIS_SUPERIORES", label: "Oficiais Superiores" },
  { value: "OFICIAIS_INTERMEDIARIOS", label: "Oficiais Intermediários" },
  { value: "OFICIAIS_SUBALTERNOS", label: "Oficiais Subalternos" },
  { value: "PRACAS_ESPECIAIS", label: "Praças Especiais" },
  { value: "PRACAS_GRADUADAS", label: "Praças Graduadas" },
  { value: "PRACAS", label: "Praças" },
  { value: "ESTAGIARIOS", label: "Estagiários" }
];

const formatarDataHora = (data) => {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
};

export default function ComandoComunicados() {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [destino, setDestino] = useState("todos");
  const [categoria, setCategoria] = useState("");
  const [funcionais, setFuncionais] = useState("");
  const [prioridade, setPrioridade] = useState("MEDIA");
  const [exigeCiencia, setExigeCiencia] = useState(true);
  const [loading, setLoading] = useState(false);

  const [historicoComum, setHistoricoComum] = useState([]);
  const [filtroHistorico, setFiltroHistorico] = useState("todos");

  const [detalheAberto, setDetalheAberto] = useState(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  const carregarHistorico = async () => {
    try {
      const res = await api.get("/api/comando/comunicado");
      setHistoricoComum(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
      setHistoricoComum([]);
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  const limpar = () => {
    setTitulo("");
    setMensagem("");
    setDestino("todos");
    setCategoria("");
    setFuncionais("");
    setPrioridade("MEDIA");
    setExigeCiencia(true);
  };

  const validar = () => {
    if (!titulo.trim()) {
      alert("Informe o título.");
      return false;
    }

    if (!mensagem.trim()) {
      alert("Informe a mensagem.");
      return false;
    }

    if (destino === "categoria" && !categoria) {
      alert("Selecione a categoria.");
      return false;
    }

    if (destino === "funcionais" && !funcionais.trim()) {
      alert("Informe os funcionais.");
      return false;
    }

    return true;
  };

  const enviar = async () => {
    if (!validar()) return;

    try {
      setLoading(true);

      const payload = {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
        destino,
        prioridade,
        exigeCiencia
      };

      if (destino === "categoria") payload.categoria = categoria;
      if (destino === "funcionais") {
        payload.funcionais = funcionais
          .split(",")
          .map((x) => Number(x.trim()))
          .filter(Boolean);
      }

      const res = await api.post("/api/comando/comunicado", payload);
      alert(res.data?.message || "Comunicado enviado com sucesso.");

      limpar();
      await carregarHistorico();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao enviar comunicado.");
    } finally {
      setLoading(false);
    }
  };

  const encerrarComum = async (id) => {
    try {
      await api.patch(`/api/comando/comunicado/${id}/encerrar`);
      await carregarHistorico();
      if (detalheAberto?.comunicado?._id === id) {
        setDetalheAberto(null);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao encerrar comunicado.");
    }
  };

  const abrirDetalhe = async (id) => {
    try {
      setLoadingDetalhe(true);
      const res = await api.get(`/api/comando/comunicado/${id}/detalhe`);
      setDetalheAberto(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao abrir detalhe.");
    } finally {
      setLoadingDetalhe(false);
    }
  };

  const historicoFiltrado = useMemo(() => {
    if (filtroHistorico === "todos") return historicoComum;
    if (filtroHistorico === "ativos") return historicoComum.filter((x) => x.ativo);
    if (filtroHistorico === "encerrados") return historicoComum.filter((x) => !x.ativo);
    return historicoComum;
  }, [historicoComum, filtroHistorico]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Comando • Comunicação Militar</h1>
          <p>Ordens, comunicados e controle de ciência em tempo real.</p>
        </div>

        <button className="admin-module-btn blue" onClick={carregarHistorico}>
          Recarregar histórico
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Comunicados ativos</small>
          <strong>{historicoComum.filter((x) => x.ativo).length}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Total enviados</small>
          <strong>{historicoComum.length}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Pendentes de ciência</small>
          <strong>
            {historicoComum.reduce((acc, item) => acc + (item.totalPendentes || 0), 0)}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Ciências registradas</small>
          <strong>
            {historicoComum.reduce((acc, item) => acc + (item.totalCientes || 0), 0)}
          </strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Nova ordem / comunicado</h2>
            <span>Comunicação visual com rastreio de ciência.</span>
          </div>
        </div>

        <div className="admin-module-grid">
          <input
            className="admin-module-input"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="categoria">Por categoria</option>
            <option value="funcionais">Por funcionais</option>
          </select>
        </div>

        <div className="admin-module-grid-2" style={{ marginTop: 12 }}>
          <select
            className="admin-module-select"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
          >
            <option value="BAIXA">BAIXA</option>
            <option value="MEDIA">MEDIA</option>
            <option value="ALTA">ALTA</option>
            <option value="CRITICA">CRITICA</option>
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={exigeCiencia}
              onChange={(e) => setExigeCiencia(e.target.checked)}
            />
            Exigir ciência do policial
          </label>
        </div>

        {destino === "categoria" && (
          <div style={{ marginTop: 12 }}>
            <select
              className="admin-module-select"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
            >
              <option value="">Selecione a categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {destino === "funcionais" && (
          <div style={{ marginTop: 12 }}>
            <input
              className="admin-module-input"
              placeholder="Funcionais separados por vírgula"
              value={funcionais}
              onChange={(e) => setFuncionais(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <textarea
            className="admin-module-textarea"
            style={{ minHeight: 180 }}
            placeholder="Mensagem"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <div className="admin-module-actions">
          <button className="admin-module-btn green" onClick={enviar} disabled={loading}>
            {loading ? "Enviando..." : "Enviar comunicado"}
          </button>

          <button className="admin-module-btn" onClick={limpar} disabled={loading}>
            Limpar
          </button>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Histórico operacional</h2>
            <span>Acompanhamento de leitura e pendência.</span>
          </div>
        </div>

        <div className="admin-module-grid-3">
          <select
            className="admin-module-select"
            value={filtroHistorico}
            onChange={(e) => setFiltroHistorico(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="ativos">Ativos</option>
            <option value="encerrados">Encerrados</option>
          </select>
        </div>

        <div className="admin-module-table-wrap" style={{ marginTop: 12 }}>
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Prioridade</th>
                <th>Destino</th>
                <th>Para quem foi</th>
                <th>Ativo</th>
                <th>Ciência</th>
                <th>Pendentes</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {historicoFiltrado.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: "center" }}>
                    Nenhum comunicado encontrado.
                  </td>
                </tr>
              ) : (
                historicoFiltrado.map((item) => (
                  <tr key={item._id}>
                    <td>{item.titulo}</td>
                    <td>{item.prioridade}</td>
                    <td>{item.destinoTipo}</td>
                    <td>{item.destinoLabel || "-"}</td>
                    <td>{item.ativo ? "Sim" : "Não"}</td>
                    <td>{item.totalCientes || 0}</td>
                    <td>{item.totalPendentes || 0}</td>
                    <td>{formatarDataHora(item.createdAt)}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button
                        className="admin-module-btn blue"
                        onClick={() => abrirDetalhe(item._id)}
                        disabled={loadingDetalhe}
                      >
                        Detalhes
                      </button>

                      {item.ativo ? (
                        <button
                          className="admin-module-btn danger"
                          onClick={() => encerrarComum(item._id)}
                        >
                          Encerrar
                        </button>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detalheAberto && (
        <section className="admin-module-section">
          <div className="admin-module-section-title">
            <div>
              <h2>Detalhe do comunicado</h2>
              <span>{detalheAberto.comunicado?.titulo}</span>
            </div>

            <button className="admin-module-btn" onClick={() => setDetalheAberto(null)}>
              Fechar
            </button>
          </div>

          <div className="admin-module-summary-grid">
            <div className="admin-module-summary-card">
              <small>Total destino</small>
              <strong>{detalheAberto.totais?.totalDestino || 0}</strong>
            </div>
            <div className="admin-module-summary-card">
              <small>Já deram ciência</small>
              <strong>{detalheAberto.totais?.totalCientes || 0}</strong>
            </div>
            <div className="admin-module-summary-card">
              <small>Pendentes</small>
              <strong>{detalheAberto.totais?.totalPendentes || 0}</strong>
            </div>
            <div className="admin-module-summary-card">
              <small>Destino</small>
              <strong>{detalheAberto.comunicado?.destinoLabel || "-"}</strong>
            </div>
          </div>

          <div className="admin-module-grid-2" style={{ marginTop: 16 }}>
            <div className="admin-module-section" style={{ padding: 14 }}>
              <strong>Já deram ciência</strong>
              <div className="admin-module-table-wrap" style={{ marginTop: 10 }}>
                <table className="admin-module-table">
                  <thead>
                    <tr>
                      <th>Funcional</th>
                      <th>Nome</th>
                      <th>Patente</th>
                      <th>Função</th>
                      <th>Data ciência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalheAberto.jaDeramCiencia?.length ? (
                      detalheAberto.jaDeramCiencia.map((item) => (
                        <tr key={item.funcional}>
                          <td>{item.funcional}</td>
                          <td>{item.nome}</td>
                          <td>{item.patente || "-"}</td>
                          <td>{item.funcao || "-"}</td>
                          <td>{formatarDataHora(item.dataCiencia)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          Ninguém deu ciência ainda.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="admin-module-section" style={{ padding: 14 }}>
              <strong>Pendentes</strong>
              <div className="admin-module-table-wrap" style={{ marginTop: 10 }}>
                <table className="admin-module-table">
                  <thead>
                    <tr>
                      <th>Funcional</th>
                      <th>Nome</th>
                      <th>Patente</th>
                      <th>Função</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalheAberto.pendentes?.length ? (
                      detalheAberto.pendentes.map((item) => (
                        <tr key={item.funcional}>
                          <td>{item.funcional}</td>
                          <td>{item.nome}</td>
                          <td>{item.patente || "-"}</td>
                          <td>{item.funcao || "-"}</td>
                          <td>{item.status || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: "center" }}>
                          Todos já deram ciência.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}