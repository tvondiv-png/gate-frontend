import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "./admin-actions.css";

const META_ACOES = 6;
const PROXIMO_META = 4;

export default function AdminActions() {
  const [tab, setTab] = useState("pendentes");
  const [pendentes, setPendentes] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [metrics, setMetrics] = useState({
    resumo: [],
    rankingMensal: [],
    totais: {
      acoesValidas30Dias: 0,
      acoesValidasMes: 0
    },
    alertas: { metaConcluida: [], proximoDaMeta: [] }
  });

  const [generalStats, setGeneralStats] = useState({
    resumo: { total: 0, ganhas: 0, perdidas: 0 },
    porNumero: [],
    porDia: []
  });

  const [statsFiltro, setStatsFiltro] = useState({
    busca: "",
    dataInicial: "",
    dataFinal: "",
    resultado: ""
  });

  const [detalheAberto, setDetalheAberto] = useState(false);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const [acaoSelecionada, setAcaoSelecionada] = useState(null);

  const [clearForm, setClearForm] = useState({
    userId: "",
    userLabel: "",
    dataInicial: "",
    dataFinal: "",
    motivoExclusao: ""
  });
  
  const [rules, setRules] = useState([]);
const [usuarios, setUsuarios] = useState([]);

const [formAdmin, setFormAdmin] = useState({
  tipoAcao: "",
  resultado: "GANHA",
  numeroAcao: "",
  dataAcao: "",
  horaAcao: "",
  observacoes: "",
  participantes: [],
  contabilizarMeta: true
});
  const [metaFilter, setMetaFilter] = useState("TODOS");

  const carregar = async () => {
    try {
      const [resPendentes, resHistorico, resMetrics, resGeneralStats, resRules, resUsuarios] =
  await Promise.all([
    api.get("/api/admin/actions/pending"),
    api.get("/api/admin/actions/history"),
    api.get("/api/admin/actions/metrics"),
    api.get("/api/admin/actions/stats/general"),
    api.get("/api/actions/rules"),
    api.get("/api/hierarchy/public/list")
  ]);

      setPendentes(Array.isArray(resPendentes.data) ? resPendentes.data : []);
      setHistorico(Array.isArray(resHistorico.data) ? resHistorico.data : []);
      setRules(Array.isArray(resRules.data) ? resRules.data : []);
      setUsuarios(Array.isArray(resUsuarios.data) ? resUsuarios.data : []);
      

      setMetrics(
        resMetrics.data || {
          resumo: [],
          rankingMensal: [],
          totais: {
            acoesValidas30Dias: 0,
            acoesValidasMes: 0
          },
          alertas: { metaConcluida: [], proximoDaMeta: [] }
        }
      );

      setGeneralStats(
        resGeneralStats.data || {
          resumo: { total: 0, ganhas: 0, perdidas: 0 },
          porNumero: [],
          porDia: []
        }
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar painel de ações");
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const alterarMeta = async (id, contabilizarMeta) => {
    try {
      await api.patch(`/api/admin/actions/${id}/contabilizar-meta`, {
        contabilizarMeta
      });

      alert(
        contabilizarMeta
          ? "Ação incluída na contagem da meta."
          : "Ação removida da contagem da meta."
      );

      if (acaoSelecionada?._id === id) {
        setAcaoSelecionada((prev) =>
          prev ? { ...prev, contabilizarMeta } : prev
        );
      }

      await carregar();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao alterar contabilidade da meta.");
    }
  };

  const abrirDetalhes = async (id) => {
    try {
      setDetalheLoading(true);
      setDetalheAberto(true);

      const res = await api.get(`/api/admin/actions/${id}`);
      setAcaoSelecionada(res.data || null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao carregar detalhes da ação");
      setDetalheAberto(false);
      setAcaoSelecionada(null);
    } finally {
      setDetalheLoading(false);
    }
  };

  const fecharDetalhes = () => {
    setDetalheAberto(false);
    setAcaoSelecionada(null);
  };

  const aprovar = async (id) => {
    try {
      await api.patch(`/api/admin/actions/${id}/approve`, {
        observacaoAdmin:
          acaoSelecionada?.contabilizarMeta === false
            ? "Ação validada pelo administrador, mantida somente no histórico"
            : "Ação validada pelo administrador",
        contabilizarMeta: acaoSelecionada?.contabilizarMeta !== false
      });

      alert("Ação aprovada com sucesso");
      fecharDetalhes();
      carregar();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao aprovar");
    }
  };

  const rejeitar = async (id) => {
    const motivo = window.prompt("Informe o motivo da rejeição:");
    if (!motivo) return;

    try {
      await api.patch(`/api/admin/actions/${id}/reject`, {
        motivoRejeicao: motivo,
        observacaoAdmin: ""
      });

      alert("Ação rejeitada com sucesso");
      fecharDetalhes();
      carregar();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao rejeitar");
    }
  };

  const excluirHistorico = async (id) => {
    const motivo = window.prompt("Motivo da exclusão do histórico:");
    if (!motivo) return;

    try {
      await api.patch(`/api/admin/actions/${id}/exclude-history`, {
        motivoExclusao: motivo
      });

      alert("Histórico excluído com sucesso");
      carregar();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao excluir histórico");
    }
  };

  const limparMetricas = async () => {
    const confirmar = window.confirm(
      "Tem certeza que deseja remover esses dados das métricas? Essa ação removerá os registros da soma, ranking e histórico visível."
    );

    if (!confirmar) return;

    try {
      const payload = {
        userId: clearForm.userId || undefined,
        dataInicial: clearForm.dataInicial || undefined,
        dataFinal: clearForm.dataFinal || undefined,
        motivoExclusao:
          clearForm.motivoExclusao || "Removido das métricas pelo administrador"
      };

      const res = await api.post("/api/admin/actions/metrics/clear", payload);

      alert(res.data?.message || "Dados removidos das métricas com sucesso");

      setClearForm({
        userId: "",
        userLabel: "",
        dataInicial: "",
        dataFinal: "",
        motivoExclusao: ""
      });

      carregar();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao limpar métricas");
    }
  };

  const statusColor = (status) => {
    if (status === "APROVADA") return "#22c55e";
    if (status === "REJEITADA") return "#ef4444";
    if (status === "REENVIADA") return "#3b82f6";
    if (status === "PENDENTE") return "#f59e0b";
    return "#94a3b8";
  };

  const formatarData = (valor) => {
    if (!valor) return "-";
    return new Date(valor).toLocaleDateString("pt-BR");
  };

  const formatarDataHora = (valor) => {
    if (!valor) return "-";
    return new Date(valor).toLocaleString("pt-BR");
  };

  const getMetaVisual = (item) => {
    const total = Number(item?.totalValidas30Dias || 0);
    const percentual = Math.min(100, Math.round((total / META_ACOES) * 100));

    if (total >= META_ACOES) {
      return {
        key: "META_ATINGIDA",
        label: "Meta Atingida",
        color: "#22c55e",
        dot: "🟢",
        percentual
      };
    }

    if (total >= PROXIMO_META) {
      return {
        key: "PROXIMO_DA_META",
        label: "Próximo da Meta",
        color: "#f59e0b",
        dot: "🟡",
        percentual
      };
    }

    return {
      key: "ABAIXO_DA_META",
      label: "Abaixo da Meta",
      color: "#ef4444",
      dot: "🔴",
      percentual
    };
  };

  const resumoTop = useMemo(() => {
    return {
      pendentes: pendentes.length,
      historico: historico.length,
      metaConcluida: metrics.alertas?.metaConcluida?.length || 0,
      proximoDaMeta: metrics.alertas?.proximoDaMeta?.length || 0,
      totalValidas30Dias: metrics.totais?.acoesValidas30Dias || 0,
      totalValidasMes: metrics.totais?.acoesValidasMes || 0
    };
  }, [pendentes, historico, metrics]);

  const ranking30Dias = useMemo(() => {
    const lista = Array.isArray(metrics.resumo) ? metrics.resumo : [];

    if (metaFilter === "TODOS") return lista;

    if (metaFilter === "SOMENTE_6") {
      return lista.filter((item) => Number(item.totalValidas30Dias || 0) >= 6);
    }

    return lista.filter((item) => getMetaVisual(item).key === metaFilter);
  }, [metrics, metaFilter]);

  const rankingMensal = useMemo(() => {
    return Array.isArray(metrics.rankingMensal) ? metrics.rankingMensal : [];
  }, [metrics]);

  const porDiaFiltrado = useMemo(() => {
    return (generalStats.porDia || []).filter((item) => {
      const data = item.data || "";

      const okDataInicial = statsFiltro.dataInicial
        ? data >= statsFiltro.dataInicial
        : true;

      const okDataFinal = statsFiltro.dataFinal
        ? data <= statsFiltro.dataFinal
        : true;

      const okResultado =
        statsFiltro.resultado === "GANHA"
          ? item.ganhas > 0
          : statsFiltro.resultado === "PERDIDA"
          ? item.perdidas > 0
          : true;

      return okDataInicial && okDataFinal && okResultado;
    });
  }, [generalStats, statsFiltro]);

  const porNumeroFiltrado = useMemo(() => {
    const termo = statsFiltro.busca.trim().toLowerCase();

    return (generalStats.porNumero || []).filter((item) => {
      const texto = [item.numeroAcao, item.tipo, item.categoria]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = termo ? texto.includes(termo) : true;

      const okResultado =
        statsFiltro.resultado === "GANHA"
          ? item.ganhas > 0
          : statsFiltro.resultado === "PERDIDA"
          ? item.perdidas > 0
          : true;

      return okBusca && okResultado;
    });
  }, [generalStats, statsFiltro]);

  const limparFiltroStats = () => {
    setStatsFiltro({
      busca: "",
      dataInicial: "",
      dataFinal: "",
      resultado: ""
    });
  };

  const cardStyle = {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 16,
    padding: 16,
    background: "rgba(255,255,255,0.02)"
  };

  const miniCardStyle = {
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 14,
    padding: 14,
    background: "rgba(255,255,255,0.02)"
  };

  return (
    <div className="admin-actions-wrap" style={{ padding: 20 }}>
      <div className="admin-actions-topbar">
        <div>
          <h1 style={{ margin: 0 }}>Registro de Ações</h1>
          <p style={{ margin: "6px 0 0 0", opacity: 0.8 }}>
            Gestão de validação, histórico, metas e desempenho operacional.
          </p>
        </div>

        <button onClick={carregar}>Recarregar dados</button>
      </div>

      <section className="admin-actions-summary-grid">
        <div style={miniCardStyle}>
          <small>Solicitações pendentes</small>
          <div className="admin-actions-summary-value">{resumoTop.pendentes}</div>
        </div>

        <div style={miniCardStyle}>
          <small>Histórico validado</small>
          <div className="admin-actions-summary-value">{resumoTop.historico}</div>
        </div>

        <div style={miniCardStyle}>
          <small>Meta concluída</small>
          <div className="admin-actions-summary-value">{resumoTop.metaConcluida}</div>
        </div>

        <div style={miniCardStyle}>
          <small>Próximos da meta</small>
          <div className="admin-actions-summary-value">{resumoTop.proximoDaMeta}</div>
        </div>

        <div style={miniCardStyle}>
          <small>Ações válidas — 30 dias</small>
          <div className="admin-actions-summary-value">{resumoTop.totalValidas30Dias}</div>
        </div>

        <div style={miniCardStyle}>
          <small>Ações válidas — mês</small>
          <div className="admin-actions-summary-value">{resumoTop.totalValidasMes}</div>
        </div>
      </section>

      <div className="admin-actions-tabs">
        <button onClick={() => setTab("pendentes")}>Solicitações</button>
        <button onClick={() => setTab("historico")}>Histórico</button>
        <button onClick={() => setTab("metricas")}>Métricas</button>
        <button onClick={() => setTab("estatisticas")}>Estatísticas Gerais</button>
        <button onClick={() => setTab("criar")}>Cadastrar Ação</button>
      </div>

      {tab === "pendentes" && (
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Solicitações de validação</h3>

          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding="10" border="1">
              <thead>
                <tr>
                  <th>Registrante</th>
                  <th>Tipo</th>
                  <th>Resultado</th>
                  <th>Número Ação</th>
                  <th>Data</th>
                  <th>Participantes</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {pendentes.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center" }}>
                      Nenhuma solicitação pendente.
                    </td>
                  </tr>
                ) : (
                  pendentes.map((item) => (
                    <tr key={item._id}>
                      <td>
                        {item.registrante?.patente} {item.registrante?.nome}
                      </td>
                      <td>{item.nomeTipoAcao}</td>
                      <td>{item.resultado}</td>
                      <td>{item.numeroAcao}</td>
                      <td>{formatarData(item.dataAcao)}</td>
                      <td>{item.participantes?.length || 0}</td>
                      <td>
                        <span
                          className="admin-status-badge"
                          style={{
                            borderColor: statusColor(item.status),
                            color: statusColor(item.status)
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => abrirDetalhes(item._id)}>
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "historico" && (
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Histórico validado</h3>

          <div style={{ overflowX: "auto" }}>
            <table width="100%" cellPadding="10" border="1">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Resultado</th>
                  <th>Número Ação</th>
                  <th>Data Ação</th>
                  <th>Registrante</th>
                  <th>Participantes</th>
                  <th>Contabilidade</th>
                  <th>Aprovado em</th>
                  <th>Ações</th>
                </tr>
              </thead>

              <tbody>
                {historico.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      Nenhum registro validado.
                    </td>
                  </tr>
                ) : (
                  historico.map((item) => (
                    <tr key={item._id}>
                      <td>{item.nomeTipoAcao}</td>
                      <td>{item.resultado}</td>
                      <td>{item.numeroAcao}</td>
                      <td>{formatarData(item.dataAcao)}</td>
                      <td>
                        {item.registrante?.patente} {item.registrante?.nome}
                      </td>
                      <td>{item.participantes?.length || 0}</td>
                      <td>
                        <span
                          className="admin-status-badge"
                          style={{
                            borderColor:
                              item.contabilizarMeta === false ? "#f59e0b" : "#22c55e",
                            color:
                              item.contabilizarMeta === false ? "#f59e0b" : "#22c55e"
                          }}
                        >
                          {item.contabilizarMeta === false
                            ? "Somente Histórico"
                            : "Conta na Meta"}
                        </span>
                      </td>
                      <td>{formatarDataHora(item.aprovadoEm)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button onClick={() => abrirDetalhes(item._id)}>
                            Ver detalhes
                          </button>

                          <button
                            onClick={() =>
                              alterarMeta(item._id, item.contabilizarMeta === false)
                            }
                          >
                            {item.contabilizarMeta === false
                              ? "Contar na Meta"
                              : "Não Contar na Meta"}
                          </button>

                          <button onClick={() => excluirHistorico(item._id)}>
                            Excluir Histórico
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
      )}

      {tab === "metricas" && (
        <div style={{ display: "grid", gap: 20 }}>
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Painel de Meta Operacional</h3>

            <div className="admin-actions-alert-grid">
              <div style={miniCardStyle}>
                <strong>🟢 Meta Atingida</strong>
                <div style={{ marginTop: 8 }}>
                  {(metrics.alertas?.metaConcluida || []).length === 0 ? (
                    <p>Nenhum policial concluiu a meta ainda.</p>
                  ) : (
                    metrics.alertas.metaConcluida.map((item) => (
                      <div key={String(item.userId)} style={{ marginBottom: 8 }}>
                        {item.patente} {item.nome} — {item.totalValidas30Dias} ações
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={miniCardStyle}>
                <strong>🟡 Próximos da Meta</strong>
                <div style={{ marginTop: 8 }}>
                  {(metrics.alertas?.proximoDaMeta || []).length === 0 ? (
                    <p>Nenhum policial próximo da meta no momento.</p>
                  ) : (
                    metrics.alertas.proximoDaMeta.map((item) => (
                      <div key={String(item.userId)} style={{ marginBottom: 8 }}>
                        {item.patente} {item.nome} — {item.totalValidas30Dias} ações
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Remover dados das métricas</h3>
            <p style={{ opacity: 0.8 }}>
              Use este painel para retirar registros da contagem, ranking e metas
              sem apagar o documento do banco.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12,
                marginTop: 14
              }}
            >
              <div>
                <label>Policial</label>
                <input
                  className="admin-actions-input"
                  list="lista-policiais-metricas"
                  placeholder="Digite o nome, patente ou funcional"
                  value={clearForm.userLabel || ""}
                  onChange={(e) => {
                    const texto = e.target.value;

                    const encontrado = (metrics.resumo || []).find(
                      (item) =>
                        `${item.patente} ${item.nome} - ${item.funcional}` === texto
                    );

                    setClearForm((prev) => ({
                      ...prev,
                      userLabel: texto,
                      userId: encontrado ? String(encontrado.userId) : ""
                    }));
                  }}
                />

                <datalist id="lista-policiais-metricas">
                  {(metrics.resumo || []).map((item) => (
                    <option
                      key={String(item.userId)}
                      value={`${item.patente} ${item.nome} - ${item.funcional}`}
                    />
                  ))}
                </datalist>
              </div>

              <div>
                <label>Data inicial</label>
                <input
                  type="date"
                  value={clearForm.dataInicial}
                  onChange={(e) =>
                    setClearForm((prev) => ({
                      ...prev,
                      dataInicial: e.target.value
                    }))
                  }
                />
              </div>

              <div>
                <label>Data final</label>
                <input
                  type="date"
                  value={clearForm.dataFinal}
                  onChange={(e) =>
                    setClearForm((prev) => ({
                      ...prev,
                      dataFinal: e.target.value
                    }))
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <label>Motivo</label>
              <textarea
                rows="3"
                value={clearForm.motivoExclusao}
                onChange={(e) =>
                  setClearForm((prev) => ({
                    ...prev,
                    motivoExclusao: e.target.value
                  }))
                }
                placeholder="Informe o motivo da remoção das métricas"
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                className="admin-footer-btn admin-footer-btn-danger"
                onClick={limparMetricas}
              >
                Remover dados das métricas
              </button>
            </div>
          </section>

          <section style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 14
              }}
            >
              <h3 style={{ margin: 0 }}>Ranking operacional — janela válida de 30 dias</h3>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => setMetaFilter("TODOS")}>Todos</button>
                <button onClick={() => setMetaFilter("ABAIXO_DA_META")}>Abaixo da Meta</button>
                <button onClick={() => setMetaFilter("PROXIMO_DA_META")}>Próximo da Meta</button>
                <button onClick={() => setMetaFilter("META_ATINGIDA")}>Meta Atingida</button>
                <button onClick={() => setMetaFilter("SOMENTE_6")}>Somente 6+</button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" border="1">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Funcional</th>
                    <th>Patente</th>
                    <th>Nome</th>
                    <th>Ações Válidas</th>
                    <th>Ganhas</th>
                    <th>Perdidas</th>
                    <th>Aproveitamento</th>
                    <th>Status Meta</th>
                    <th>Progresso</th>
                    <th>Total no Mês</th>
                    <th>Última Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {ranking30Dias.length === 0 ? (
                    <tr>
                      <td colSpan="12" style={{ textAlign: "center" }}>
                        Nenhuma métrica disponível para o filtro selecionado.
                      </td>
                    </tr>
                  ) : (
                    ranking30Dias.map((item, index) => {
                      const meta = getMetaVisual(item);

                      return (
                        <tr key={String(item.userId)}>
                          <td>#{index + 1}</td>
                          <td>{item.funcional}</td>
                          <td>{item.patente}</td>
                          <td>{item.nome}</td>
                          <td>{item.totalValidas30Dias}</td>
                          <td>{item.totalGanhas30Dias}</td>
                          <td>{item.totalPerdidas30Dias}</td>
                          <td>
                            <div className="admin-inline-meta-cell">
                              <strong>{item.aproveitamento}%</strong>
                            </div>
                          </td>
                          <td>
                            <span
                              className="admin-status-badge"
                              style={{
                                borderColor: meta.color,
                                color: meta.color
                              }}
                            >
                              {meta.dot} {meta.label}
                            </span>
                          </td>
                          <td style={{ minWidth: 180 }}>
                            <div className="admin-progress-table-wrap">
                              <div className="admin-progress-bar compact">
                                <div
                                  className="admin-progress-fill"
                                  style={{
                                    width: `${meta.percentual}%`,
                                    background: meta.color
                                  }}
                                />
                              </div>
                              <small>{meta.percentual}%</small>
                            </div>
                          </td>
                          <td>{item.totalMes || 0}</td>
                          <td>{formatarData(item.ultimaAcao)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Ranking mensal</h3>

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" border="1">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Funcional</th>
                    <th>Patente</th>
                    <th>Nome</th>
                    <th>Total no Mês</th>
                    <th>Ganhas no Mês</th>
                    <th>Perdidas no Mês</th>
                    <th>Aproveitamento</th>
                  </tr>
                </thead>

                <tbody>
                  {rankingMensal.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: "center" }}>
                        Nenhum ranking mensal disponível.
                      </td>
                    </tr>
                  ) : (
                    rankingMensal.map((item, index) => {
                      const totalMes = Number(item.totalMes || 0);
                      const ganhasMes = Number(item.ganhasMes || 0);
                      const perdidasMes = Number(item.perdidasMes || 0);
                      const aproveitamentoMes = totalMes
                        ? Math.round((ganhasMes / totalMes) * 100)
                        : 0;

                      return (
                        <tr key={String(item.userId)}>
                          <td>#{index + 1}</td>
                          <td>{item.funcional}</td>
                          <td>{item.patente}</td>
                          <td>{item.nome}</td>
                          <td>{totalMes}</td>
                          <td>{ganhasMes}</td>
                          <td>{perdidasMes}</td>
                          <td>{aproveitamentoMes}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "estatisticas" && (
        <div style={{ display: "grid", gap: 20 }}>
          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Estatísticas Gerais das Ações</h3>
            <p style={{ opacity: 0.8 }}>
              Contagem geral por número da ação e por dia, sem duplicar por policial.
            </p>

            <div className="admin-actions-summary-grid">
              <div style={miniCardStyle}>
                <small>Total de ações</small>
                <div className="admin-actions-summary-value">
                  {generalStats.resumo?.total || 0}
                </div>
              </div>

              <div style={miniCardStyle}>
                <small>Ações ganhas</small>
                <div className="admin-actions-summary-value" style={{ color: "#22c55e" }}>
                  {generalStats.resumo?.ganhas || 0}
                </div>
              </div>

              <div style={miniCardStyle}>
                <small>Ações perdidas</small>
                <div className="admin-actions-summary-value" style={{ color: "#ef4444" }}>
                  {generalStats.resumo?.perdidas || 0}
                </div>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Filtros</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 12
              }}
            >
              <input
                placeholder="Buscar por nº, tipo ou categoria"
                value={statsFiltro.busca}
                onChange={(e) =>
                  setStatsFiltro((prev) => ({ ...prev, busca: e.target.value }))
                }
              />

              <input
                type="date"
                value={statsFiltro.dataInicial}
                onChange={(e) =>
                  setStatsFiltro((prev) => ({ ...prev, dataInicial: e.target.value }))
                }
              />

              <input
                type="date"
                value={statsFiltro.dataFinal}
                onChange={(e) =>
                  setStatsFiltro((prev) => ({ ...prev, dataFinal: e.target.value }))
                }
              />

              <select
                value={statsFiltro.resultado}
                onChange={(e) =>
                  setStatsFiltro((prev) => ({ ...prev, resultado: e.target.value }))
                }
              >
                <option value="">Todos os resultados</option>
                <option value="GANHA">Somente ganhas</option>
                <option value="PERDIDA">Somente perdidas</option>
              </select>
            </div>

            <div style={{ marginTop: 14 }}>
              <button onClick={limparFiltroStats}>Limpar filtros</button>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Resumo por Dia</h3>

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" border="1">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Ganhas</th>
                    <th>Perdidas</th>
                    <th>Aproveitamento</th>
                  </tr>
                </thead>

                <tbody>
                  {porDiaFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center" }}>
                        Nenhum dado encontrado.
                      </td>
                    </tr>
                  ) : (
                    porDiaFiltrado.map((item) => {
                      const aproveitamento = item.total
                        ? Math.round((item.ganhas / item.total) * 100)
                        : 0;

                      return (
                        <tr key={item.data}>
                          <td>{formatarData(item.data)}</td>
                          <td>{item.total}</td>
                          <td>{item.ganhas}</td>
                          <td>{item.perdidas}</td>
                          <td>
                            <strong>{aproveitamento}%</strong>
                            <div className="admin-simple-bar">
                              <div
                                className="admin-simple-bar-fill"
                                style={{ width: `${aproveitamento}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Resumo por Número da Ação</h3>

            <div style={{ overflowX: "auto" }}>
              <table width="100%" cellPadding="10" border="1">
                <thead>
                  <tr>
                    <th>Nº Ação</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Total</th>
                    <th>Ganhas</th>
                    <th>Perdidas</th>
                    <th>Aproveitamento</th>
                  </tr>
                </thead>

                <tbody>
                  {porNumeroFiltrado.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center" }}>
                        Nenhuma ação encontrada.
                      </td>
                    </tr>
                  ) : (
                    porNumeroFiltrado.map((item) => {
                      const aproveitamento = item.total
                        ? Math.round((item.ganhas / item.total) * 100)
                        : 0;

                      return (
                        <tr key={item.numeroAcao}>
                          <td>{item.numeroAcao}</td>
                          <td>{item.tipo}</td>
                          <td>{item.categoria}</td>
                          <td>{item.total}</td>
                          <td>{item.ganhas}</td>
                          <td>{item.perdidas}</td>
                          <td>
                            <strong>{aproveitamento}%</strong>
                            <div className="admin-simple-bar">
                              <div
                                className="admin-simple-bar-fill"
                                style={{ width: `${aproveitamento}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "criar" && (
  <section style={cardStyle}>
    <h3 style={{ marginTop: 0 }}>Cadastrar Ação pelo Administrador</h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 14,
        marginTop: 14
      }}
    >
      <select
        value={formAdmin.tipoAcao}
        onChange={(e) =>
          setFormAdmin((prev) => ({ ...prev, tipoAcao: e.target.value }))
        }
      >
        <option value="">Selecione o tipo de ação</option>
        {rules.map((r) => (
          <option key={r.codigo} value={r.codigo}>
            {r.icone} {r.nome}
          </option>
        ))}
      </select>

      <select
        value={formAdmin.resultado}
        onChange={(e) =>
          setFormAdmin((prev) => ({ ...prev, resultado: e.target.value }))
        }
      >
        <option value="GANHA">GANHA</option>
        <option value="PERDIDA">PERDIDA</option>
      </select>

      <input
        placeholder="Número da ação"
        value={formAdmin.numeroAcao}
        onChange={(e) =>
          setFormAdmin((prev) => ({ ...prev, numeroAcao: e.target.value }))
        }
      />

      <input
        type="date"
        value={formAdmin.dataAcao}
        onChange={(e) =>
          setFormAdmin((prev) => ({ ...prev, dataAcao: e.target.value }))
        }
      />

      <input
        placeholder="Hora da ação opcional"
        value={formAdmin.horaAcao}
        onChange={(e) =>
          setFormAdmin((prev) => ({ ...prev, horaAcao: e.target.value }))
        }
      />
    </div>

    <div style={{ marginTop: 14 }}>
      <textarea
        rows="4"
        placeholder="Observações da ação"
        value={formAdmin.observacoes}
        onChange={(e) =>
          setFormAdmin((prev) => ({ ...prev, observacoes: e.target.value }))
        }
      />
    </div>

    <div style={{ marginTop: 18 }}>
  <h4>Participantes</h4>

  <div
    style={{
      border: "1px solid rgba(201,162,77,0.4)",
      borderRadius: 10,
      maxHeight: 260,
      overflowY: "auto",
      padding: 6,
      background: "rgba(0,0,0,0.3)"
    }}
  >
    {usuarios.map((u) => {
      const userId =
        typeof u.user === "object" && u.user?._id
          ? u.user._id
          : u.user || u._id;

      const selecionado = formAdmin.participantes.includes(userId);

      return (
        <div
          key={userId}
          onClick={() => {
            setFormAdmin((prev) => {
              const jaExiste = prev.participantes.includes(userId);

              return {
                ...prev,
                participantes: jaExiste
                  ? prev.participantes.filter((id) => id !== userId)
                  : [...prev.participantes, userId]
              };
            });
          }}
          style={{
            padding: "10px 12px",
            marginBottom: 4,
            borderRadius: 8,
            cursor: "pointer",
            background: selecionado
              ? "rgba(34,197,94,0.25)"
              : "transparent",
            border: selecionado
              ? "1px solid #22c55e"
              : "1px solid transparent",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "0.2s"
          }}
        >
          <span>
            {u.funcional} - {u.patente} {u.nome}
          </span>

          {selecionado && <span>✔</span>}
        </div>
      );
    })}
  </div>

  <small style={{ display: "block", marginTop: 8, opacity: 0.75 }}>
    Clique no policial para selecionar. Clique novamente para remover.
  </small>
</div>

    <div
  style={{
    marginTop: 18,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    border: "1px solid rgba(201,162,77,0.45)",
    borderRadius: 10,
    background: "rgba(201,162,77,0.08)",
    color: "#fff",
    width: "fit-content"
  }}
>
  <input
    type="checkbox"
    checked={formAdmin.contabilizarMeta}
    onChange={(e) =>
      setFormAdmin((prev) => ({
        ...prev,
        contabilizarMeta: e.target.checked
      }))
    }
    style={{
      width: 16,
      height: 16,
      accentColor: "#c9a24d"
    }}
  />

  <strong>Contabilizar esta ação na meta</strong>
</div>

    <div style={{ marginTop: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
      <button
        onClick={async () => {
          try {
            await api.post("/api/admin/actions/create", formAdmin);

            alert("Ação cadastrada com sucesso pelo administrador.");

            setFormAdmin({
              tipoAcao: "",
              resultado: "GANHA",
              numeroAcao: "",
              dataAcao: "",
              horaAcao: "",
              observacoes: "",
              participantes: [],
              contabilizarMeta: true
            });

            await carregar();
            setTab("historico");
          } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Erro ao cadastrar ação.");
          }
        }}
      >
        Cadastrar Ação
      </button>

      <button
        onClick={() =>
          setFormAdmin({
            tipoAcao: "",
            resultado: "GANHA",
            numeroAcao: "",
            dataAcao: "",
            horaAcao: "",
            observacoes: "",
            participantes: [],
            contabilizarMeta: true
          })
        }
      >
        Limpar
      </button>
    </div>
  </section>
)}

      {detalheAberto && (
        <div className="admin-modal-overlay" onClick={fecharDetalhes}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 style={{ margin: 0 }}>Detalhes da ação</h2>
                <p style={{ margin: "6px 0 0 0", opacity: 0.8 }}>
                  Visualização completa antes da validação.
                </p>
              </div>

              <button onClick={fecharDetalhes}>Fechar</button>
            </div>

            <div className="admin-modal-body">
              {detalheLoading ? (
                <p>Carregando detalhes...</p>
              ) : !acaoSelecionada ? (
                <p>Nenhuma ação carregada.</p>
              ) : (
                <div style={{ display: "grid", gap: 20 }}>
                  <section className="admin-detail-section">
                    <div className="admin-detail-section-title-row">
                      <h3 style={{ margin: 0 }}>Informações principais</h3>
                      <span
                        className="admin-status-badge"
                        style={{
                          borderColor: statusColor(acaoSelecionada.status),
                          color: statusColor(acaoSelecionada.status)
                        }}
                      >
                        {acaoSelecionada.status}
                      </span>
                    </div>

                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <small>Tipo</small>
                        <strong>{acaoSelecionada.nomeTipoAcao}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Categoria</small>
                        <strong>{acaoSelecionada.categoriaAcao}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Resultado</small>
                        <strong>{acaoSelecionada.resultado}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Número da ação</small>
                        <strong>{acaoSelecionada.numeroAcao}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Data da ação</small>
                        <strong>{formatarData(acaoSelecionada.dataAcao)}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Criada em</small>
                        <strong>{formatarDataHora(acaoSelecionada.createdAt)}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Contabilidade</small>
                        <strong>
                          {acaoSelecionada.contabilizarMeta === false
                            ? "Somente Histórico"
                            : "Conta na Meta"}
                        </strong>
                      </div>
                    </div>

                    <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        onClick={() =>
                          setAcaoSelecionada((prev) =>
                            prev
                              ? { ...prev, contabilizarMeta: true }
                              : prev
                          )
                        }
                      >
                        Marcar para contar na meta
                      </button>

                      <button
                        onClick={() =>
                          setAcaoSelecionada((prev) =>
                            prev
                              ? { ...prev, contabilizarMeta: false }
                              : prev
                          )
                        }
                      >
                        Marcar somente histórico
                      </button>

                      {acaoSelecionada.status === "APROVADA" && (
                        <button
                          onClick={() =>
                            alterarMeta(
                              acaoSelecionada._id,
                              acaoSelecionada.contabilizarMeta === false
                            )
                          }
                        >
                          Aplicar alteração
                        </button>
                      )}
                    </div>
                  </section>

                  <section className="admin-detail-section">
                    <h3 style={{ marginTop: 0 }}>Registrante</h3>

                    <div className="admin-detail-grid">
                      <div className="admin-detail-item">
                        <small>Nome</small>
                        <strong>{acaoSelecionada.registrante?.nome || "-"}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Patente</small>
                        <strong>{acaoSelecionada.registrante?.patente || "-"}</strong>
                      </div>

                      <div className="admin-detail-item">
                        <small>Funcional</small>
                        <strong>{acaoSelecionada.registrante?.funcional || "-"}</strong>
                      </div>
                    </div>
                  </section>

                  <section className="admin-detail-section">
                    <h3 style={{ marginTop: 0 }}>Observações</h3>
                    <div className="admin-detail-text-box">
                      {acaoSelecionada.observacoes || "Sem observações informadas."}
                    </div>
                  </section>

                  <section className="admin-detail-section">
                    <h3 style={{ marginTop: 0 }}>
                      Participantes ({acaoSelecionada.participantes?.length || 0})
                    </h3>

                    {!acaoSelecionada.participantes ||
                    acaoSelecionada.participantes.length === 0 ? (
                      <p>Nenhum participante informado.</p>
                    ) : (
                      <div className="admin-participants-grid">
                        {acaoSelecionada.participantes.map((p, index) => (
                          <div key={index} className="admin-participant-card">
                            <strong>
                              {p.patente} {p.nome}
                            </strong>
                            <span>Funcional: {p.funcional}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="admin-detail-section">
                    <h3 style={{ marginTop: 0 }}>Histórico de validação</h3>

                    {!acaoSelecionada.historicoValidacao ||
                    acaoSelecionada.historicoValidacao.length === 0 ? (
                      <p>Sem histórico.</p>
                    ) : (
                      <div className="admin-timeline">
                        {acaoSelecionada.historicoValidacao.map((item, index) => (
                          <div key={index} className="admin-timeline-item">
                            <div className="admin-timeline-dot" />
                            <div className="admin-timeline-content">
                              <strong>{item.tipo}</strong>
                              <span>{formatarDataHora(item.data)}</span>
                              <span>Autor: {item.autorNome || "-"}</span>
                              <span>Observação: {item.observacao || "-"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {acaoSelecionada.status === "REJEITADA" && (
                    <section className="admin-detail-section">
                      <h3 style={{ marginTop: 0 }}>Motivo da rejeição</h3>
                      <div className="admin-detail-text-box">
                        {acaoSelecionada.motivoRejeicao || "-"}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>

            {!detalheLoading &&
              acaoSelecionada &&
              (acaoSelecionada.status === "PENDENTE" ||
                acaoSelecionada.status === "REENVIADA") && (
                <div className="admin-modal-footer">
                  <button
                    className="admin-footer-btn admin-footer-btn-success"
                    onClick={() => aprovar(acaoSelecionada._id)}
                  >
                    Aprovar ação
                  </button>

                  <button
                    className="admin-footer-btn admin-footer-btn-danger"
                    onClick={() => rejeitar(acaoSelecionada._id)}
                  >
                    Rejeitar ação
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}