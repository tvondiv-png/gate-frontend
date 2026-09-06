import { useEffect, useMemo, useState } from "react";
import {
  createProfileUpdateRequest,
  fetchProfileUpdateMetadata,
  listMyProfileUpdateRequests
} from "../../services/profileUpdateRequestService";
import "./user-profile-requests.css";

import { useToast } from "../../contexts/ToastContext";
const TIPOS = [
  { value: "CURSO", label: "Curso", icon: "🎓" },
  { value: "MEDALHA", label: "Medalha", icon: "🏅" },
  { value: "PROMOCAO", label: "Promoção", icon: "🪖" },
  { value: "ALTERACAO_NOME", label: "Alteração de Nome", icon: "👤" },
  { value: "ALTERACAO_FUNCIONAL", label: "Alteração de Funcional", icon: "🆔" }
];

const statusStyle = (status) => {
  if (status === "APROVADA") {
    return {
      background: "rgba(34,197,94,0.12)",
      border: "1px solid rgba(34,197,94,0.28)",
      color: "#4ade80"
    };
  }

  if (status === "REJEITADA") {
    return {
      background: "rgba(239,68,68,0.12)",
      border: "1px solid rgba(239,68,68,0.28)",
      color: "#f87171"
    };
  }

  return {
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.28)",
    color: "#fbbf24"
  };
};

