import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const statusBadgeClass = (status) => {
  if (status === "Validado") return "success";
  if (status === "Revisao") return "warning";
  if (status === "Rejeitado") return "danger";
  return "info";
};

const formatarDataHora = (valor) => {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
};

export default function AvaliacaoEstagiosAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [busca, setBusca] = useState("");

  const load = async () => {
    try {
      const res = await api.get("/api/avaliacoes-estagio/admin");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao carregar avaliações.");
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return items.filter((item) => {
      const okStatus =
        filtroStatus === "todos" ? true : item.status === filtroStatus;

      const texto = [
        item.estagiario?.nome,
        item.estagiario?.funcional,
        item.estagiario?.patente,
        item.avaliador?.nome,
        item.viatura
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = termo ? texto.includes(termo) : true;

      return okStatus && okBusca;
    });
  }, [items, filtroStatus, busca]);

  const resumo = useMemo(() => {
    return {
      total: items.length,
      pendentes: items.filter((i) => i.status === "Pendente").length,
      revisao: items.filter((i) => i.status === "Revisao").length,
      validadas: items.filter((i) => i.status === "Validado").length
    };
  }, [items]);

  const aprovar = async (id) => {
    try {
      setLoading(true);
      await api.post(`/api/avaliacoes-estagio/${id}/validar`, {
        comentarioCoordenador: comentario
      });
      await load();
      setSelecionado(null);
      setComentario("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao validar avaliação.");
    } finally {
      setLoading(false);
    }
  };

  const revisar = async (id) => {
    if (!comentario.trim()) {
      toast.warning("Informe o comentário para revisão.");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/avaliacoes-estagio/${id}/revisao`, {
        comentarioCoordenador: comentario
      });
      await load();
      setSelecionado(null);
      setComentario("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao enviar para revisão.");
    } finally {
      setLoading(false);
    }
  };

  const excluir = async (id) => {
    if (!(await confirm({ tone: "danger", message: "Deseja excluir esta avaliação?" }))) return;

    try {
      await api.delete(`/api/avaliacoes-estagio/${id}/admin`);
      await load();
      if (selecionado?._id === id) {
        setSelecionado(null);
        setComentario("");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao excluir avaliação.");
    }
  };

  const zerarHistorico = async () => {
    if (!(await confirm({ tone: "danger", message: "Deseja zerar todo o histórico das avaliações?" }))) return;

    try {
      await api.delete("/api/avaliacoes-estagio/admin/historico");
      await load();
      toast.success("Histórico zerado com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao zerar histórico.");
    }
  };

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Avaliações de Estágio</h1>
          <p>Valide, revise e acompanhe o histórico das avaliações de estagiários.</p>
        </div>

        <div className="admin-module-actions" style={{ marginTop: 0 }}>
          <button className="admin-module-btn blue" onClick={load}>
            Recarregar
          </button>
          <button className="admin-module-btn danger" onClick={zerarHistorico}>
            Zerar histórico
          </button>
        </div>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Pendentes</small>
          <strong>{resumo.pendentes}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Revisão</small>
          <strong>{resumo.revisao}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Validadas</small>
          <strong>{resumo.validadas}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-grid-3">
          <input
            className="admin-module-input"
            placeholder="Buscar por nome, funcional, patente, avaliador ou viatura"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Revisao">Revisão</option>
            <option value="Validado">Validado</option>
          </select>

          <button
            className="admin-module-btn"
            onClick={() => {
              setBusca("");
              setFiltroStatus("todos");
            }}
          >
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Lista de avaliações</h2>
            <span>Total filtrado: {listaFiltrada.length}</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Estagiário</th>
                <th>Funcional</th>
                <th>Status</th>
                <th>Avaliador</th>
                <th>Data</th>
                <th>Viatura</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((item) => (
                  <tr key={item._id}>
                    <td>{item.estagiario?.nome || "-"}</td>
                    <td>{item.estagiario?.funcional || "-"}</td>
                    <td>
                      <span className={`admin-module-badge ${statusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>{item.avaliador?.nome || "-"}</td>
                    <td>{item.data || "-"}</td>
                    <td>{item.viatura || "-"}</td>
                    <td>
                      <div className="admin-module-actions" style={{ marginTop: 0 }}>
                        <button
                          className="admin-module-btn"
                          onClick={() => {
                            setSelecionado(item);
                            setComentario(item.comentarioCoordenador || "");
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
                <h2>Detalhes da avaliação</h2>
                <span>
                  {selecionado.estagiario?.patente} {selecionado.estagiario?.nome} (
                  {selecionado.estagiario?.funcional})
                </span>
              </div>
            </div>

            <div className="admin-module-kv-grid">
              <div className="admin-module-kv">
                <small>Status</small>
                <div>{selecionado.status}</div>
              </div>
              <div className="admin-module-kv">
                <small>Data</small>
                <div>{selecionado.data || "-"}</div>
              </div>
              <div className="admin-module-kv">
                <small>Horário</small>
                <div>
                  {selecionado.horarioInicial || "-"} → {selecionado.horarioFinal || "-"}
                </div>
              </div>
              <div className="admin-module-kv">
                <small>Viatura</small>
                <div>{selecionado.viatura || "-"}</div>
              </div>
              <div className="admin-module-kv">
                <small>Avaliador</small>
                <div>{selecionado.avaliador?.nome || "-"}</div>
              </div>
              <div className="admin-module-kv">
                <small>Criada em</small>
                <div>{formatarDataHora(selecionado.createdAt)}</div>
              </div>
            </div>

            <div className="admin-module-card-list">
              <div className="admin-module-card">
                <strong>Conduta de patrulha</strong>
                <p>{selecionado.condutaPatrulha || "-"}</p>
              </div>
              <div className="admin-module-card">
                <strong>Postura</strong>
                <p>{selecionado.postura || "-"}</p>
              </div>
              <div className="admin-module-card">
                <strong>Proatividade</strong>
                <p>{selecionado.proatividade || "-"}</p>
              </div>
              <div className="admin-module-card">
                <strong>Pontos fortes</strong>
                <p>{selecionado.pontosFortes || "-"}</p>
              </div>
              <div className="admin-module-card">
                <strong>O que pode melhorar</strong>
                <p>{selecionado.podeMelhorar || "-"}</p>
              </div>
              <div className="admin-module-card">
                <strong>Observações</strong>
                <p>{selecionado.observacoes || "-"}</p>
              </div>
            </div>

            <div className="admin-module-section" style={{ padding: 14 }}>
              <strong>Comentário do coordenador</strong>
              <textarea
                className="admin-module-textarea"
                style={{ marginTop: 10, minHeight: 110 }}
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Informe observação, revisão ou orientação"
              />
            </div>

            {Array.isArray(selecionado.historico) && selecionado.historico.length > 0 && (
              <div className="admin-module-section" style={{ padding: 14 }}>
                <strong>Histórico</strong>
                <div className="admin-module-card-list" style={{ marginTop: 12 }}>
                  {selecionado.historico.map((h, index) => (
                    <div key={index} className="admin-module-card">
                      <strong>{h.acao || "Registro"}</strong>
                      <p>{formatarDataHora(h.data)}</p>
                      <p>
                        {[h.autorPatente, h.autorNome].filter(Boolean).join(" ")}
                      </p>
                      <p>{h.comentario || "-"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-module-actions">
              {(selecionado.status === "Pendente" || selecionado.status === "Revisao") && (
                <>
                  <button
                    className="admin-module-btn green"
                    onClick={() => aprovar(selecionado._id)}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Validar"}
                  </button>

                  <button
                    className="admin-module-btn"
                    onClick={() => revisar(selecionado._id)}
                    disabled={loading}
                  >
                    Enviar para revisão
                  </button>
                </>
              )}

              <button
                className="admin-module-btn danger"
                onClick={() => excluir(selecionado._id)}
              >
                Excluir
              </button>

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