import { useEffect, useMemo, useState } from "react";
import {
  approveProfileUpdateRequest,
  listAdminProfileUpdateRequests,
  rejectProfileUpdateRequest
} from "../../services/profileUpdateRequestAdminService";
import "./profile-update-requests-admin.css";

import { useToast } from "../../contexts/ToastContext";
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

function formatarTipo(tipo) {
  return String(tipo || "").replaceAll("_", " ");
}

function formatarData(valor) {
  if (!valor) return "-";
  return new Date(valor).toLocaleDateString("pt-BR", { timeZone: "UTC" });
}

function montarResumo(item) {
  const dados = item?.dadosSolicitados || {};

  if (item.tipo === "CURSO") {
    return {
      principal: dados.curso || "-",
      secundario: `Instrutor: ${dados.nomeInstrutor || "-"}`
    };
  }

  if (item.tipo === "MEDALHA") {
    return {
      principal: dados.medalha || "-",
      secundario: "Inclusão de medalha"
    };
  }

  if (item.tipo === "PROMOCAO") {
    return {
      principal: dados.novaPatente || "-",
      secundario: "Atualização de patente"
    };
  }

  if (item.tipo === "ALTERACAO_NOME") {
    return {
      principal: dados.novoNome || "-",
      secundario: "Alteração de nome"
    };
  }

  if (item.tipo === "ALTERACAO_FUNCIONAL") {
    return {
      principal: dados.novaFuncional || "-",
      secundario: "Alteração de funcional"
    };
  }

  return {
    principal: "-",
    secundario: "-"
  };
}

