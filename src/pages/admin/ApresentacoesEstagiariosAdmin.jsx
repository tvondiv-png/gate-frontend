import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const badgeClass = (status) => {
  if (status === "Validado") return "success";
  if (status === "Rejeitado") return "danger";
  return "warning";
};

const formatarDataHora = (valor) => {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
};

export default function ApresentacoesEstagiariosAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");

  const load = async () => {
    try {
      const res = await api.get("/api/apresentacoes-estagiarios/admin");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar apresentações.");
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return items.filter((item) => {
      const okStatus = statusFiltro === "todos" ? true : item.status === statusFiltro;

      const texto = [
        item.nomeEstagiario,
        item.funcionalEstagiario,
        item.patenteEstagiario,
        item.nomeApresentador,
        item.nomeValidador
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = termo ? texto.includes(termo) : true;

      return okStatus && okBusca;
    });
  }, [items, busca, statusFiltro]);

  const resumo = useMemo(() => {
    return {
      total: items.length,
      pendentes: items.filter((i) => i.status === "Enviado").length,
      validados: items.filter((i) => i.status === "Validado").length,
      rejeitados: items.filter((i) => i.status === "Rejeitado").length
    };
  }, [items]);

  const validar = async (id) => {
    try {
      setLoading(true);
      await api.post(`/api/apresentacoes-estagiarios/${id}/validar`);
      await load();
      setSelecionado(null);
      setComentario("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao validar apresentação.");
    } finally {
      setLoading(false);
    }
  };

  const rejeitar = async (id) => {
    if (!comentario.trim()) {
      toast.warning("Informe o motivo da rejeição.");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/apresentacoes-estagiarios/${id}/rejeitar`, {
        comentario
      });
      await load();
      setSelecionado(null);
      setComentario("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao rejeitar apresentação.");
    } finally {
      setLoading(false);
    }
  };

  const excluir = async (id) => {
    if (!(await confirm({ tone: "danger", message: "Deseja excluir esta apresentação?" }))) return;

    try {
      await api.delete(`/api/apresentacoes-estagiarios/${id}`);
      await load();

      if (selecionado?._id === id) {
        setSelecionado(null);
        setComentario("");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao excluir apresentação.");
    }
  };

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Apresentações de Estagiários</h1>
          <p>Validação administrativa das apresentações realizadas no sistema.</p>
        </div>

        <button className="admin-module-btn blue" onClick={load}>
          Recarregar
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Enviadas</small>
          <strong>{resumo.pendentes}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Validadas</small>
          <strong>{resumo.validados}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Rejeitadas</small>
          <strong>{resumo.rejeitados}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-grid-3">
          <input
            className="admin-module-input"
            placeholder="Buscar por estagiário, funcional, patente ou apresentador"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value="Enviado">Enviado</option>
            <option value="Validado">Validado</option>
            <option value="Rejeitado">Rejeitado</option>
          </select>

          <button
            className="admin-module-btn"
            onClick={() => {
              setBusca("");
              setStatusFiltro("todos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Lista de apresentações</h2>
            <span>Total filtrado: {filtrados.length}</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Estagiário</th>
                <th>Funcional</th>
                <th>Patente</th>
                <th>Data</th>
                <th>Status</th>
                <th>Apresentador</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Nenhuma apresentação encontrada.
                  </td>
                </tr>
              ) : (
                filtrados.map((item) => (
                  <tr key={item._id}>
                    <td>{item.nomeEstagiario || "-"}</td>
                    <td>{item.funcionalEstagiario || "-"}</td>
                    <td>{item.patenteEstagiario || "-"}</td>
                    <td>{formatarDataHora(item.dataApresentacao)}</td>
                    <td>
                      <span className={`admin-module-badge ${badgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.nomeApresentador || "-"}</td>
                    <td>
                      <div className="admin-module-actions" style={{ marginTop: 0 }}>
                        <button
                          className="admin-module-btn"
                          onClick={() => {
                            setSelecionado(item);
                            setComentario(item.comentarioAdmin || "");
                          }}
                        >
                          Ver
                        </button>

                        <button
                          className="admin-module-btn danger"
                          onClick={() => excluir(item._id)}
                        >
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

      {selecionado && (
        <div className="admin-module-modal-backdrop" onClick={() => setSelecionado(null)}>
          <div className="admin-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-module-section-title">
              <div>
                <h2>Detalhes da apresentação</h2>
                <span>
                  {selecionado.patenteEstagiario} {selecionado.nomeEstagiario} (
                  {selecionado.funcionalEstagiario})
                </span>
              </div>
            </div>

            <div className="admin-module-kv-grid">
              <div className="admin-module-kv">
                <small>Status</small>
                <div>{selecionado.status || "-"}</div>
              </div>

              <div className="admin-module-kv">
                <small>Data da apresentação</small>
                <div>{formatarDataHora(selecionado.dataApresentacao)}</div>
              </div>

              <div className="admin-module-kv">
                <small>Apresentador</small>
                <div>{selecionado.nomeApresentador || "-"}</div>
              </div>

              <div className="admin-module-kv">
                <small>Validador</small>
                <div>{selecionado.nomeValidador || "-"}</div>
              </div>

              <div className="admin-module-kv">
                <small>Data da validação</small>
                <div>{formatarDataHora(selecionado.dataValidacao)}</div>
              </div>
            </div>

            <div className="admin-module-section" style={{ padding: 14 }}>
              <strong>Observação do usuário</strong>
              <p style={{ marginTop: 10 }}>{selecionado.observacao || "-"}</p>
            </div>

            <div className="admin-module-section" style={{ padding: 14 }}>
              <strong>Comentário administrativo</strong>
              <textarea
                className="admin-module-textarea"
                style={{ marginTop: 10, minHeight: 100 }}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Motivo da rejeição ou comentário interno"
                disabled={selecionado.status !== "Enviado"}
              />
            </div>

            <div className="admin-module-actions">
              {selecionado.status === "Enviado" && (
                <>
                  <button
                    className="admin-module-btn green"
                    onClick={() => validar(selecionado._id)}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Validar"}
                  </button>

                  <button
                    className="admin-module-btn danger"
                    onClick={() => rejeitar(selecionado._id)}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Rejeitar"}
                  </button>
                </>
              )}

              <button
                className="admin-module-btn blue"
                onClick={() => setSelecionado(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}