import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-base.css";
import "./sjd-admin.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const SANCOES = [
  { value: "ARQUIVAMENTO", label: "Arquivamento" },
  { value: "ORIENTACAO_VERBAL", label: "Orientação verbal" },
  { value: "ADVERTENCIA", label: "Advertência" },
  { value: "SUSPENSAO", label: "Suspensão" },
  { value: "EXONERACAO", label: "Exoneração" },
  { value: "ENCAMINHAMENTO_PENAL", label: "Encaminhamento penal" },
  { value: "PAD_1_3", label: "PAD 1/3" },
  { value: "PAD_2_3", label: "PAD 2/3" },
  { value: "PAD_3_3", label: "PAD 3/3" },
  { value: "OUTRA", label: "Outra" }
];

const STATUS_COLORS = {
  ABERTO: "#94a3b8",
  AGUARDANDO_CIENCIA: "#f59e0b",
  AGUARDANDO_MANIFESTACAO: "#eab308",
  EM_ANALISE: "#3b82f6",
  CONVOCADO: "#f97316",
  CONCLUIDO: "#22c55e",
  ARQUIVADO: "#64748b",
  SANCAO_APLICADA: "#ef4444"
};

const ATENUANTES_BASE = [
  "Bom comportamento",
  "Relevância de serviços prestados",
  "Ter sido cometida a transgressão para evitar mal maior",
  "Defesa própria, de seus direitos ou de outrem",
  "Falta de prática do serviço"
];

const AGRAVANTES_BASE = [
  "Mau comportamento",
  "Prática simultânea ou conexão de duas ou mais transgressões",
  "Reincidência",
  "Conluio de duas ou mais pessoas",
  "Abuso de autoridade hierárquica ou funcional",
  "Durante a execução do serviço",
  "Em presença de subordinado",
  "Com premeditação",
  "Em presença de público"
];

function formatarData(valor) {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
}

function getOrigemClasse(origem) {
  if (origem === "POLICIAL") return "policial";
  if (origem === "SJD") return "sjd";
  return "system";
}

function gerarScore({
  artigosPenais,
  artigosDisciplinares,
  agravantes,
  atenuantes,
  prioridade
}) {
  let score = 0;

  score += (artigosPenais?.length || 0) * 3;
  score += (artigosDisciplinares?.length || 0) * 2;
  score += (agravantes?.length || 0) * 1.5;
  score -= (atenuantes?.length || 0) * 1;

  if (prioridade === "ALTA") score += 2;
  if (prioridade === "URGENTE") score += 4;

  return Math.max(0, Math.round(score));
}

function sugerirPad(score) {
  if (score >= 15) {
    return {
      tipo: "PAD_3_3",
      padNivel: 3,
      label: "Sugestão: PAD 3/3 • Exoneração / máxima gravidade"
    };
  }

  if (score >= 10) {
    return {
      tipo: "PAD_2_3",
      padNivel: 2,
      label: "Sugestão: PAD 2/3 • Suspensão / gravidade alta"
    };
  }

  if (score >= 6) {
    return {
      tipo: "PAD_1_3",
      padNivel: 1,
      label: "Sugestão: PAD 1/3 • Advertência"
    };
  }

  return {
    tipo: "ADVERTENCIA",
    padNivel: 0,
    label: "Sugestão: Advertência / orientação"
  };
}

