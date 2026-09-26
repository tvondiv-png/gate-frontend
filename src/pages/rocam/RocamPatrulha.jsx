import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import "../../styles/rocam-dashboard.css";
import "../../styles/rocam-patrulha.css";

const MINIMO_PATRULHA_MIN = 360;

const TITULO_PAPEL = {
  COMANDO_ROCAM: "Comando ROCAM",
  SUBCOMANDO_ROCAM: "Subcomando ROCAM",
  BRACAL_ROCAM: "Braçal ROCAM",
  ESTAGIARIO_ROCAM: "Estagiário ROCAM"
};

const formatarMinutos = (min) => {
  const valor = Number(min || 0);
  if (!valor) return "0h";
  const h = Math.floor(valor / 60);
  const m = valor % 60;
  if (!h) return `${m}min`;
  if (!m) return `${h}h`;
  return `${h}h ${m}min`;
};

const badgeClassePatrulha = (min) => {
  if ((min || 0) === 0) return "danger";
  if ((min || 0) < MINIMO_PATRULHA_MIN) return "warning";
  return "success";
};

export default function RocamPatrulha() {
  const toast = useToast();

  const [patrulha, setPatrulha] = useState(null);
  const [efetivo, setEfetivo] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [papelFiltro, setPapelFiltro] = useState("");

  useEffect(() => {
    api
      .get("/api/rocam/comando/horas")
      .then((r) => {
        setEfetivo(Array.isArray(r.data?.efetivo) ? r.data.efetivo : []);
        setResumo(r.data?.resumo || null);
      })
      .catch(() => toast.error("Erro ao carregar as horas do efetivo ROCAM"))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    let ativo = true;

    const carregarPatrulha = () => {
      api
        .get("/api/rocam/comando/patrulha-ao-vivo")
        .then((r) => {
          if (ativo) setPatrulha(r?.data || null);
        })
        .catch(() => {});
    };

    carregarPatrulha();
    const intervalo = setInterval(carregarPatrulha, 30000);

    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, []);

  const filtrados = useMemo(() => {
    return efetivo.filter((item) => {
      const texto = [item.funcional, item.nome, item.patente]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = busca.trim()
        ? texto.includes(busca.trim().toLowerCase())
        : true;

      const okPapel = papelFiltro ? item.papelRocam === papelFiltro : true;

      return okBusca && okPapel;
    });
  }, [efetivo, busca, papelFiltro]);

  return (
    <div className="rocam-dashboard-page">
      <section className="rocam-dashboard-hero">
        <div>
          <span className="rocam-dashboard-kicker">ROCAM • 2º BPChq</span>
          <h1>Patrulhamento e horas do efetivo</h1>
          <p>
            Quem está patrulhando de ROCAM agora e o acompanhamento de horas
            de todo o efetivo (Comando, Subcomando, Braçais e Estagiários).
          </p>
        </div>
      </section>

      {/* ============ PATRULHAMENTO AO VIVO ============ */}
      <section className="rocam-dashboard-card">
        <div className="rocam-dashboard-card-title">
          <div>
            <small>
              <span className="rd-live-dot" /> AO VIVO
            </small>
            <h2>Patrulhamento ROCAM agora</h2>
          </div>
          <span className="rd-pill">atualiza a cada 30s</span>
        </div>

        {!patrulha ? (
          <p className="rd-muted">Carregando...</p>
        ) : (
          <>
            <div className="rd-stat-row">
              <div className="rd-stat">
                <strong>{patrulha.totalViaturas}</strong>
                <span>Viaturas ROCAM ativas</span>
              </div>
              <div className="rd-stat">
                <strong>{patrulha.totalPoliciais}</strong>
                <span>Policiais em patrulha</span>
              </div>
            </div>

            {patrulha.viaturas.length === 0 ? (
              <p className="rd-muted" style={{ marginTop: 12 }}>
                Nenhuma viatura ROCAM em patrulhamento agora.
              </p>
            ) : (
              <div className="rocam-patrulha-viaturas">
                {patrulha.viaturas.map((v) => (
                  <div key={v.id} className="rocam-patrulha-viatura">
                    <strong>{v.viatura}</strong>
                    <small>
                      desde{" "}
                      {new Date(v.desde).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </small>
                    {v.integrantes.map((i, idx) => (
                      <div key={idx} className="rocam-patrulha-integrante">
                        {i.patente} {i.nome}
                        {i.cargo ? ` · ${i.cargo}` : ""}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* ============ RESUMO DE HORAS ============ */}
      {resumo && (
        <section className="rocam-dashboard-card">
          <div className="rocam-dashboard-card-title">
            <div>
              <small>EFETIVO ROCAM</small>
              <h2>Horas de patrulha</h2>
            </div>
          </div>

          <div className="rd-stat-row">
            <div className="rd-stat">
              <strong>{resumo.total}</strong>
              <span>Efetivo ativo</span>
            </div>
            <div className={`rd-stat ${resumo.zeroSemana > 0 ? "alerta" : ""}`}>
              <strong>{resumo.zeroSemana}</strong>
              <span>Sem horas de ROCAM na semana</span>
            </div>
            <div className="rd-stat destaque">
              <strong>{formatarMinutos(resumo.mediaRocamSemanaMin)}</strong>
              <span>Média de ROCAM na semana</span>
            </div>
            <div className="rd-stat destaque">
              <strong>{formatarMinutos(resumo.totalRocamMesMin)}</strong>
              <span>Total de ROCAM no mês (efetivo)</span>
            </div>
          </div>

          <p className="rd-muted" style={{ marginTop: 10 }}>
            "ROCAM" conta só as horas de RSOs feitos em viatura ROCAM. As
            colunas "Horas semana/mês" (sem o rótulo) somam viatura comum +
            ROCAM, igual ao painel ADM.
          </p>
        </section>
      )}

      {/* ============ TABELA DO EFETIVO ============ */}
      <section className="rocam-dashboard-card">
        <div className="rocam-dashboard-card-title">
          <div>
            <small>DETALHAMENTO</small>
            <h2>Horas por policial</h2>
          </div>
        </div>

        <div className="rocam-patrulha-filtros">
          <input
            className="rocam-patrulha-input"
            placeholder="Buscar por nome, funcional ou patente"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="rocam-patrulha-select"
            value={papelFiltro}
            onChange={(e) => setPapelFiltro(e.target.value)}
          >
            <option value="">Todas as funções</option>
            <option value="COMANDO_ROCAM">Comando ROCAM</option>
            <option value="SUBCOMANDO_ROCAM">Subcomando ROCAM</option>
            <option value="BRACAL_ROCAM">Braçal ROCAM</option>
            <option value="ESTAGIARIO_ROCAM">Estagiário ROCAM</option>
          </select>
        </div>

        {loading ? (
          <p className="rd-muted">Carregando...</p>
        ) : (
          <div className="rocam-patrulha-table-wrap">
            <table className="rocam-patrulha-table">
              <thead>
                <tr>
                  <th>Funcional</th>
                  <th>Nome</th>
                  <th>Patente</th>
                  <th>Função ROCAM</th>
                  <th>Horas semana</th>
                  <th>Horas mês</th>
                  <th>ROCAM semana</th>
                  <th>ROCAM mês</th>
                  <th>Faixa</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: "center" }}>
                      Nenhum policial encontrado para esse filtro.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((item) => (
                    <tr key={item.user}>
                      <td>{item.funcional}</td>
                      <td>{item.nome}</td>
                      <td>{item.patente || "-"}</td>
                      <td>{TITULO_PAPEL[item.papelRocam] || item.papelRocam}</td>
                      <td>{formatarMinutos(item.horasSemanaMin)}</td>
                      <td>{formatarMinutos(item.horasMesMin)}</td>
                      <td>{formatarMinutos(item.horasRocamSemanaMin)}</td>
                      <td>{formatarMinutos(item.horasRocamMesMin)}</td>
                      <td>
                        <span
                          className={`rocam-patrulha-badge ${badgeClassePatrulha(
                            item.horasSemanaMin
                          )}`}
                        >
                          {(item.horasSemanaMin || 0) === 0
                            ? "0h"
                            : (item.horasSemanaMin || 0) < MINIMO_PATRULHA_MIN
                            ? "< 6h"
                            : "Meta cumprida"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