export default function ProfileUpdateRequestsAdmin() {
  const toast = useToast();
  const [lista, setLista] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [filtro, setFiltro] = useState("TODAS");
  const [observacaoAdmin, setObservacaoAdmin] = useState("");

  const carregar = async () => {
    try {
      setLoading(true);
      const data = await listAdminProfileUpdateRequests();
      setLista(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar requisições cadastrais");
      setLista([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const estatisticas = useMemo(() => {
    const total = lista.length;
    const pendentes = lista.filter((item) => item.status === "PENDENTE").length;
    const aprovadas = lista.filter((item) => item.status === "APROVADA").length;
    const rejeitadas = lista.filter((item) => item.status === "REJEITADA").length;

    return { total, pendentes, aprovadas, rejeitadas };
  }, [lista]);

  const listaFiltrada = useMemo(() => {
    if (filtro === "TODAS") return lista;
    return lista.filter((item) => item.status === filtro);
  }, [lista, filtro]);

  const aprovar = async () => {
    if (!selecionado) return;

    try {
      setLoadingAction(true);
      const atualizado = await approveProfileUpdateRequest(selecionado._id, {
        observacaoAdmin
      });

      toast.success("Requisição aprovada com sucesso.");
      setSelecionado(atualizado);
      setObservacaoAdmin("");
      await carregar();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erro ao aprovar requisição");
    } finally {
      setLoadingAction(false);
    }
  };

  const rejeitar = async () => {
    if (!selecionado) return;

    if (!observacaoAdmin.trim()) {
      toast.warning("Informe a observação da rejeição.");
      return;
    }

    try {
      setLoadingAction(true);
      const atualizado = await rejectProfileUpdateRequest(selecionado._id, {
        observacaoAdmin
      });

      toast.success("Requisição rejeitada com sucesso.");
      setSelecionado(atualizado);
      setObservacaoAdmin("");
      await carregar();
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erro ao rejeitar requisição");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="profile-admin-page">
      <div className="profile-admin-hero">
        <div className="profile-admin-hero-left">
          <span className="profile-admin-kicker">SETOR ADMINISTRATIVO</span>
          <h1>Requisições Cadastrais</h1>
          <p>
            Valide promoções, cursos, medalhas e alterações cadastrais enviadas
            pelos policiais. A aprovação atualiza automaticamente os dados do
            usuário e da hierarquia.
          </p>
        </div>

        <div className="profile-admin-hero-right">
          <div className="profile-admin-stat-card">
            <small>Total</small>
            <strong>{loading ? "..." : estatisticas.total}</strong>
          </div>

          <div className="profile-admin-stat-card">
            <small>Pendentes</small>
            <strong>{loading ? "..." : estatisticas.pendentes}</strong>
          </div>

          <div className="profile-admin-stat-card">
            <small>Aprovadas</small>
            <strong>{loading ? "..." : estatisticas.aprovadas}</strong>
          </div>

          <div className="profile-admin-stat-card">
            <small>Rejeitadas</small>
            <strong>{loading ? "..." : estatisticas.rejeitadas}</strong>
          </div>
        </div>
      </div>

      <div className="profile-admin-toolbar">
        <div className="profile-admin-filter-group">
          <button
            type="button"
            className={filtro === "TODAS" ? "active" : ""}
            onClick={() => setFiltro("TODAS")}
          >
            Todas
          </button>

          <button
            type="button"
            className={filtro === "PENDENTE" ? "active" : ""}
            onClick={() => setFiltro("PENDENTE")}
          >
            Pendentes
          </button>

          <button
            type="button"
            className={filtro === "APROVADA" ? "active" : ""}
            onClick={() => setFiltro("APROVADA")}
          >
            Aprovadas
          </button>

          <button
            type="button"
            className={filtro === "REJEITADA" ? "active" : ""}
            onClick={() => setFiltro("REJEITADA")}
          >
            Rejeitadas
          </button>
        </div>

        <button type="button" className="profile-admin-refresh" onClick={carregar}>
          Recarregar
        </button>
      </div>

      <div className="profile-admin-grid">
        <section className="profile-admin-card">
          <div className="profile-admin-card-header">
            <div>
              <h2>Fila de requisições</h2>
              <span>{listaFiltrada.length} registro(s) exibido(s)</span>
            </div>
          </div>

          {loading ? (
            <div className="profile-admin-empty">Carregando requisições...</div>
          ) : listaFiltrada.length === 0 ? (
            <div className="profile-admin-empty">
              Nenhuma requisição encontrada neste filtro.
            </div>
          ) : (
            <div className="profile-admin-list">
              {listaFiltrada.map((item) => {
                const resumo = montarResumo(item);

                return (
                  <button
                    type="button"
                    key={item._id}
                    className={`profile-admin-item ${selecionado?._id === item._id ? "active" : ""}`}
                    onClick={() => {
                      setSelecionado(item);
                      setObservacaoAdmin(item.observacaoAdmin || "");
                    }}
                  >
                    <div className="profile-admin-item-top">
                      <div>
                        <strong>{formatarTipo(item.tipo)}</strong>
                        <p>{resumo.principal}</p>
                      </div>

                      <span style={statusStyle(item.status)}>{item.status}</span>
                    </div>

                    <div className="profile-admin-item-meta">
                      <span>
                        Solicitante: {item?.solicitante?.funcional} - {item?.solicitante?.nome}
                      </span>
                      <span>Boletim: {item?.dadosSolicitados?.numeroBoletim || "-"}</span>
                      <span>Data: {formatarData(item?.dadosSolicitados?.dataReferencia)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="profile-admin-card">
          <div className="profile-admin-card-header">
            <div>
              <h2>Detalhes da requisição</h2>
              <span>Visualize antes de aprovar ou rejeitar.</span>
            </div>
          </div>

          {!selecionado ? (
            <div className="profile-admin-empty">
              Selecione uma requisição na lista para visualizar os detalhes.
            </div>
          ) : (
            <div className="profile-admin-details">
              <div className="profile-admin-block">
                <h3>Solicitante</h3>

                <div className="profile-admin-info-grid">
                  <div>
                    <small>Nome</small>
                    <strong>{selecionado?.solicitante?.nome || "-"}</strong>
                  </div>

                  <div>
                    <small>Funcional</small>
                    <strong>{selecionado?.solicitante?.funcional || "-"}</strong>
                  </div>

                  <div>
                    <small>Patente</small>
                    <strong>{selecionado?.solicitante?.patente || "-"}</strong>
                  </div>

                  <div>
                    <small>Status</small>
                    <strong>{selecionado?.status || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="profile-admin-block">
                <h3>Requisição</h3>

                <div className="profile-admin-info-grid">
                  <div>
                    <small>Tipo</small>
                    <strong>{formatarTipo(selecionado?.tipo)}</strong>
                  </div>

                  <div>
                    <small>Boletim</small>
                    <strong>{selecionado?.dadosSolicitados?.numeroBoletim || "-"}</strong>
                  </div>

                  <div>
                    <small>Data referência</small>
                    <strong>{formatarData(selecionado?.dadosSolicitados?.dataReferencia)}</strong>
                  </div>

                  <div>
                    <small>Validado por</small>
                    <strong>{selecionado?.validadoPor?.nome || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="profile-admin-block">
                <h3>Dados atuais</h3>

                <div className="profile-admin-info-grid">
                  <div>
                    <small>Nome atual</small>
                    <strong>{selecionado?.dadosAtuais?.nome || "-"}</strong>
                  </div>

                  <div>
                    <small>Funcional atual</small>
                    <strong>{selecionado?.dadosAtuais?.funcional || "-"}</strong>
                  </div>

                  <div>
                    <small>Patente atual</small>
                    <strong>{selecionado?.dadosAtuais?.patente || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="profile-admin-block">
                <h3>Dados solicitados</h3>

                <div className="profile-admin-info-grid">
                  <div>
                    <small>Curso</small>
                    <strong>{selecionado?.dadosSolicitados?.curso || "-"}</strong>
                  </div>

                  <div>
                    <small>Medalha</small>
                    <strong>{selecionado?.dadosSolicitados?.medalha || "-"}</strong>
                  </div>

                  <div>
                    <small>Nova patente</small>
                    <strong>{selecionado?.dadosSolicitados?.novaPatente || "-"}</strong>
                  </div>

                  <div>
                    <small>Novo nome</small>
                    <strong>{selecionado?.dadosSolicitados?.novoNome || "-"}</strong>
                  </div>

                  <div>
                    <small>Nova funcional</small>
                    <strong>{selecionado?.dadosSolicitados?.novaFuncional || "-"}</strong>
                  </div>

                  <div>
                    <small>Instrutor</small>
                    <strong>{selecionado?.dadosSolicitados?.nomeInstrutor || "-"}</strong>
                  </div>
                </div>
              </div>

              <div className="profile-admin-block">
                <h3>Observação administrativa</h3>

                <textarea
                  value={observacaoAdmin}
                  onChange={(e) => setObservacaoAdmin(e.target.value)}
                  placeholder="Digite uma observação para aprovação ou motivo da rejeição"
                  disabled={selecionado.status !== "PENDENTE"}
                />
              </div>

              <div className="profile-admin-actions">
                {selecionado.status === "PENDENTE" ? (
                  <>
                    <button
                      type="button"
                      className="approve"
                      disabled={loadingAction}
                      onClick={aprovar}
                    >
                      {loadingAction ? "Processando..." : "Aprovar requisição"}
                    </button>

                    <button
                      type="button"
                      className="reject"
                      disabled={loadingAction}
                      onClick={rejeitar}
                    >
                      {loadingAction ? "Processando..." : "Rejeitar requisição"}
                    </button>
                  </>
                ) : (
                  <div className="profile-admin-finished-note">
                    Esta requisição já foi processada.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}