function formatarData(valor) {
  if (!valor) return "-";
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function formatarTipo(tipo) {
  return String(tipo || "").replaceAll("_", " ");
}

function montarResumo(item) {
  const dados = item?.dadosSolicitados || {};

  if (item.tipo === "CURSO") return `Curso solicitado: ${dados.curso || "-"}`;
  if (item.tipo === "MEDALHA") return `Medalha solicitada: ${dados.medalha || "-"}`;
  if (item.tipo === "PROMOCAO") return `Nova patente: ${dados.novaPatente || "-"}`;
  if (item.tipo === "ALTERACAO_NOME") return `Novo nome: ${dados.novoNome || "-"}`;
  if (item.tipo === "ALTERACAO_FUNCIONAL") return `Nova funcional: ${dados.novaFuncional || "-"}`;

  return "-";
}

function getTipoIcon(tipo) {
  const found = TIPOS.find((item) => item.value === tipo);
  return found?.icon || "📨";
}

export default function UserProfileRequests() {
  const toast = useToast();
  const [metadata, setMetadata] = useState({
    cursos: [],
    medalhas: [],
    patentes: []
  });

  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPage, setLoadingPage] = useState(true);

  const [form, setForm] = useState({
    tipo: "CURSO",
    curso: "",
    medalha: "",
    novaPatente: "",
    novoNome: "",
    novaFuncional: "",
    dataReferencia: "",
    numeroBoletim: "",
    nomeInstrutor: ""
  });

  const carregar = async () => {
    try {
      setLoadingPage(true);

      const [meta, list] = await Promise.all([
        fetchProfileUpdateMetadata(),
        listMyProfileUpdateRequests()
      ]);

      setMetadata(meta || { cursos: [], medalhas: [], patentes: [] });
      setHistorico(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar central de atualização cadastral");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const tituloDinamico = useMemo(() => {
    if (form.tipo === "CURSO") return "Solicitar inclusão de curso";
    if (form.tipo === "MEDALHA") return "Solicitar inclusão de medalha";
    if (form.tipo === "PROMOCAO") return "Solicitar promoção";
    if (form.tipo === "ALTERACAO_NOME") return "Solicitar alteração de nome";
    if (form.tipo === "ALTERACAO_FUNCIONAL") return "Solicitar alteração de funcional";
    return "Abrir requisição";
  }, [form.tipo]);

  const estatisticas = useMemo(() => {
    const total = historico.length;
    const pendentes = historico.filter((item) => item.status === "PENDENTE").length;
    const aprovadas = historico.filter((item) => item.status === "APROVADA").length;
    const rejeitadas = historico.filter((item) => item.status === "REJEITADA").length;

    return { total, pendentes, aprovadas, rejeitadas };
  }, [historico]);

  const limparFormulario = () => {
    setForm({
      tipo: "CURSO",
      curso: "",
      medalha: "",
      novaPatente: "",
      novoNome: "",
      novaFuncional: "",
      dataReferencia: "",
      numeroBoletim: "",
      nomeInstrutor: ""
    });
  };

  const trocarTipo = (tipo) => {
    setForm({
      tipo,
      curso: "",
      medalha: "",
      novaPatente: "",
      novoNome: "",
      novaFuncional: "",
      dataReferencia: "",
      numeroBoletim: "",
      nomeInstrutor: ""
    });
  };

  const enviar = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await createProfileUpdateRequest({
        ...form,
        novaFuncional: form.novaFuncional ? Number(form.novaFuncional) : ""
      });

      toast.success("Requisição enviada com sucesso.");
      limparFormulario();
      await carregar();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erro ao enviar requisição");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-request-page">
      <div className="profile-request-hero">
        <div className="profile-request-hero-left">
          <span className="profile-request-kicker">CENTRAL FUNCIONAL</span>
          <h1>Central de Atualização Cadastral</h1>
          <p>
            Solicite inclusão de cursos, medalhas, promoções, alteração de nome
            e funcional para validação administrativa e atualização automática
            da sua ficha.
          </p>

          <div className="profile-request-hero-tags">
            <span>Atualização de cursos</span>
            <span>Promoções</span>
            <span>Medalhas</span>
            <span>Dados cadastrais</span>
          </div>
        </div>

        <div className="profile-request-hero-right">
          <div className="profile-request-hero-card">
            <small>Requisições registradas</small>
            <strong>{loadingPage ? "..." : estatisticas.total}</strong>
            <span>Acompanhamento completo</span>
          </div>

          <div className="profile-request-hero-mini-grid">
            <div className="profile-request-mini-card">
              <small>Pendentes</small>
              <strong>{loadingPage ? "..." : estatisticas.pendentes}</strong>
            </div>

            <div className="profile-request-mini-card">
              <small>Aprovadas</small>
              <strong>{loadingPage ? "..." : estatisticas.aprovadas}</strong>
            </div>

            <div className="profile-request-mini-card">
              <small>Rejeitadas</small>
              <strong>{loadingPage ? "..." : estatisticas.rejeitadas}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-request-grid">
        <section className="profile-request-card">
          <div className="profile-request-card-header">
            <div>
              <h2>{tituloDinamico}</h2>
              <span>Abra uma nova requisição para o setor administrativo.</span>
            </div>
          </div>

          <form onSubmit={enviar} className="profile-request-form">
            <div className="profile-request-field">
              <label>Tipo da requisição</label>

              <div className="profile-request-type-grid">
                {TIPOS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`profile-request-type-btn ${form.tipo === item.value ? "active" : ""}`}
                    onClick={() => trocarTipo(item.value)}
                  >
                    <span>{item.icon}</span>
                    <strong>{item.label}</strong>
                  </button>
                ))}
              </div>
            </div>

            {form.tipo === "CURSO" && (
              <>
                <div className="profile-request-field">
                  <label>Curso</label>
                  <select
                    value={form.curso}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, curso: e.target.value }))
                    }
                  >
                    <option value="">Selecione</option>
                    {metadata.cursos.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="profile-request-field">
                  <label>Nome do instrutor</label>
                  <input
                    value={form.nomeInstrutor}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        nomeInstrutor: e.target.value
                      }))
                    }
                    placeholder="Informe o nome do instrutor"
                  />
                </div>
              </>
            )}

            {form.tipo === "MEDALHA" && (
              <div className="profile-request-field">
                <label>Medalha</label>
                <select
                  value={form.medalha}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, medalha: e.target.value }))
                  }
                >
                  <option value="">Selecione</option>
                  {metadata.medalhas.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.tipo === "PROMOCAO" && (
              <div className="profile-request-field">
                <label>Nova patente</label>
                <select
                  value={form.novaPatente}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      novaPatente: e.target.value
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {metadata.patentes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {form.tipo === "ALTERACAO_NOME" && (
              <div className="profile-request-field">
                <label>Novo nome</label>
                <input
                  value={form.novoNome}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, novoNome: e.target.value }))
                  }
                  placeholder="Digite o novo nome"
                />
              </div>
            )}

            {form.tipo === "ALTERACAO_FUNCIONAL" && (
              <div className="profile-request-field">
                <label>Nova funcional</label>
                <input
                  type="number"
                  value={form.novaFuncional}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      novaFuncional: e.target.value
                    }))
                  }
                  placeholder="Digite a nova funcional"
                />
              </div>
            )}

            <div className="profile-request-row">
              <div className="profile-request-field">
                <label>Data do boletim / referência</label>
                <input
                  type="date"
                  value={form.dataReferencia}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      dataReferencia: e.target.value
                    }))
                  }
                />
              </div>

              <div className="profile-request-field">
                <label>Número do boletim</label>
                <input
                  value={form.numeroBoletim}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      numeroBoletim: e.target.value
                    }))
                  }
                  placeholder="Ex: BI-042/2026"
                />
              </div>
            </div>

            <div className="profile-request-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Enviando..." : "Abrir requisição para o ADM"}
              </button>
            </div>
          </form>
        </section>

        <section className="profile-request-card">
          <div className="profile-request-card-header">
            <div>
              <h2>Minhas requisições</h2>
              <span>Acompanhe status, boletim, validação e observações.</span>
            </div>
          </div>

          {loadingPage ? (
            <div className="profile-request-empty">
              Carregando requisições...
            </div>
          ) : historico.length === 0 ? (
            <div className="profile-request-empty">
              Nenhuma requisição cadastrada até o momento.
            </div>
          ) : (
            <div className="profile-request-list">
              {historico.map((item) => (
                <div key={item._id} className="profile-request-item">
                  <div className="profile-request-item-top">
                    <div className="profile-request-item-title">
                      <span className="profile-request-item-icon">
                        {getTipoIcon(item.tipo)}
                      </span>

                      <div>
                        <strong>{formatarTipo(item.tipo)}</strong>
                        <p>{montarResumo(item)}</p>
                      </div>
                    </div>

                    <span style={statusStyle(item.status)}>
                      {item.status}
                    </span>
                  </div>

                  <div className="profile-request-meta">
                    <div>
                      <small>Data referência</small>
                      <strong>{formatarData(item?.dadosSolicitados?.dataReferencia)}</strong>
                    </div>

                    <div>
                      <small>Boletim</small>
                      <strong>{item?.dadosSolicitados?.numeroBoletim || "-"}</strong>
                    </div>

                    <div>
                      <small>Validado por</small>
                      <strong>{item?.validadoPor?.nome || "-"}</strong>
                    </div>

                    <div>
                      <small>Validado em</small>
                      <strong>{formatarData(item?.validadoEm)}</strong>
                    </div>
                  </div>

                  {item.observacaoAdmin ? (
                    <div className="profile-request-admin-note">
                      <small>Observação do ADM</small>
                      <p>{item.observacaoAdmin}</p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}