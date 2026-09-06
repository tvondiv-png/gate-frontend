import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../api/api";
import "./user-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Aspirante-a-Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

const podeAvaliar = (patente = "") => (ORDEM_PATENTES[patente] || 999) <= 11;

const statusBadgeClass = (status) => {
  if (status === "Validado") return "success";
  if (status === "Revisao") return "danger";
  if (status === "Pendente") return "warning";
  return "info";
};

const formInicial = {
  data: "",
  horarioInicial: "",
  horarioFinal: "",
  condutaPatrulha: "",
  postura: "",
  proatividade: "",
  pontosFortes: "",
  podeMelhorar: "",
  observacoes: ""
};

export default function AvaliacaoEstagiosUser() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user } = useAuth();

  const [estagiarios, setEstagiarios] = useState([]);
  const [rsos, setRsos] = useState([]);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [estagiarioId, setEstagiarioId] = useState("");
  const [rsoId, setRsoId] = useState("");
  const [usarRso, setUsarRso] = useState("nao");

  const [form, setForm] = useState(formInicial);

  const permitido = useMemo(() => podeAvaliar(user?.patente), [user]);

  const carregar = async () => {
    try {
      const [estRes, rsoRes, avRes] = await Promise.all([
        api.get("/api/avaliacoes-estagio/estagiarios"),
        api.get("/api/avaliacoes-estagio/me/rsos"),
        api.get("/api/avaliacoes-estagio/me")
      ]);

      setEstagiarios(Array.isArray(estRes.data) ? estRes.data : []);
      setRsos(Array.isArray(rsoRes.data) ? rsoRes.data : []);
      setAvaliacoes(Array.isArray(avRes.data) ? avRes.data : []);
    } catch (err) {
      console.error("Erro ao carregar avaliações de estágio:", err);
      setEstagiarios([]);
      setRsos([]);
      setAvaliacoes([]);
    }
  };

  useEffect(() => {
    if (permitido) {
      carregar();
    }
  }, [permitido]);

  const estagiarioSelecionado = useMemo(() => {
    return estagiarios.find((e) => String(e._id) === String(estagiarioId)) || null;
  }, [estagiarios, estagiarioId]);

  const rsosFiltrados = useMemo(() => {
    if (!estagiarioSelecionado) {
      return [];
    }

    return rsos.filter((rso) => {
      return (
        Array.isArray(rso.estagiarios) &&
        rso.estagiarios.some(
          (p) => Number(p.funcional) === Number(estagiarioSelecionado.funcional)
        )
      );
    });
  }, [rsos, estagiarioSelecionado]);

  useEffect(() => {
    if (!rsoId) return;

    const existe = rsosFiltrados.some((r) => String(r._id) === String(rsoId));
    if (!existe) {
      setRsoId("");
    }
  }, [rsosFiltrados, rsoId]);

  const preencherDoRso = async () => {
    if (usarRso !== "sim") return;
    if (!rsoId || !estagiarioSelecionado) return;

    try {
      const res = await api.get(
        `/api/avaliacoes-estagio/rso/${rsoId}/autofill?funcional=${estagiarioSelecionado.funcional}`
      );

      setForm((prev) => ({
        ...prev,
        data: res.data?.data || "",
        horarioInicial: res.data?.horarioInicial || "",
        horarioFinal: res.data?.horarioFinal || ""
      }));
    } catch (err) {
      console.error("Erro ao preencher com dados do RSO:", err);

      setForm((prev) => ({
        ...prev,
        data: "",
        horarioInicial: "",
        horarioFinal: ""
      }));

      toast.error(
        err?.response?.data?.message ||
          "Não foi possível preencher automaticamente com este RSO."
      );
    }
  };

  useEffect(() => {
    if (usarRso === "sim" && rsoId && estagiarioSelecionado) {
      preencherDoRso();
    }
  }, [usarRso, rsoId, estagiarioSelecionado]);

  useEffect(() => {
    if (usarRso === "nao") {
      setRsoId("");
    }
  }, [usarRso]);

  const resumo = useMemo(() => {
    const total = avaliacoes.length;
    const pendentes = avaliacoes.filter((x) => x.status === "Pendente").length;
    const validadas = avaliacoes.filter((x) => x.status === "Validado").length;
    const revisao = avaliacoes.filter((x) => x.status === "Revisao").length;

    return { total, pendentes, validadas, revisao };
  }, [avaliacoes]);

  const limparFormulario = () => {
    setEstagiarioId("");
    setRsoId("");
    setUsarRso("nao");
    setForm(formInicial);
  };

  const salvar = async () => {
    if (!estagiarioId || !form.data || !form.horarioInicial || !form.horarioFinal) {
      toast.warning("Preencha estagiário, data, horário inicial e horário final.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/avaliacoes-estagio", {
        estagiarioId,
        rsoId: usarRso === "sim" && rsoId ? rsoId : null,
        ...form
      });

      toast.success("Avaliação enviada com sucesso");
      limparFormulario();
      await carregar();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao enviar avaliação");
    } finally {
      setLoading(false);
    }
  };

  const excluir = async (id) => {
    if (!(await confirm({ tone: "danger", message: "Excluir esta avaliação?" }))) return;

    try {
      await api.delete(`/api/avaliacoes-estagio/${id}`);
      await carregar();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao excluir avaliação");
    }
  };

  const reenviar = async (item) => {
    try {
      await api.put(`/api/avaliacoes-estagio/${item._id}`, {
        data: item.data,
        horarioInicial: item.horarioInicial,
        horarioFinal: item.horarioFinal,
        condutaPatrulha: item.condutaPatrulha,
        postura: item.postura,
        proatividade: item.proatividade,
        pontosFortes: item.pontosFortes,
        podeMelhorar: item.podeMelhorar,
        observacoes: item.observacoes
      });

      await carregar();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao reenviar avaliação");
    }
  };

  if (!permitido) {
    return (
      <div className="user-module-page">
        <div className="user-module-alert danger">
          <strong>Acesso restrito</strong>
          <p>Somente de 3º Sargento acima pode realizar avaliação de estagiários.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-module-page">
      <div className="user-module-topbar">
        <div>
          <h2>Avaliação de Estagiários</h2>
          <p>Registre avaliações, acompanhe revisões e mantenha histórico institucional.</p>
        </div>

        <button className="user-module-btn blue" type="button" onClick={carregar}>
          Recarregar dados
        </button>
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
          <small>Validadas</small>
          <strong>{resumo.validadas}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Em revisão</small>
          <strong>{resumo.revisao}</strong>
        </div>
      </section>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Nova avaliação</h3>
            <span>Preencha manualmente ou use dados de um RSO para facilitar.</span>
          </div>
        </div>

        <div className="user-module-grid">
          <select
            className="user-module-select"
            value={estagiarioId}
            onChange={(e) => setEstagiarioId(e.target.value)}
          >
            <option value="">Selecione o estagiário</option>
            {estagiarios.map((e) => (
              <option key={e._id} value={e._id}>
                {e.patente} - {e.nome} ({e.funcional})
              </option>
            ))}
          </select>

          <select
            className="user-module-select"
            value={usarRso}
            onChange={(e) => setUsarRso(e.target.value)}
          >
            <option value="nao">Preencher manualmente</option>
            <option value="sim">Usar dados do RSO</option>
          </select>

          <select
            className="user-module-select"
            value={rsoId}
            onChange={(e) => setRsoId(e.target.value)}
            disabled={usarRso !== "sim" || !estagiarioSelecionado}
          >
            <option value="">
              {usarRso !== "sim"
                ? "Ative a opção usar RSO"
                : !estagiarioSelecionado
                ? "Selecione o estagiário primeiro"
                : "Selecionar RSO do dia"}
            </option>

            {rsosFiltrados.map((r) => (
              <option key={r._id} value={r._id}>
                {r.viatura} - {r.status}
              </option>
            ))}
          </select>

          <input
            className="user-module-input"
            placeholder="Data"
            value={form.data}
            onChange={(e) => setForm((p) => ({ ...p, data: e.target.value }))}
          />

          <input
            className="user-module-input"
            placeholder="Horário inicial"
            value={form.horarioInicial}
            onChange={(e) => setForm((p) => ({ ...p, horarioInicial: e.target.value }))}
          />

          <input
            className="user-module-input"
            placeholder="Horário final"
            value={form.horarioFinal}
            onChange={(e) => setForm((p) => ({ ...p, horarioFinal: e.target.value }))}
          />
        </div>

        {usarRso === "sim" && estagiarioSelecionado && rsosFiltrados.length === 0 ? (
          <div className="user-module-alert warning" style={{ marginTop: 14 }}>
            <strong>Nenhum RSO compatível</strong>
            <p>
              Não há RSO do dia disponível para este estagiário dentro dos seus registros.
            </p>
          </div>
        ) : null}

        <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
          <textarea
            className="user-module-textarea"
            placeholder="Conduta de patrulha"
            value={form.condutaPatrulha}
            onChange={(e) => setForm((p) => ({ ...p, condutaPatrulha: e.target.value }))}
          />

          <textarea
            className="user-module-textarea"
            placeholder="Postura"
            value={form.postura}
            onChange={(e) => setForm((p) => ({ ...p, postura: e.target.value }))}
          />

          <textarea
            className="user-module-textarea"
            placeholder="Proatividade"
            value={form.proatividade}
            onChange={(e) => setForm((p) => ({ ...p, proatividade: e.target.value }))}
          />

          <textarea
            className="user-module-textarea"
            placeholder="Pontos fortes"
            value={form.pontosFortes}
            onChange={(e) => setForm((p) => ({ ...p, pontosFortes: e.target.value }))}
          />

          <textarea
            className="user-module-textarea"
            placeholder="O que pode melhorar"
            value={form.podeMelhorar}
            onChange={(e) => setForm((p) => ({ ...p, podeMelhorar: e.target.value }))}
          />

          <textarea
            className="user-module-textarea"
            placeholder="Observações adicionais"
            value={form.observacoes}
            onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
          />
        </div>

        <div className="user-module-actions">
          <button className="user-module-btn" onClick={salvar} disabled={loading}>
            {loading ? "Enviando..." : "Enviar avaliação"}
          </button>

          <button className="user-module-btn blue" type="button" onClick={limparFormulario}>
            Limpar formulário
          </button>
        </div>
      </section>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Histórico de avaliações</h3>
            <span>Acompanhe o andamento e eventuais pedidos de revisão.</span>
          </div>
        </div>

        {avaliacoes.length === 0 ? (
          <div className="user-module-empty">Nenhuma avaliação cadastrada.</div>
        ) : (
          <div className="user-module-list">
            {avaliacoes.map((item) => (
              <div key={item._id} className="user-module-card">
                <div className="user-module-card-top">
                  <strong>
                    {item.estagiario?.patente} {item.estagiario?.nome}
                  </strong>

                  <span className={`user-module-badge ${statusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>

                <div className="user-module-grid">
                  <div className="user-module-kv">
                    <small>Funcional</small>
                    <div>{item.estagiario?.funcional}</div>
                  </div>

                  <div className="user-module-kv">
                    <small>Data</small>
                    <div>{item.data || "-"}</div>
                  </div>

                  <div className="user-module-kv">
                    <small>Horário</small>
                    <div>
                      {item.horarioInicial} → {item.horarioFinal}
                    </div>
                  </div>

                  <div className="user-module-kv">
                    <small>Viatura</small>
                    <div>{item.viatura || "-"}</div>
                  </div>
                </div>

                {item.comentarioCoordenador ? (
                  <div className="user-module-alert danger" style={{ marginTop: 12 }}>
                    <strong>Comentário do coordenador</strong>
                    <p>{item.comentarioCoordenador}</p>
                  </div>
                ) : null}

                <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                  <div className="user-module-readonly">
                    <strong>Conduta de patrulha</strong>
                    <div style={{ marginTop: 8 }}>{item.condutaPatrulha || "-"}</div>
                  </div>

                  <div className="user-module-readonly">
                    <strong>Postura</strong>
                    <div style={{ marginTop: 8 }}>{item.postura || "-"}</div>
                  </div>

                  <div className="user-module-readonly">
                    <strong>Proatividade</strong>
                    <div style={{ marginTop: 8 }}>{item.proatividade || "-"}</div>
                  </div>

                  <div className="user-module-readonly">
                    <strong>Pontos fortes</strong>
                    <div style={{ marginTop: 8 }}>{item.pontosFortes || "-"}</div>
                  </div>

                  <div className="user-module-readonly">
                    <strong>O que pode melhorar</strong>
                    <div style={{ marginTop: 8 }}>{item.podeMelhorar || "-"}</div>
                  </div>

                  <div className="user-module-readonly">
                    <strong>Observações</strong>
                    <div style={{ marginTop: 8 }}>{item.observacoes || "-"}</div>
                  </div>
                </div>

                <div className="user-module-actions">
                  {(item.status === "Pendente" || item.status === "Revisao") && (
                    <button className="user-module-btn" onClick={() => reenviar(item)}>
                      Reenviar
                    </button>
                  )}

                  <button className="user-module-btn danger" onClick={() => excluir(item._id)}>
                    Excluir
                  </button>
                </div>

                {Array.isArray(item.historico) && item.historico.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <strong>Histórico</strong>

                    <div className="user-module-timeline" style={{ marginTop: 10 }}>
                      {item.historico.map((h, idx) => (
                        <div key={idx} className="user-module-timeline-item">
                          <strong>{h.acao}</strong>
                          <p>{h.comentario || "-"}</p>
                          <small>{new Date(h.data).toLocaleString("pt-BR")}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}