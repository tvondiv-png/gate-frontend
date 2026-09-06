import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import api from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import "../../styles/rocam-dashboard.css";

const formatarData = (data) => {
  if (!data) return "-";
  const v = new Date(data);
  return Number.isNaN(v.getTime()) ? "-" : v.toLocaleDateString("pt-BR");
};

const TITULO_PAPEL = {
  COMANDO_ROCAM: "Comando ROCAM",
  SUBCOMANDO_ROCAM: "Subcomando ROCAM",
  BRACAL_ROCAM: "Braçal ROCAM",
  ESTAGIARIO_ROCAM: "Estagiário ROCAM"
};

const LABEL_STATUS_ESTAGIO = {
  EM_ANDAMENTO: "Em andamento",
  APTO_APROVACAO: "Apto para aprovação",
  APROVACAO_SOLICITADA: "Aprovação solicitada"
};

function Barra({ pct }) {
  const v = Math.max(0, Math.min(100, Number(pct || 0)));
  return (
    <div className="rd-bar">
      <div className="rd-bar-fill" style={{ width: `${v}%` }} />
    </div>
  );
}

export default function RocamDashboard() {
  const toast = useToast();
  const { contexto } = useOutletContext();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const profile = contexto?.profile;
  const hierarchy = contexto?.hierarchy;
  const papel = contexto?.papelRocam;
  const tituloPapel = TITULO_PAPEL[papel];

  useEffect(() => {
    api
      .get("/api/rocam/dashboard")
      .then((res) => setData(res.data))
      .catch(() => toast.error("Erro ao carregar o dashboard ROCAM"))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="rocam-dashboard-page">
      {/* HERO */}
      <section className="rocam-dashboard-hero">
        <div>
          <span className="rocam-dashboard-kicker">ROCAM • 2º BPChq</span>
          <h1>
            {hierarchy?.nome
              ? `Bem-vindo, ${hierarchy.nome}`
              : "Painel ROCAM"}
          </h1>
          <p>
            Acompanhamento operacional, estágio, avaliações, patrulhamento e
            histórico ROCAM.
          </p>
        </div>

        <div className="rocam-dashboard-role">
          <small>SITUAÇÃO ROCAM</small>
          <strong>{tituloPapel || "ROCAM"}</strong>
          <span>
            {profile?.situacaoRocam ||
              (contexto?.podeGerenciar ? "ACESSO DE GESTÃO" : "-")}
          </span>
        </div>
      </section>

      {/* DADOS */}
      <section className="rocam-dashboard-summary">
        <div className="rocam-dashboard-summary-card">
          <small>Patente</small>
          <strong>{hierarchy?.patente || "-"}</strong>
        </div>
        <div className="rocam-dashboard-summary-card">
          <small>Funcional</small>
          <strong>{hierarchy?.funcional || "-"}</strong>
        </div>
        <div className="rocam-dashboard-summary-card">
          <small>Ingresso ROCAM</small>
          <strong>{formatarData(profile?.dataIngressoRocam)}</strong>
        </div>
        <div className="rocam-dashboard-summary-card destaque">
          <small>Vínculo</small>
          <strong>{tituloPapel || "Supervisão"}</strong>
        </div>
      </section>

      {loading && (
        <div className="rocam-dashboard-empty">Carregando dados...</div>
      )}

      {/* ============ ESTAGIÁRIO ============ */}
      {!loading && data?.estagio && (
        <section className="rocam-dashboard-card">
          <div className="rocam-dashboard-card-title">
            <div>
              <small>MEU ESTÁGIO</small>
              <h2>Progresso</h2>
            </div>
            <span className="rd-pill">
              {LABEL_STATUS_ESTAGIO[data.estagio.status] || data.estagio.status}
            </span>
          </div>

          <div className="rd-progress-head">
            <div className="rd-progress-num">
              {data.estagio.percentualGeral.toFixed(0)}
              <span>%</span>
            </div>
            <div style={{ flex: 1 }}>
              <Barra pct={data.estagio.percentualGeral} />
              <small className="rd-muted">
                {data.estagio.diasDecorridos} dia(s) de estágio · início{" "}
                {formatarData(data.estagio.dataInicio)}
              </small>
            </div>
          </div>

          <div className="rd-metas-grid">
            {data.estagio.checklist.map((m, i) => (
              <div key={i} className={`rd-meta ${m.ok ? "ok" : "pendente"}`}>
                <span className="rd-meta-label">{m.label}</span>
                <strong>
                  {m.atual}
                  <span className="rd-muted"> / {m.meta}</span>
                </strong>
                <span className="rd-meta-status">{m.ok ? "✓" : "•"}</span>
              </div>
            ))}
          </div>

          {data.estagio.pendencias.length > 0 && (
            <p className="rd-pendencias">
              Falta atingir: {data.estagio.pendencias.join(", ")}.
            </p>
          )}
        </section>
      )}

      {!loading && papel === "ESTAGIARIO_ROCAM" && !data?.estagio && (
        <section className="rocam-dashboard-card">
          <div className="rocam-dashboard-empty">
            Nenhum estágio ativo encontrado. Fale com o Comando ROCAM.
          </div>
        </section>
      )}

      {!loading && data?.minhasAvaliacoes?.length > 0 && (
        <section className="rocam-dashboard-card">
          <div className="rocam-dashboard-card-title">
            <div>
              <small>AVALIAÇÕES RECEBIDAS</small>
              <h2>Últimas avaliações</h2>
            </div>
          </div>
          <div className="rd-list">
            {data.minhasAvaliacoes.map((a) => (
              <div key={a._id} className="rd-list-row">
                <div>
                  <strong>{a.nomeAvaliador}</strong>
                  <small className="rd-muted">
                    {formatarData(a.dataAvaliacao)}
                  </small>
                </div>
                <span className="rd-nota">
                  {Number(a.notaPercentual || 0).toFixed(0)}%
                </span>
                <span className={`rd-tag ${String(a.status).toLowerCase()}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ BRAÇAL ============ */}
      {!loading && data?.bracal && (
        <section className="rocam-dashboard-card">
          <div className="rocam-dashboard-card-title">
            <div>
              <small>BRAÇAL ROCAM</small>
              <h2>Avaliações</h2>
            </div>
          </div>
          <div className="rd-stat-row">
            <div className="rd-stat">
              <strong>{data.bracal.estagiariosAtivos}</strong>
              <span>Estagiários ativos</span>
            </div>
            <div className="rd-stat">
              <strong>{data.bracal.avaliacoesNoMes}</strong>
              <span>Suas avaliações no mês</span>
            </div>
            <div className={`rd-stat ${data.bracal.devolvidas > 0 ? "alerta" : ""}`}>
              <strong>{data.bracal.devolvidas}</strong>
              <span>Devolvidas para refazer</span>
            </div>
          </div>
        </section>
      )}

      {/* ============ COMANDO ============ */}
      {!loading && data?.comando && (
        <>
          <section className="rocam-dashboard-card">
            <div className="rocam-dashboard-card-title">
              <div>
                <small>COMANDO ROCAM</small>
                <h2>Efetivo</h2>
              </div>
              <span className="rd-pill">
                {data.comando.efetivo.total} ativos
              </span>
            </div>
            <div className="rd-stat-row">
              <div className="rd-stat">
                <strong>{data.comando.efetivo.comando}</strong>
                <span>Comando</span>
              </div>
              <div className="rd-stat">
                <strong>{data.comando.efetivo.subcomando}</strong>
                <span>Subcomando</span>
              </div>
              <div className="rd-stat">
                <strong>{data.comando.efetivo.bracal}</strong>
                <span>Braçais</span>
              </div>
              <div className="rd-stat">
                <strong>{data.comando.efetivo.estagiario}</strong>
                <span>Estagiários</span>
              </div>
            </div>
          </section>

          <section className="rocam-dashboard-card">
            <div className="rocam-dashboard-card-title">
              <div>
                <small>ESTÁGIOS</small>
                <h2>Situação</h2>
              </div>
            </div>
            <div className="rd-stat-row">
              <div className="rd-stat">
                <strong>{data.comando.estagios.emAndamento}</strong>
                <span>Em andamento</span>
              </div>
              <div className={`rd-stat ${data.comando.estagios.aptoAprovacao > 0 ? "info" : ""}`}>
                <strong>{data.comando.estagios.aptoAprovacao}</strong>
                <span>Aptos para aprovação</span>
              </div>
              <div className={`rd-stat ${data.comando.estagios.aguardandoAprovacao > 0 ? "alerta" : ""}`}>
                <strong>{data.comando.estagios.aguardandoAprovacao}</strong>
                <span>Aguardando decisão</span>
              </div>
              <div className={`rd-stat ${data.comando.avaliacoesPendentes > 0 ? "alerta" : ""}`}>
                <strong>{data.comando.avaliacoesPendentes}</strong>
                <span>Avaliações p/ homologar</span>
              </div>
            </div>
          </section>

          {data.comando.alertas.length > 0 && (
            <section className="rocam-dashboard-card">
              <div className="rocam-dashboard-card-title">
                <div>
                  <small>ATENÇÃO</small>
                  <h2>Alertas</h2>
                </div>
              </div>
              <div className="rd-alertas">
                {data.comando.alertas.map((a, i) => (
                  <div key={i} className="rd-alerta">
                    <span className="rd-alerta-dot" />
                    {a.texto}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* ============ HISTÓRICO ============ */}
      {!loading && data?.historico?.length > 0 && (
        <section className="rocam-dashboard-card">
          <div className="rocam-dashboard-card-title">
            <div>
              <small>HISTÓRICO ROCAM</small>
              <h2>Linha do tempo</h2>
            </div>
          </div>
          <div className="rd-timeline">
            {data.historico.map((h) => (
              <div key={h._id} className="rd-timeline-item">
                <span className="rd-timeline-dot" />
                <div>
                  <strong>{h.titulo}</strong>
                  {h.descricao && <p className="rd-muted">{h.descricao}</p>}
                  <small className="rd-muted">{formatarData(h.dataEvento)}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