export default function SjdAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [casos, setCasos] = useState([]);
  const [policiais, setPoliciais] = useState([]);
  const [penalCodes, setPenalCodes] = useState([]);
  const [disciplinaryRules, setDisciplinaryRules] = useState([]);
  const [selecionado, setSelecionado] = useState(null);

  const [buscaCaso, setBuscaCaso] = useState("");
  const [buscaArtigoPenal, setBuscaArtigoPenal] = useState("");
  const [buscaArtigoDisciplinar, setBuscaArtigoDisciplinar] = useState("");

  const [form, setForm] = useState({
    policialId: "",
    tipo: "IPM",
    descricao: "",
    prioridade: "MEDIA",
    prazoResposta: ""
  });

  const [comentario, setComentario] = useState("");
  const [convocacao, setConvocacao] = useState({
    mensagem: "",
    dataAudiencia: "",
    local: "",
    obrigatoria: true
  });

  const [conclusao, setConclusao] = useState("");
  const [sancaoFinal, setSancaoFinal] = useState({
    tipo: "ADVERTENCIA",
    padNivel: 1,
    descricao: ""
  });

  const [artigosPenaisSelecionados, setArtigosPenaisSelecionados] = useState([]);
  const [artigosDisciplinaresSelecionados, setArtigosDisciplinaresSelecionados] = useState([]);
  const [atenuantes, setAtenuantes] = useState([]);
  const [agravantes, setAgravantes] = useState([]);

  const load = async (manterSelecionado = false) => {
    try {
      const [casosRes, hierarchyRes, penalRes, rulesRes] = await Promise.all([
        api.get("/api/discipline"),
        api.get("/api/hierarchy/public/list"),
        api.get("/api/penal-code"),
        api.get("/api/disciplinary-rules")
      ]);

      const listaCasos = Array.isArray(casosRes.data) ? casosRes.data : [];
      const listaPoliciais = Array.isArray(hierarchyRes.data) ? hierarchyRes.data : [];

      setCasos(listaCasos);
      setPoliciais(listaPoliciais);
      setPenalCodes(Array.isArray(penalRes.data) ? penalRes.data : []);
      setDisciplinaryRules(Array.isArray(rulesRes.data?.rules) ? rulesRes.data.rules : []);

      if (manterSelecionado && selecionado) {
        const atualizado = listaCasos.find((c) => c._id === selecionado._id);
        if (atualizado) {
          const detalhe = await api.get(`/api/discipline/${atualizado._id}`);
          setSelecionado(detalhe.data);
        }
      }
    } catch (err) {
      console.error("Erro ao carregar módulo SJD:", err);
      setCasos([]);
      setPoliciais([]);
      setPenalCodes([]);
      setDisciplinaryRules([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const abrirCaso = async (id) => {
    try {
      const res = await api.get(`/api/discipline/${id}`);
      const item = res.data;
      setSelecionado(item);
      setArtigosPenaisSelecionados(item.artigosPenais || []);
      setArtigosDisciplinaresSelecionados(item.artigosDisciplinares || []);
      setAtenuantes(item.atenuantes || []);
      setAgravantes(item.agravantes || []);
      setConclusao(item.conclusao?.texto || "");
      setSancaoFinal({
        tipo: item.sancaoFinal?.tipo || "ADVERTENCIA",
        padNivel: item.sancaoFinal?.padNivel ?? 1,
        descricao: item.sancaoFinal?.descricao || ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao abrir processo");
    }
  };

  const resumo = useMemo(() => {
    return {
      total: casos.length,
      aguardandoCiencia: casos.filter((x) => x.status === "AGUARDANDO_CIENCIA").length,
      aguardandoManifestacao: casos.filter((x) => x.status === "AGUARDANDO_MANIFESTACAO").length,
      emAnalise: casos.filter((x) => x.status === "EM_ANALISE").length,
      sancionados: casos.filter((x) => x.status === "SANCAO_APLICADA").length
    };
  }, [casos]);

  const casosFiltrados = useMemo(() => {
    const termo = buscaCaso.trim().toLowerCase();

    if (!termo) return casos;

    return casos.filter((c) => {
      const numero = String(c.numero || "").toLowerCase();
      const tipo = String(c.tipo || "").toLowerCase();
      const status = String(c.status || "").toLowerCase();
      const nome = String(c.policial?.nome || "").toLowerCase();
      const funcional = String(c.policial?.funcional || "").toLowerCase();

      return (
        numero.includes(termo) ||
        tipo.includes(termo) ||
        status.includes(termo) ||
        nome.includes(termo) ||
        funcional.includes(termo)
      );
    });
  }, [casos, buscaCaso]);

  const artigosPenaisFiltrados = useMemo(() => {
    const termo = buscaArtigoPenal.trim().toLowerCase();
    if (!termo) return penalCodes;

    return penalCodes.filter((item) => {
      const artigo = String(item.artigo || "").toLowerCase();
      const titulo = String(item.titulo || "").toLowerCase();
      const codigo = String(item.codigo || "").toLowerCase();
      return artigo.includes(termo) || titulo.includes(termo) || codigo.includes(termo);
    });
  }, [penalCodes, buscaArtigoPenal]);

  const artigosDisciplinaresFiltrados = useMemo(() => {
    const termo = buscaArtigoDisciplinar.trim().toLowerCase();
    if (!termo) return disciplinaryRules;

    return disciplinaryRules.filter((item) => {
      const codigo = String(item.codigo || "").toLowerCase();
      const titulo = String(item.titulo || "").toLowerCase();
      const secao = String(item.secao || "").toLowerCase();
      return codigo.includes(termo) || titulo.includes(termo) || secao.includes(termo);
    });
  }, [disciplinaryRules, buscaArtigoDisciplinar]);

  const riskScore = useMemo(() => {
    const prioridadeBase = selecionado?.prioridade || form.prioridade;
    return gerarScore({
      artigosPenais: artigosPenaisSelecionados,
      artigosDisciplinares: artigosDisciplinaresSelecionados,
      agravantes,
      atenuantes,
      prioridade: prioridadeBase
    });
  }, [
    artigosPenaisSelecionados,
    artigosDisciplinaresSelecionados,
    agravantes,
    atenuantes,
    selecionado?.prioridade,
    form.prioridade
  ]);

  const sugestaoPad = useMemo(() => sugerirPad(riskScore), [riskScore]);

  const progressPercent = useMemo(() => {
    return Math.min(100, Math.round((riskScore / 18) * 100));
  }, [riskScore]);

  const criarCaso = async () => {
    if (!form.policialId || !form.descricao.trim()) {
      toast.warning("Selecione o policial e preencha a descrição");
      return;
    }

    try {
      await api.post("/api/discipline", {
        policialId: form.policialId,
        tipo: form.tipo,
        descricao: form.descricao,
        prioridade: form.prioridade,
        prazoResposta: form.prazoResposta || null,
        artigosPenais: [],
        artigosDisciplinares: []
      });

      setForm({
        policialId: "",
        tipo: "IPM",
        descricao: "",
        prioridade: "MEDIA",
        prazoResposta: ""
      });

      await load();
      toast.success("Processo criado com sucesso");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao criar processo");
    }
  };

  const enviarComentario = async () => {
    if (!selecionado?._id || !comentario.trim()) {
      toast.warning("Digite o comentário");
      return;
    }

    try {
      await api.post(`/api/discipline/${selecionado._id}/comentario`, {
        texto: comentario
      });

      setComentario("");
      await load(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao comentar");
    }
  };

  const enviarConvocacao = async () => {
    if (!selecionado?._id || !convocacao.mensagem.trim()) {
      toast.warning("Informe a convocação");
      return;
    }

    try {
      await api.post(`/api/discipline/${selecionado._id}/convocar`, convocacao);

      setConvocacao({
        mensagem: "",
        dataAudiencia: "",
        local: "",
        obrigatoria: true
      });

      await load(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao convocar");
    }
  };

  const toggleAtenuante = (item) => {
    setAtenuantes((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleAgravante = (item) => {
    setAgravantes((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const toggleArtigoPenal = (artigo) => {
    setArtigosPenaisSelecionados((prev) => {
      const existe = prev.find((x) => x.codigo === artigo.codigo);
      if (existe) return prev.filter((x) => x.codigo !== artigo.codigo);

      return [
        ...prev,
        {
          codigo: artigo.codigo,
          artigo: artigo.artigo,
          titulo: artigo.titulo,
          multa: artigo.multa || 0,
          prisaoMeses: artigo.prisaoMeses || 0,
          semFianca: artigo.semFianca || false
        }
      ];
    });
  };

  const toggleArtigoDisciplinar = (regra) => {
    setArtigosDisciplinaresSelecionados((prev) => {
      const existe = prev.find((x) => x.codigo === regra.codigo);
      if (existe) return prev.filter((x) => x.codigo !== regra.codigo);

      return [
        ...prev,
        {
          codigo: regra.codigo,
          secao: regra.secao,
          item: regra.item,
          titulo: regra.titulo,
          gravidade: regra.gravidade
        }
      ];
    });
  };

  const aplicarSugestao = () => {
    setSancaoFinal((prev) => ({
      ...prev,
      tipo: sugestaoPad.tipo,
      padNivel: sugestaoPad.padNivel
    }));
  };

  const concluirCaso = async () => {
    if (!selecionado?._id) return;
    if (!conclusao.trim()) {
      toast.warning("Informe a conclusão");
      return;
    }

    try {
      await api.post(`/api/discipline/${selecionado._id}/concluir`, {
        conclusao,
        artigosPenais: artigosPenaisSelecionados,
        artigosDisciplinares: artigosDisciplinaresSelecionados,
        atenuantes,
        agravantes,
        sancaoFinal
      });

      await load(true);
      toast.success("Processo concluído com sucesso");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao concluir processo");
    }
  };

  const excluirCaso = async () => {
    if (!selecionado?._id) return;
    if (!(await confirm({ tone: "danger", message: "Deseja realmente excluir este processo?" }))) return;

    try {
      await api.delete(`/api/discipline/${selecionado._id}`);
      setSelecionado(null);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao excluir processo");
    }
  };

  return (
    <div className="sjd-page">
      <div className="sjd-topbar">
        <div>
          <h1>SJD • Justiça & Disciplina</h1>
          <p>Centro de procedimentos internos, comunicação formal e decisão disciplinar.</p>
        </div>

        <button className="sjd-btn" type="button" onClick={() => load(Boolean(selecionado))}>
          Recarregar dados
        </button>
      </div>

      <section className="sjd-summary-grid">
        <div className="sjd-summary-card">
          <small>Total de processos</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="sjd-summary-card">
          <small>Aguardando ciência</small>
          <strong>{resumo.aguardandoCiencia}</strong>
        </div>
        <div className="sjd-summary-card">
          <small>Aguardando manifestação</small>
          <strong>{resumo.aguardandoManifestacao}</strong>
        </div>
        <div className="sjd-summary-card">
          <small>Em análise</small>
          <strong>{resumo.emAnalise}</strong>
        </div>
        <div className="sjd-summary-card">
          <small>Sanções aplicadas</small>
          <strong>{resumo.sancionados}</strong>
        </div>
      </section>

      <section className="sjd-section">
        <h3>Abertura de processo</h3>

        <div className="sjd-form-grid">
          <select
            className="sjd-select"
            value={form.policialId}
            onChange={(e) => setForm({ ...form, policialId: e.target.value })}
          >
            <option value="">Selecione o policial</option>
            {policiais.map((p) => (
              <option key={String(p.user)} value={String(p.user)}>
                {p.funcional} - {p.patente} - {p.nome}
              </option>
            ))}
          </select>

          <select
            className="sjd-select"
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
          >
            <option value="IPM">IPM</option>
            <option value="PAD">PAD</option>
            <option value="Investigação">Investigação</option>
            <option value="Advertência">Advertência</option>
            <option value="Suspensão">Suspensão</option>
            <option value="Outro">Outro</option>
          </select>

          <select
            className="sjd-select"
            value={form.prioridade}
            onChange={(e) => setForm({ ...form, prioridade: e.target.value })}
          >
            <option value="BAIXA">Baixa</option>
            <option value="MEDIA">Média</option>
            <option value="ALTA">Alta</option>
            <option value="URGENTE">Urgente</option>
          </select>

          <input
            className="sjd-input"
            type="datetime-local"
            value={form.prazoResposta}
            onChange={(e) => setForm({ ...form, prazoResposta: e.target.value })}
          />
        </div>

        <textarea
          className="sjd-textarea"
          style={{ marginTop: 12 }}
          rows="5"
          placeholder="Descrição inicial do processo"
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
        />

        <div className="sjd-actions-row">
          <button className="sjd-btn" type="button" onClick={criarCaso}>
            Criar processo
          </button>
        </div>
      </section>

      <section className="sjd-section">
        <div className="sjd-subtitle">
          <h3>Processos registrados</h3>
          <input
            className="sjd-search"
            style={{ maxWidth: 320 }}
            placeholder="Buscar por número, policial, status..."
            value={buscaCaso}
            onChange={(e) => setBuscaCaso(e.target.value)}
          />
        </div>

        <div className="sjd-table-wrap">
          <table className="sjd-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Policial</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {casosFiltrados.map((c) => (
                <tr
                  key={c._id}
                  className={selecionado?._id === c._id ? "sjd-row-active" : ""}
                >
                  <td>{c.numero}</td>
                  <td>
                    {c.policial
                      ? `${c.policial.funcional} - ${c.policial.nome}`
                      : "Policial removido"}
                  </td>
                  <td>{c.tipo}</td>
                  <td style={{ color: STATUS_COLORS[c.status] || "#fff", fontWeight: "bold" }}>
                    {c.status}
                  </td>
                  <td>{c.prioridade}</td>
                  <td>
                    <button className="sjd-btn" type="button" onClick={() => abrirCaso(c._id)}>
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}

              {casosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6">
                    <div className="sjd-empty">Nenhum processo encontrado.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selecionado && (
        <section className="sjd-section">
          <div className="sjd-case-hero">
            <div className="sjd-case-hero-top">
              <div className="sjd-case-title">
                <small>Processo em gerenciamento</small>
                <h3>{selecionado.numero}</h3>
              </div>

              <span className={`sjd-badge sjd-status-${selecionado.status}`}>
                {selecionado.status}
              </span>
            </div>

            <div className="sjd-hero-grid">
              <div className="sjd-hero-box">
                <small>Policial</small>
                <strong>
                  {selecionado.policial
                    ? `${selecionado.policial.funcional} • ${selecionado.policial.nome}`
                    : "-"}
                </strong>
              </div>

              <div className="sjd-hero-box">
                <small>Patente</small>
                <strong>{selecionado.policial?.patente || "-"}</strong>
              </div>

              <div className="sjd-hero-box">
                <small>Tipo</small>
                <strong>{selecionado.tipo}</strong>
              </div>

              <div className="sjd-hero-box">
                <small>Prioridade</small>
                <strong className={`sjd-priority-${selecionado.prioridade}`}>
                  {selecionado.prioridade}
                </strong>
              </div>

              <div className="sjd-hero-box">
                <small>Ciência</small>
                <strong>
                  {selecionado.cienciaPolicial?.confirmada
                    ? `Confirmada em ${formatarData(selecionado.cienciaPolicial?.data)}`
                    : "Pendente"}
                </strong>
              </div>

              <div className="sjd-hero-box">
                <small>Criado em</small>
                <strong>{formatarData(selecionado.createdAt)}</strong>
              </div>
            </div>
          </div>

          <div className="sjd-columns" style={{ marginTop: 18 }}>
            <div className="sjd-stack">
              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Descrição inicial</h4>
                </div>
                <p>{selecionado.descricao || "-"}</p>
              </div>

              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Comunicação processual</h4>
                  <span className="sjd-count-pill">
                    {(selecionado.comentarios?.length || 0) + (selecionado.manifestacoes?.length || 0)} registro(s)
                  </span>
                </div>

                <div className="sjd-chat">
                  {(selecionado.comentarios || []).map((c, i) => (
                    <div key={`c-${i}`} className={`sjd-message ${getOrigemClasse(c.origem || "SJD")}`}>
                      <strong>
                        {(c.autor?.patente ? `${c.autor.patente} ` : "") + (c.autor?.nome || "SJD")}
                      </strong>
                      <p>{c.texto}</p>
                      <small>{formatarData(c.createdAt)}</small>
                    </div>
                  ))}

                  {(selecionado.manifestacoes || []).map((m, i) => (
                    <div key={`m-${i}`} className="sjd-message policial">
                      <strong>
                        {m.tipo} • {selecionado.policial?.nome || "Policial"}
                      </strong>
                      <p>{m.texto}</p>
                      <small>{formatarData(m.createdAt)}</small>
                    </div>
                  ))}

                  {(selecionado.comentarios?.length || 0) === 0 &&
                    (selecionado.manifestacoes?.length || 0) === 0 && (
                      <div className="sjd-empty">
                        Nenhuma comunicação registrada até o momento.
                      </div>
                    )}
                </div>

                <textarea
                  className="sjd-textarea"
                  rows="4"
                  placeholder="Digite um comentário institucional"
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  style={{ marginTop: 12 }}
                />

                <div className="sjd-actions-row">
                  <button className="sjd-btn" type="button" onClick={enviarComentario}>
                    Adicionar comentário
                  </button>
                </div>
              </div>

              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Convocações</h4>
                  <span className="sjd-count-pill">
                    {selecionado.convocacoes?.length || 0} registro(s)
                  </span>
                </div>

                {(selecionado.convocacoes?.length || 0) > 0 ? (
                  <div className="sjd-timeline">
                    {selecionado.convocacoes.map((c, i) => (
                      <div key={i} className="sjd-timeline-item">
                        <strong>{c.mensagem}</strong>
                        <p>Local: {c.local || "-"}</p>
                        <small>Data audiência: {formatarData(c.dataAudiencia)}</small>
                        <br />
                        <small>Registrado em: {formatarData(c.createdAt)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sjd-empty">Nenhuma convocação registrada.</div>
                )}

                <div className="sjd-form-grid" style={{ marginTop: 12 }}>
                  <textarea
                    className="sjd-textarea"
                    rows="4"
                    placeholder="Mensagem da convocação"
                    value={convocacao.mensagem}
                    onChange={(e) => setConvocacao({ ...convocacao, mensagem: e.target.value })}
                  />
                  <div className="sjd-stack">
                    <input
                      className="sjd-input"
                      type="datetime-local"
                      value={convocacao.dataAudiencia}
                      onChange={(e) => setConvocacao({ ...convocacao, dataAudiencia: e.target.value })}
                    />
                    <input
                      className="sjd-input"
                      value={convocacao.local}
                      onChange={(e) => setConvocacao({ ...convocacao, local: e.target.value })}
                      placeholder="Local"
                    />
                    <button className="sjd-btn" type="button" onClick={enviarConvocacao}>
                      Enviar convocação
                    </button>
                  </div>
                </div>
              </div>

              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Linha do tempo processual</h4>
                  <span className="sjd-count-pill">{selecionado.historico?.length || 0}</span>
                </div>

                {(selecionado.historico?.length || 0) > 0 ? (
                  <div className="sjd-timeline">
                    {selecionado.historico.map((item, i) => (
                      <div key={i} className="sjd-timeline-item">
                        <strong>{item.acao}</strong>
                        <p>{item.descricao || "-"}</p>
                        <small>{formatarData(item.createdAt)}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="sjd-empty">Sem histórico processual.</div>
                )}
              </div>
            </div>

            <div className="sjd-stack">
              <div className="sjd-risk-panel">
                <div className="sjd-subtitle">
                  <h4>Gravidade processual</h4>
                  <span className="sjd-count-pill">Análise automática</span>
                </div>

                <div className="sjd-risk-score">
                  <strong>{riskScore}</strong>
                  <span className="sjd-helper">{sugestaoPad.label}</span>
                </div>

                <div className="sjd-risk-progress">
                  <span style={{ width: `${progressPercent}%` }} />
                </div>

                <div className="sjd-inline-grid">
                  <div className="sjd-hero-box">
                    <small>Artigos penais</small>
                    <strong>{artigosPenaisSelecionados.length}</strong>
                  </div>
                  <div className="sjd-hero-box">
                    <small>Artigos disciplinares</small>
                    <strong>{artigosDisciplinaresSelecionados.length}</strong>
                  </div>
                  <div className="sjd-hero-box">
                    <small>Agravantes</small>
                    <strong>{agravantes.length}</strong>
                  </div>
                  <div className="sjd-hero-box">
                    <small>Atenuantes</small>
                    <strong>{atenuantes.length}</strong>
                  </div>
                </div>

                <div className="sjd-actions-row">
                  <button className="sjd-btn" type="button" onClick={aplicarSugestao}>
                    Aplicar sugestão automática
                  </button>
                </div>
              </div>

              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Artigos do Código Penal</h4>
                  <span className="sjd-count-pill">{artigosPenaisSelecionados.length} selecionado(s)</span>
                </div>

                <input
                  className="sjd-search"
                  placeholder="Buscar artigo penal..."
                  value={buscaArtigoPenal}
                  onChange={(e) => setBuscaArtigoPenal(e.target.value)}
                />

                <div className="sjd-list-box" style={{ marginTop: 12 }}>
                  {artigosPenaisFiltrados.map((item) => {
                    const checked = artigosPenaisSelecionados.some((x) => x.codigo === item.codigo);

                    return (
                      <label key={item._id || item.codigo} className="sjd-check-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArtigoPenal(item)}
                        />{" "}
                        {item.artigo} - {item.titulo}
                      </label>
                    );
                  })}
                </div>

                {artigosPenaisSelecionados.length > 0 && (
                  <div className="sjd-chip-row" style={{ marginTop: 12 }}>
                    {artigosPenaisSelecionados.map((item) => (
                      <span key={item.codigo} className="sjd-chip">
                        {item.artigo}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Regulamento disciplinar</h4>
                  <span className="sjd-count-pill">{artigosDisciplinaresSelecionados.length} selecionado(s)</span>
                </div>

                <input
                  className="sjd-search"
                  placeholder="Buscar regra disciplinar..."
                  value={buscaArtigoDisciplinar}
                  onChange={(e) => setBuscaArtigoDisciplinar(e.target.value)}
                />

                <div className="sjd-list-box" style={{ marginTop: 12 }}>
                  {artigosDisciplinaresFiltrados.map((item) => {
                    const checked = artigosDisciplinaresSelecionados.some((x) => x.codigo === item.codigo);

                    return (
                      <label key={item.codigo} className="sjd-check-item">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleArtigoDisciplinar(item)}
                        />{" "}
                        {item.codigo} - {item.titulo}
                      </label>
                    );
                  })}
                </div>

                {artigosDisciplinaresSelecionados.length > 0 && (
                  <div className="sjd-chip-row" style={{ marginTop: 12 }}>
                    {artigosDisciplinaresSelecionados.map((item) => (
                      <span key={item.codigo} className="sjd-chip">
                        {item.codigo}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Atenuantes</h4>
                  <span className="sjd-count-pill">{atenuantes.length}</span>
                </div>

                <div className="sjd-list-box">
                  {ATENUANTES_BASE.map((item) => (
                    <label key={item} className="sjd-check-item">
                      <input
                        type="checkbox"
                        checked={atenuantes.includes(item)}
                        onChange={() => toggleAtenuante(item)}
                      />{" "}
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sjd-card">
                <div className="sjd-subtitle">
                  <h4>Agravantes</h4>
                  <span className="sjd-count-pill">{agravantes.length}</span>
                </div>

                <div className="sjd-list-box">
                  {AGRAVANTES_BASE.map((item) => (
                    <label key={item} className="sjd-check-item">
                      <input
                        type="checkbox"
                        checked={agravantes.includes(item)}
                        onChange={() => toggleAgravante(item)}
                      />{" "}
                      {item}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sjd-decision-box">
                <div className="sjd-subtitle">
                  <h4>Decisão final</h4>
                  <span className="sjd-count-pill">Encerramento do processo</span>
                </div>

                <textarea
                  className="sjd-textarea"
                  rows="5"
                  placeholder="Conclusão do processo"
                  value={conclusao}
                  onChange={(e) => setConclusao(e.target.value)}
                />

                <div className="sjd-inline-grid">
                  <select
                    className="sjd-select"
                    value={sancaoFinal.tipo}
                    onChange={(e) => setSancaoFinal({ ...sancaoFinal, tipo: e.target.value })}
                  >
                    {SANCOES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <select
                    className="sjd-select"
                    value={sancaoFinal.padNivel}
                    onChange={(e) =>
                      setSancaoFinal({ ...sancaoFinal, padNivel: Number(e.target.value) })
                    }
                  >
                    <option value={0}>Sem PAD</option>
                    <option value={1}>PAD 1/3</option>
                    <option value={2}>PAD 2/3</option>
                    <option value={3}>PAD 3/3</option>
                  </select>
                </div>

                <textarea
                  className="sjd-textarea"
                  rows="4"
                  placeholder="Descrição complementar da sanção"
                  value={sancaoFinal.descricao}
                  onChange={(e) => setSancaoFinal({ ...sancaoFinal, descricao: e.target.value })}
                />

                <div className="sjd-actions-row">
                  <button className="sjd-btn" type="button" onClick={concluirCaso}>
                    Concluir processo
                  </button>

                  <button className="sjd-btn danger" type="button" onClick={excluirCaso}>
                    Excluir processo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}