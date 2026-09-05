import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "./user-module-premium.css";

const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

function getPolicialUserId(policial) {
  if (!policial) return "";

  if (typeof policial.user === "string") {
    return policial.user;
  }

  if (
    policial.user &&
    typeof policial.user === "object" &&
    policial.user._id
  ) {
    return String(policial.user._id);
  }

  return "";
}

const statusClass = (status) => {
  if (status === "APROVADA") return "success";
  if (status === "REJEITADA") return "danger";
  if (status === "REENVIADA") return "info";
  if (status === "PENDENTE") return "warning";
  return "neutral";
};

export default function UserActions() {
  const [tab, setTab] = useState("nova");
  const [rules, setRules] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buscaParticipante, setBuscaParticipante] = useState("");

  const [form, setForm] = useState({
    tipoAcao: "",
    resultado: "GANHA",
    numeroAcao: "",
    dataAcao: "",
    observacoes: "",
    participantes: []
  });

  const carregarTudo = async () => {
    const erros = [];

    try {
      const resRules = await api.get("/api/actions/rules");
      setRules(Array.isArray(resRules.data) ? resRules.data : []);
    } catch (err) {
      console.error("Erro ao carregar regras:", err.response?.data || err);
      setRules([]);
      erros.push("regras");
    }

    try {
      const resHierarchy = await api.get("/api/hierarchy/public/list");
      setHierarchy(Array.isArray(resHierarchy.data) ? resHierarchy.data : []);
    } catch (err) {
      console.error("Erro ao carregar hierarquia pública:", err.response?.data || err);
      setHierarchy([]);
      erros.push("hierarquia pública");
    }

    try {
      const resMine = await api.get("/api/actions/mine");
      setMine(Array.isArray(resMine.data) ? resMine.data : []);
    } catch (err) {
      console.error("Erro ao carregar minhas ações:", err.response?.data || err);
      setMine([]);
      erros.push("minhas ações");
    }

    if (erros.length > 0) {
      alert(`Falha ao carregar: ${erros.join(", ")}`);
    }
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const hierarchyOrdenada = useMemo(() => {
    return [...hierarchy].sort((a, b) => {
      const ordemA = ORDEM_PATENTES[a.patente] || 999;
      const ordemB = ORDEM_PATENTES[b.patente] || 999;

      if (ordemA !== ordemB) return ordemA - ordemB;
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });
  }, [hierarchy]);

  const hierarchyFiltrada = useMemo(() => {
    const termo = buscaParticipante.trim().toLowerCase();

    if (!termo) return hierarchyOrdenada;

    return hierarchyOrdenada.filter((p) => {
      const nome = String(p.nome || "").toLowerCase();
      const patente = String(p.patente || "").toLowerCase();
      const funcional = String(p.funcional || "").toLowerCase();

      return (
        nome.includes(termo) ||
        patente.includes(termo) ||
        funcional.includes(termo)
      );
    });
  }, [hierarchyOrdenada, buscaParticipante]);

  const ruleSelecionada = useMemo(() => {
    return rules.find((r) => r.codigo === form.tipoAcao) || null;
  }, [rules, form.tipoAcao]);

  const participantesSelecionados = useMemo(() => {
    const ids = new Set(form.participantes.map(String));

    return hierarchyOrdenada.filter((p) => {
      const policialId = getPolicialUserId(p);
      return policialId && ids.has(policialId);
    });
  }, [hierarchyOrdenada, form.participantes]);

  const resumoHistorico = useMemo(() => {
    const total = mine.length;
    const pendentes = mine.filter(
      (x) => x.status === "PENDENTE" || x.status === "REENVIADA"
    ).length;
    const aprovadas = mine.filter((x) => x.status === "APROVADA").length;
    const rejeitadas = mine.filter((x) => x.status === "REJEITADA").length;

    return { total, pendentes, aprovadas, rejeitadas };
  }, [mine]);

  const toggleParticipante = (userId) => {
    const idString = String(userId);
    if (!idString) return;

    setForm((prev) => ({
      ...prev,
      participantes: prev.participantes.includes(idString)
        ? prev.participantes.filter((id) => id !== idString)
        : [...prev.participantes, idString]
    }));
  };

  const marcarTodosFiltrados = () => {
    const idsFiltrados = hierarchyFiltrada
      .map((p) => getPolicialUserId(p))
      .filter(Boolean);

    setForm((prev) => ({
      ...prev,
      participantes: [...new Set([...prev.participantes, ...idsFiltrados])]
    }));
  };

  const limparParticipantes = () => {
    setForm((prev) => ({
      ...prev,
      participantes: []
    }));
  };

  const removerSelecionado = (userId) => {
    const idString = String(userId);

    setForm((prev) => ({
      ...prev,
      participantes: prev.participantes.filter((id) => id !== idString)
    }));
  };

  const limparFormulario = () => {
    setForm({
      tipoAcao: "",
      resultado: "GANHA",
      numeroAcao: "",
      dataAcao: "",
      observacoes: "",
      participantes: []
    });
    setBuscaParticipante("");
  };

  const enviar = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/api/actions", form);

      alert("Ação enviada para validação com sucesso");
      limparFormulario();
      setTab("minhas");
      await carregarTudo();
    } catch (err) {
      console.error("Erro ao enviar ação:", err.response?.data || err);
      alert(err.response?.data?.message || "Erro ao enviar ação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-module-page">
      <div className="user-module-topbar">
        <div>
          <h2>Registro de Ações</h2>
          <p>Área para registrar, acompanhar e consultar regras das ações.</p>
        </div>

        <button className="user-module-btn blue" type="button" onClick={carregarTudo}>
          Recarregar dados
        </button>
      </div>

      <div className="user-module-actions" style={{ marginTop: 0 }}>
        <button className="user-module-btn" type="button" onClick={() => setTab("nova")}>
          Nova Ação
        </button>
        <button className="user-module-btn blue" type="button" onClick={() => setTab("minhas")}>
          Minhas Ações
        </button>
        <button className="user-module-btn blue" type="button" onClick={() => setTab("regras")}>
          Regras
        </button>
      </div>

      {tab === "nova" && (
        <form onSubmit={enviar} className="user-module-page" style={{ gap: 18 }}>
          <section className="user-module-section">
            <div className="user-module-section-title">
              <div>
                <h3>Dados da ação</h3>
                <span>Preencha os dados principais do registro operacional.</span>
              </div>
            </div>

            <div className="user-module-grid">
              <select
                className="user-module-select"
                value={form.tipoAcao}
                onChange={(e) => setForm({ ...form, tipoAcao: e.target.value })}
                required
              >
                <option value="">Selecione o tipo</option>
                {rules.map((r) => (
                  <option key={r.codigo} value={r.codigo}>
                    {r.icone} {r.nome}
                  </option>
                ))}
              </select>

              <select
                className="user-module-select"
                value={form.resultado}
                onChange={(e) => setForm({ ...form, resultado: e.target.value })}
              >
                <option value="GANHA">Ganha</option>
                <option value="PERDIDA">Perdida</option>
              </select>

              <input
                className="user-module-input"
                placeholder="Número da ação"
                value={form.numeroAcao}
                onChange={(e) => setForm({ ...form, numeroAcao: e.target.value })}
                required
              />

              <input
                className="user-module-input"
                type="date"
                value={form.dataAcao}
                onChange={(e) => setForm({ ...form, dataAcao: e.target.value })}
                required
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <textarea
                className="user-module-textarea"
                value={form.observacoes}
                onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                placeholder="Informe detalhes relevantes da ação"
              />
            </div>
          </section>

          {ruleSelecionada && (
            <section className="user-module-section">
              <div className="user-module-section-title">
                <div>
                  <h3>
                    {ruleSelecionada.icone} {ruleSelecionada.nome}
                  </h3>
                  <span>{ruleSelecionada.categoria}</span>
                </div>
              </div>

              <div className="user-module-summary-grid">
                <div className="user-module-summary-card">
                  <small>Bandidos</small>
                  <strong>{ruleSelecionada.maxBandidos}</strong>
                </div>
                <div className="user-module-summary-card">
                  <small>Polícia</small>
                  <strong>{ruleSelecionada.maxPoliciais}</strong>
                </div>
                <div className="user-module-summary-card">
                  <small>Armamento</small>
                  <strong style={{ fontSize: 16 }}>{ruleSelecionada.armamentoPermitido}</strong>
                </div>
                <div className="user-module-summary-card">
                  <small>Negociação</small>
                  <strong style={{ fontSize: 16 }}>
                    {ruleSelecionada.negociacaoObrigatoria ? "Obrigatória" : "Não possui"}
                  </strong>
                </div>
                <div className="user-module-summary-card">
                  <small>Refém</small>
                  <strong style={{ fontSize: 16 }}>
                    {ruleSelecionada.permiteRefem
                      ? `Sim (${ruleSelecionada.limiteRefens})`
                      : "Não"}
                  </strong>
                </div>
              </div>

              {Array.isArray(ruleSelecionada.regras) && ruleSelecionada.regras.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <strong>Regras</strong>
                  <div className="user-module-list" style={{ marginTop: 10 }}>
                    {ruleSelecionada.regras.map((item, index) => (
                      <div key={index} className="user-module-card">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(ruleSelecionada.observacoes) &&
                ruleSelecionada.observacoes.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <strong>Observações</strong>
                    <div className="user-module-list" style={{ marginTop: 10 }}>
                      {ruleSelecionada.observacoes.map((item, index) => (
                        <div key={index} className="user-module-card">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </section>
          )}

          <section className="user-module-section">
            <div className="user-module-section-title">
              <div>
                <h3>Participantes</h3>
                <span>{participantesSelecionados.length} selecionado(s)</span>
              </div>
            </div>

            <div className="user-module-grid-3" style={{ marginBottom: 14 }}>
              <input
                className="user-module-search"
                type="text"
                placeholder="Buscar por funcional, patente ou nome"
                value={buscaParticipante}
                onChange={(e) => setBuscaParticipante(e.target.value)}
              />

              <button className="user-module-btn blue" type="button" onClick={marcarTodosFiltrados}>
                Marcar filtrados
              </button>

              <button className="user-module-btn danger" type="button" onClick={limparParticipantes}>
                Limpar seleção
              </button>
            </div>

            {participantesSelecionados.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <strong>Selecionados</strong>
                <div className="user-module-chip-row" style={{ marginTop: 10 }}>
                  {participantesSelecionados.map((p) => {
                    const policialId = getPolicialUserId(p);

                    return (
                      <span key={policialId} className="user-module-chip">
                        {p.funcional} - {p.patente} - {p.nome}
                        <button
                          type="button"
                          onClick={() => removerSelecionado(policialId)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: 700,
                            marginLeft: 8
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="user-module-list-box">
              {hierarchyFiltrada.length === 0 ? (
                <p>Nenhum participante encontrado.</p>
              ) : (
                hierarchyFiltrada.map((p) => {
                  const participanteId = getPolicialUserId(p);
                  if (!participanteId) return null;

                  return (
                    <label key={participanteId} className="user-module-check-item">
                      <input
                        type="checkbox"
                        checked={form.participantes.includes(participanteId)}
                        onChange={() => toggleParticipante(participanteId)}
                      />{" "}
                      {p.funcional} - {p.patente} - {p.nome}
                    </label>
                  );
                })
              )}
            </div>
          </section>

          <section className="user-module-section">
            <div className="user-module-section-title">
              <div>
                <h3>Resumo do envio</h3>
                <span>Confirme os dados antes de enviar.</span>
              </div>
            </div>

            <div className="user-module-summary-grid">
              <div className="user-module-summary-card">
                <small>Tipo</small>
                <strong style={{ fontSize: 16 }}>
                  {ruleSelecionada ? `${ruleSelecionada.icone} ${ruleSelecionada.nome}` : "-"}
                </strong>
              </div>

              <div className="user-module-summary-card">
                <small>Resultado</small>
                <strong>{form.resultado || "-"}</strong>
              </div>

              <div className="user-module-summary-card">
                <small>Participantes</small>
                <strong>{participantesSelecionados.length}</strong>
              </div>

              <div className="user-module-summary-card">
                <small>Data</small>
                <strong style={{ fontSize: 16 }}>{form.dataAcao || "-"}</strong>
              </div>
            </div>

            <div className="user-module-actions">
              <button className="user-module-btn" type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Enviar para validação"}
              </button>

              <button className="user-module-btn blue" type="button" onClick={limparFormulario}>
                Limpar formulário
              </button>
            </div>
          </section>
        </form>
      )}

      {tab === "minhas" && (
        <div className="user-module-page" style={{ gap: 18 }}>
          <section className="user-module-summary-grid">
            <div className="user-module-summary-card">
              <small>Total</small>
              <strong>{resumoHistorico.total}</strong>
            </div>
            <div className="user-module-summary-card">
              <small>Pendentes</small>
              <strong>{resumoHistorico.pendentes}</strong>
            </div>
            <div className="user-module-summary-card">
              <small>Aprovadas</small>
              <strong>{resumoHistorico.aprovadas}</strong>
            </div>
            <div className="user-module-summary-card">
              <small>Rejeitadas</small>
              <strong>{resumoHistorico.rejeitadas}</strong>
            </div>
          </section>

          <section className="user-module-section">
            <div className="user-module-section-title">
              <div>
                <h3>Histórico das minhas ações</h3>
                <span>Acompanhe o andamento de cada envio.</span>
              </div>
            </div>

            <div className="user-module-table-wrap">
              <table className="user-module-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Resultado</th>
                    <th>Número Ação</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Motivo Rejeição</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center" }}>
                        Nenhuma ação cadastrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    mine.map((item) => (
                      <tr key={item._id}>
                        <td>{item.nomeTipoAcao}</td>
                        <td>{item.resultado}</td>
                        <td>{item.numeroAcao}</td>
                        <td>
                          {item.dataAcao
                            ? new Date(item.dataAcao).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>
                        <td>
                          <span className={`user-module-badge ${statusClass(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>{item.motivoRejeicao || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {tab === "regras" && (
        <div className="user-module-list">
          {rules.map((r) => (
            <div key={r.codigo} className="user-module-section">
              <div className="user-module-section-title">
                <div>
                  <h3>
                    {r.icone} {r.nome}
                  </h3>
                  <span>{r.categoria}</span>
                </div>
              </div>

              <div className="user-module-summary-grid">
                <div className="user-module-summary-card">
                  <small>Bandidos</small>
                  <strong>{r.maxBandidos}</strong>
                </div>

                <div className="user-module-summary-card">
                  <small>Polícia</small>
                  <strong>{r.maxPoliciais}</strong>
                </div>

                <div className="user-module-summary-card">
                  <small>Armamento</small>
                  <strong style={{ fontSize: 16 }}>{r.armamentoPermitido}</strong>
                </div>

                <div className="user-module-summary-card">
                  <small>Negociação</small>
                  <strong style={{ fontSize: 16 }}>
                    {r.negociacaoObrigatoria ? "Obrigatória" : "Não possui"}
                  </strong>
                </div>

                <div className="user-module-summary-card">
                  <small>Refém</small>
                  <strong style={{ fontSize: 16 }}>
                    {r.permiteRefem ? `Sim (${r.limiteRefens})` : "Não"}
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>Regras</strong>
                <div className="user-module-list" style={{ marginTop: 10 }}>
                  {Array.isArray(r.regras) &&
                    r.regras.map((item, index) => (
                      <div key={index} className="user-module-card">
                        {item}
                      </div>
                    ))}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <strong>Observações</strong>
                <div className="user-module-list" style={{ marginTop: 10 }}>
                  {Array.isArray(r.observacoes) &&
                    r.observacoes.map((item, index) => (
                      <div key={index} className="user-module-card">
                        {item}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}