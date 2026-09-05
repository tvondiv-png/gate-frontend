import { useEffect, useMemo, useState } from "react";
import {
  buscarMeuProcessoDisciplinar,
  confirmarCienciaProcesso,
  enviarManifestacaoProcesso,
  listarMeusProcessosDisciplinares
} from "../../services/disciplineUserService";
import "./user-discipline.css";

function formatarData(valor) {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
}

function getStatusColor(status) {
  const mapa = {
    ABERTO: "#94a3b8",
    AGUARDANDO_CIENCIA: "#f59e0b",
    AGUARDANDO_MANIFESTACAO: "#eab308",
    EM_ANALISE: "#3b82f6",
    CONVOCADO: "#f97316",
    CONCLUIDO: "#22c55e",
    ARQUIVADO: "#64748b",
    SANCAO_APLICADA: "#ef4444"
  };

  return mapa[status] || "#94a3b8";
}

export default function UserDiscipline() {
  const [lista, setLista] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [manifestacao, setManifestacao] = useState("");
  const [tipoManifestacao, setTipoManifestacao] = useState("RESPOSTA");

  const carregar = async () => {
    try {
      setLoading(true);
      const data = await listarMeusProcessosDisciplinares();
      setLista(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setLista([]);
    } finally {
      setLoading(false);
    }
  };

  const abrir = async (id) => {
    try {
      setLoadingDetalhe(true);
      const data = await buscarMeuProcessoDisciplinar(id);
      setSelecionado(data);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar processo");
    } finally {
      setLoadingDetalhe(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    return {
      total: lista.length,
      aguardandoCiencia: lista.filter((x) => x.status === "AGUARDANDO_CIENCIA").length,
      aguardandoManifestacao: lista.filter((x) => x.status === "AGUARDANDO_MANIFESTACAO").length,
      sancoes: lista.filter((x) => x.status === "SANCAO_APLICADA").length
    };
  }, [lista]);

  const darCiencia = async () => {
    if (!selecionado?._id) return;

    try {
      const atualizado = await confirmarCienciaProcesso(selecionado._id);
      setSelecionado(atualizado);
      await carregar();
      alert("Ciência registrada com sucesso");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao confirmar ciência");
    }
  };

  const enviarManifestacao = async () => {
    if (!selecionado?._id) return;
    if (!manifestacao.trim()) {
      alert("Informe sua manifestação");
      return;
    }

    try {
      const atualizado = await enviarManifestacaoProcesso(selecionado._id, {
        texto: manifestacao,
        tipo: tipoManifestacao
      });

      setSelecionado(atualizado);
      setManifestacao("");
      setTipoManifestacao("RESPOSTA");
      await carregar();
      alert("Manifestação enviada com sucesso");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao enviar manifestação");
    }
  };

  return (
    <div className="user-discipline-page">
      <div className="user-discipline-header">
        <div>
          <h2>Justiça & Disciplina</h2>
          <p>Acompanhe notificações formais, processos, convocações e conclusões.</p>
        </div>
      </div>

      <section className="user-discipline-summary">
        <div className="discipline-summary-card">
          <small>Processos</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="discipline-summary-card warning">
          <small>Aguardando ciência</small>
          <strong>{resumo.aguardandoCiencia}</strong>
        </div>
        <div className="discipline-summary-card alert">
          <small>Aguardando manifestação</small>
          <strong>{resumo.aguardandoManifestacao}</strong>
        </div>
        <div className="discipline-summary-card danger">
          <small>Sanções registradas</small>
          <strong>{resumo.sancoes}</strong>
        </div>
      </section>

      <div className="user-discipline-grid">
        <section className="discipline-case-list">
          <div className="discipline-block-header">
            <h3>Meus processos</h3>
          </div>

          {loading ? (
            <p>Carregando processos...</p>
          ) : lista.length === 0 ? (
            <p>Nenhum processo disciplinar registrado.</p>
          ) : (
            <div className="discipline-case-list-wrap">
              {lista.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  className={`discipline-case-card ${
                    selecionado?._id === item._id ? "active" : ""
                  }`}
                  onClick={() => abrir(item._id)}
                >
                  <div className="discipline-case-card-top">
                    <strong>{item.numero}</strong>
                    <span
                      className="discipline-status-badge"
                      style={{ borderColor: getStatusColor(item.status), color: getStatusColor(item.status) }}
                    >
                      {item.status}
                    </span>
                  </div>

                  <span>{item.tipo}</span>
                  <p>{item.descricao}</p>
                  <small>Abertura: {formatarData(item.createdAt)}</small>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="discipline-case-detail">
          {!selecionado ? (
            <div className="discipline-empty-detail">
              Selecione um processo para visualizar os detalhes.
            </div>
          ) : loadingDetalhe ? (
            <p>Carregando detalhes...</p>
          ) : (
            <div className="discipline-detail-wrap">
              <div className="discipline-detail-header">
                <div>
                  <small>Processo</small>
                  <h3>{selecionado.numero}</h3>
                </div>

                <span
                  className="discipline-status-badge"
                  style={{
                    borderColor: getStatusColor(selecionado.status),
                    color: getStatusColor(selecionado.status)
                  }}
                >
                  {selecionado.status}
                </span>
              </div>

              <div className="discipline-detail-grid">
                <div className="discipline-detail-box">
                  <small>Tipo</small>
                  <strong>{selecionado.tipo}</strong>
                </div>
                <div className="discipline-detail-box">
                  <small>Prioridade</small>
                  <strong>{selecionado.prioridade || "MEDIA"}</strong>
                </div>
                <div className="discipline-detail-box">
                  <small>Prazo de resposta</small>
                  <strong>{formatarData(selecionado.prazoResposta)}</strong>
                </div>
                <div className="discipline-detail-box">
                  <small>Ciência</small>
                  <strong>
                    {selecionado.cienciaPolicial?.confirmada ? "Confirmada" : "Pendente"}
                  </strong>
                </div>
              </div>

              <div className="discipline-detail-section">
                <h4>Descrição inicial</h4>
                <p>{selecionado.descricao}</p>
              </div>

              {Array.isArray(selecionado.convocacoes) &&
                selecionado.convocacoes.length > 0 && (
                  <div className="discipline-detail-section">
                    <h4>Convocações</h4>
                    <div className="discipline-timeline">
                      {selecionado.convocacoes.map((item, index) => (
                        <div key={index} className="discipline-timeline-item">
                          <strong>{item.mensagem}</strong>
                          <small>Data: {formatarData(item.dataAudiencia)}</small>
                          <small>Local: {item.local || "-"}</small>
                          <small>Registrado em: {formatarData(item.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {Array.isArray(selecionado.comentarios) &&
                selecionado.comentarios.length > 0 && (
                  <div className="discipline-detail-section">
                    <h4>Comunicações do SJD</h4>
                    <div className="discipline-timeline">
                      {selecionado.comentarios.map((item, index) => (
                        <div key={index} className="discipline-timeline-item">
                          <strong>
                            {item.autor?.patente ? `${item.autor.patente} ` : ""}
                            {item.autor?.nome || "SJD"}
                          </strong>
                          <p>{item.texto}</p>
                          <small>{formatarData(item.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {Array.isArray(selecionado.manifestacoes) &&
                selecionado.manifestacoes.length > 0 && (
                  <div className="discipline-detail-section">
                    <h4>Minhas manifestações</h4>
                    <div className="discipline-timeline">
                      {selecionado.manifestacoes.map((item, index) => (
                        <div key={index} className="discipline-timeline-item">
                          <strong>{item.tipo}</strong>
                          <p>{item.texto}</p>
                          <small>{formatarData(item.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {Array.isArray(selecionado.artigosPenais) &&
                selecionado.artigosPenais.length > 0 && (
                  <div className="discipline-detail-section">
                    <h4>Artigos do Código Penal aplicados</h4>
                    <div className="discipline-chip-row">
                      {selecionado.artigosPenais.map((item, index) => (
                        <span key={index} className="discipline-chip">
                          {item.artigo} — {item.titulo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {Array.isArray(selecionado.artigosDisciplinares) &&
                selecionado.artigosDisciplinares.length > 0 && (
                  <div className="discipline-detail-section">
                    <h4>Enquadramentos disciplinares</h4>
                    <div className="discipline-chip-row">
                      {selecionado.artigosDisciplinares.map((item, index) => (
                        <span key={index} className="discipline-chip">
                          {item.codigo} — {item.titulo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {selecionado.status !== "CONCLUIDO" &&
                selecionado.status !== "ARQUIVADO" &&
                selecionado.status !== "SANCAO_APLICADA" && (
                  <div className="discipline-detail-section">
                    <h4>Ações do policial</h4>

                    {!selecionado.cienciaPolicial?.confirmada && (
                      <button type="button" onClick={darCiencia}>
                        Confirmar ciência do processo
                      </button>
                    )}

                    <div className="discipline-manifest-box">
                      <select
                        value={tipoManifestacao}
                        onChange={(e) => setTipoManifestacao(e.target.value)}
                      >
                        <option value="RESPOSTA">Resposta</option>
                        <option value="ESCLARECIMENTO">Esclarecimento</option>
                        <option value="DEFESA">Defesa</option>
                      </select>

                      <textarea
                        rows="5"
                        placeholder="Escreva sua manifestação formal"
                        value={manifestacao}
                        onChange={(e) => setManifestacao(e.target.value)}
                      />

                      <button type="button" onClick={enviarManifestacao}>
                        Enviar manifestação
                      </button>
                    </div>
                  </div>
                )}

              {selecionado.conclusao?.texto && (
                <div className="discipline-detail-section">
                  <h4>Conclusão</h4>
                  <p>{selecionado.conclusao.texto}</p>
                  <small>{formatarData(selecionado.conclusao.data)}</small>
                </div>
              )}

              {selecionado.sancaoFinal?.tipo && (
                <div className="discipline-detail-section sanction">
                  <h4>Sanção final</h4>
                  <p><strong>Tipo:</strong> {selecionado.sancaoFinal.tipo}</p>
                  <p><strong>PAD:</strong> {selecionado.sancaoFinal.padNivel || 0}/3</p>
                  <p><strong>Descrição:</strong> {selecionado.sancaoFinal.descricao || "-"}</p>
                  <small>{formatarData(selecionado.sancaoFinal.dataAplicacao)}</small>
                </div>
              )}

              {Array.isArray(selecionado.historico) &&
                selecionado.historico.length > 0 && (
                  <div className="discipline-detail-section">
                    <h4>Linha do tempo processual</h4>
                    <div className="discipline-timeline">
                      {selecionado.historico.map((item, index) => (
                        <div key={index} className="discipline-timeline-item">
                          <strong>{item.acao}</strong>
                          <p>{item.descricao || "-"}</p>
                          <small>{formatarData(item.createdAt)}</small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}