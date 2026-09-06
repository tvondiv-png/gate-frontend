import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "./user-module-premium.css";

import { useToast } from "../../contexts/ToastContext";
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

const getStatusBadgeClass = (status) => {
  if (status === "Validado") return "success";
  if (status === "Rejeitado") return "danger";
  if (status === "Pendente") return "warning";
  return "info";
};

export default function ApresentacaoEstagiariosUser() {
  const toast = useToast();
  const [estagiarios, setEstagiarios] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [funcionalEstagiario, setFuncionalEstagiario] = useState("");
  const [observacao, setObservacao] = useState("");

  const carregar = async () => {
    const [estRes, histRes] = await Promise.all([
      api.get("/api/apresentacoes-estagiarios/estagiarios"),
      api.get("/api/apresentacoes-estagiarios/minhas")
    ]);

    const lista = Array.isArray(estRes.data) ? estRes.data : [];

    const ordenada = [...lista].sort((a, b) => {
      const ordemA = ORDEM_PATENTES[a.patente] || 999;
      const ordemB = ORDEM_PATENTES[b.patente] || 999;
      if (ordemA !== ordemB) return ordemA - ordemB;
      return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
    });

    setEstagiarios(ordenada);
    setHistorico(Array.isArray(histRes.data) ? histRes.data : []);
  };

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const total = historico.length;
    const pendentes = historico.filter((x) => x.status === "Pendente").length;
    const validados = historico.filter((x) => x.status === "Validado").length;
    const rejeitados = historico.filter((x) => x.status === "Rejeitado").length;
    return { total, pendentes, validados, rejeitados };
  }, [historico]);

  const registrar = async () => {
    if (!funcionalEstagiario) {
      toast.warning("Selecione o estagiário");
      return;
    }

    try {
      await api.post("/api/apresentacoes-estagiarios", {
        funcionalEstagiario: Number(funcionalEstagiario),
        observacao
      });

      toast.success("Apresentação registrada com sucesso");
      setFuncionalEstagiario("");
      setObservacao("");
      carregar();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao registrar apresentação");
    }
  };

  return (
    <div className="user-module-page">
      <div className="user-module-topbar">
        <div>
          <h2>Apresentação de Estagiários</h2>
          <p>Registre apresentações e acompanhe o histórico de validações.</p>
        </div>
      </div>

      <section className="user-module-summary-grid">
        <div className="user-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Pendentes</small>
          <strong>{resumo.pendentes}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Validados</small>
          <strong>{resumo.validados}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Rejeitados</small>
          <strong>{resumo.rejeitados}</strong>
        </div>
      </section>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Registrar apresentação</h3>
            <span>Selecione o estagiário e envie a observação operacional.</span>
          </div>
        </div>

        <div className="user-module-grid">
          <select
            className="user-module-select"
            value={funcionalEstagiario}
            onChange={(e) => setFuncionalEstagiario(e.target.value)}
          >
            <option value="">Selecione o estagiário</option>
            {estagiarios.map((p) => (
              <option key={p.funcional} value={p.funcional}>
                {p.patente} - {p.nome} ({p.funcional})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            className="user-module-textarea"
            placeholder="Observação (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        <div className="user-module-actions">
          <button className="user-module-btn" onClick={registrar}>
            Registrar apresentação
          </button>
        </div>
      </section>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Minhas apresentações</h3>
            <span>Histórico institucional das suas apresentações cadastradas.</span>
          </div>
        </div>

        {historico.length === 0 ? (
          <div className="user-module-empty">Nenhuma apresentação registrada.</div>
        ) : (
          <div className="user-module-list">
            {historico.map((item) => (
              <div key={item._id} className="user-module-card">
                <div className="user-module-card-top">
                  <strong>
                    {item.patenteEstagiario} {item.nomeEstagiario}
                  </strong>
                  <span className={`user-module-badge ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="user-module-grid">
                  <div className="user-module-kv">
                    <small>Funcional</small>
                    <div>{item.funcionalEstagiario}</div>
                  </div>
                  <div className="user-module-kv">
                    <small>Data</small>
                    <div>{new Date(item.dataApresentacao).toLocaleString("pt-BR")}</div>
                  </div>
                  <div className="user-module-kv">
                    <small>Validado por</small>
                    <div>{item.nomeValidador || "-"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}