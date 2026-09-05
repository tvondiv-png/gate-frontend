import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

const statusBadge = (status) => {
  if (status === "Aprovado") return "success";
  if (status === "Rejeitado") return "danger";
  if (status === "Ativo") return "info";
  if (status === "Pendente") return "warning";
  return "warning";
};

const formatarDataHora = (valor) => {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
};

const formatarTempo = (min) => {
  const valor = Number(min || 0);

  if (valor <= 0) return "0 min";

  const h = Math.floor(valor / 60);
  const m = valor % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const somarQuantidadeApreensoes = (apreensoes = []) => {
  return (Array.isArray(apreensoes) ? apreensoes : []).reduce((total, item) => {
    return total + Number(item?.quantidade || 0);
  }, 0);
};

const montarIntegrantesComTempo = (rso) => {
  const integrantes = [];

  const chefe = rso?.equipeFixa?.chefe;
  const auxiliar = rso?.equipeFixa?.auxiliar;

  if (chefe) {
    integrantes.push({
      tipoEquipe: "Equipe fixa",
      cargo: chefe.cargo || "Chefe",
      patente: chefe.patente || "",
      nome: chefe.nome || "",
      funcional: chefe.funcional || "",
      horaEntrada: chefe.horaEntrada || null,
      horaSaida: chefe.horaSaida || null,
      tempoMinutos: Number(chefe.tempoMinutos || 0)
    });
  }

  if (auxiliar) {
    integrantes.push({
      tipoEquipe: "Equipe fixa",
      cargo: auxiliar.cargo || "Auxiliar",
      patente: auxiliar.patente || "",
      nome: auxiliar.nome || "",
      funcional: auxiliar.funcional || "",
      horaEntrada: auxiliar.horaEntrada || null,
      horaSaida: auxiliar.horaSaida || null,
      tempoMinutos: Number(auxiliar.tempoMinutos || 0)
    });
  }

  Object.entries(rso?.equipeRotativa || {}).forEach(([cargoLista, lista]) => {
    if (!Array.isArray(lista)) return;

    lista.forEach((p) => {
      integrantes.push({
        tipoEquipe: "Equipe rotativa",
        cargo: p?.cargo || cargoLista || "-",
        patente: p?.patente || "",
        nome: p?.nome || "",
        funcional: p?.funcional || "",
        horaEntrada: p?.horaEntrada || null,
        horaSaida: p?.horaSaida || null,
        tempoMinutos: Number(p?.tempoMinutos || 0)
      });
    });
  });

  return integrantes.sort((a, b) => b.tempoMinutos - a.tempoMinutos);
};

export default function RSOHistoryAdmin() {
  const [items, setItems] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [viatura, setViatura] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/rso/historico");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar histórico de RSO.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await api.get("/api/admin/rso/historico");

        if (mounted) {
          setItems(Array.isArray(res.data) ? res.data : []);
        }
      } catch (err) {
        console.error(err);

        if (mounted) {
          alert("Erro ao carregar histórico de RSO.");
          setItems([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return items.filter((item) => {
      const okStatus = status === "todos" ? true : item.status === status;

      const okViatura = viatura
        ? String(item.viatura || "").trim().toLowerCase() ===
          String(viatura).trim().toLowerCase()
        : true;

      const texto = [
        item.viatura,
        item.status,
        item.equipeFixa?.chefe?.nome,
        item.equipeFixa?.auxiliar?.nome,
        item.equipeFixa?.chefe?.funcional,
        item.equipeFixa?.auxiliar?.funcional,
        item.observacoes,
        item.comentarioADM,
        ...(Array.isArray(item.apreensoes)
          ? item.apreensoes.flatMap((a) => [a?.tipo, a?.quantidade])
          : [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = termo ? texto.includes(termo) : true;

      return okStatus && okViatura && okBusca;
    });
  }, [items, busca, status, viatura]);

  const resumo = useMemo(() => {
    return {
      total: items.length,
      aprovados: items.filter((i) => i.status === "Aprovado").length,
      rejeitados: items.filter((i) => i.status === "Rejeitado").length,
      ativos: items.filter((i) => i.status === "Ativo").length
    };
  }, [items]);

  const viaturas = useMemo(() => {
    return [...new Set(items.map((item) => item.viatura).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR")
    );
  }, [items]);

  const rankingApreensoes = useMemo(() => {
    return items
      .filter((item) => Array.isArray(item.apreensoes) && item.apreensoes.length > 0)
      .map((item) => ({
        ...item,
        totalApreensoesQuantidade: somarQuantidadeApreensoes(item.apreensoes),
        totalTiposApreensoes: item.apreensoes.length,
        integrantesComTempo: montarIntegrantesComTempo(item)
      }))
      .sort((a, b) => {
        if (b.totalApreensoesQuantidade !== a.totalApreensoesQuantidade) {
          return b.totalApreensoesQuantidade - a.totalApreensoesQuantidade;
        }

        if (b.totalTiposApreensoes !== a.totalTiposApreensoes) {
          return b.totalTiposApreensoes - a.totalTiposApreensoes;
        }

        return new Date(b.createdAt) - new Date(a.createdAt);
      });
  }, [items]);

  const melhorApreensao = rankingApreensoes[0] || null;
  const topRankingCompacto = rankingApreensoes.slice(0, 5);

  const equipeRotativa = (rso) => {
    return Object.entries(rso?.equipeRotativa || {}).flatMap(([cargo, lista]) =>
      Array.isArray(lista)
        ? lista.map((p, index) => ({
            ...p,
            cargoLista: cargo,
            key: `${cargo}-${p?.funcional || index}-${p?.horaEntrada || ""}`
          }))
        : []
    );
  };

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Histórico de RSO</h1>
          <p>Consulta administrativa avançada dos registros operacionais já processados.</p>
        </div>

        <button className="admin-module-btn blue" onClick={load} disabled={loading}>
          {loading ? "Carregando..." : "Recarregar"}
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Aprovados</small>
          <strong>{resumo.aprovados}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Rejeitados</small>
          <strong>{resumo.rejeitados}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Ativos</small>
          <strong>{resumo.ativos}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Destaque de apreensão</h2>
            <span>Viatura com melhor resultado e ranking compacto.</span>
          </div>
        </div>

        {!melhorApreensao ? (
          <div className="admin-module-empty">Nenhuma apreensão registrada até o momento.</div>
        ) : (
          <div className="rso-apreensao-premium-layout">
            <div className="rso-apreensao-featured-card">
              <div className="rso-apreensao-featured-top">
                <div>
                  <span className="rso-apreensao-kicker">MELHOR APREENSÃO</span>
                  <h3>{melhorApreensao.viatura || "-"}</h3>
                  <p>{formatarDataHora(melhorApreensao.createdAt)}</p>
                </div>

                <button
                  className="admin-module-btn blue"
                  onClick={() => setSelecionado(melhorApreensao)}
                >
                  Ver detalhes
                </button>
              </div>

              <div className="rso-apreensao-metrics">
                <div className="rso-apreensao-metric">
                  <small>Total apreendido</small>
                  <strong>{melhorApreensao.totalApreensoesQuantidade}</strong>
                </div>

                <div className="rso-apreensao-metric">
                  <small>Tipos</small>
                  <strong>{melhorApreensao.totalTiposApreensoes}</strong>
                </div>

                <div className="rso-apreensao-metric">
                  <small>Status</small>
                  <strong>{melhorApreensao.status || "-"}</strong>
                </div>
              </div>

              <div className="rso-apreensao-inline-section">
                <strong>Apreensões</strong>
                <div className="rso-apreensao-pill-list">
                  {melhorApreensao.apreensoes.map((a, index) => (
                    <div key={`${a?.tipo || "apreensao"}-${index}`} className="rso-apreensao-pill">
                      <span>{a?.tipo || "-"}</span>
                      <strong>{a?.quantidade ?? 0}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rso-apreensao-inline-section">
                <strong>Integrantes e PTR</strong>
                <div className="rso-apreensao-integrantes-list">
                  {melhorApreensao.integrantesComTempo.length > 0 ? (
                    melhorApreensao.integrantesComTempo.map((p, index) => (
                      <div
                        key={`${p.funcional || index}-${p.horaEntrada || ""}-${p.cargo || ""}`}
                        className="rso-apreensao-integrante-item"
                      >
                        <div>
                          <strong>{p.patente} {p.nome}</strong>
                          <p>
                            {p.cargo} • {p.tipoEquipe} • Funcional {p.funcional || "-"}
                          </p>
                        </div>
                        <span>{formatarTempo(p.tempoMinutos)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="admin-module-empty">Sem integrantes registrados.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="rso-apreensao-ranking-card">
              <div className="rso-apreensao-ranking-header">
                <h3>Ranking de apreensões</h3>
                <span>Top 5</span>
              </div>

              <div className="rso-apreensao-ranking-list">
                {topRankingCompacto.map((item, index) => (
                  <button
                    key={`${item._id}-${index}`}
                    type="button"
                    className="rso-apreensao-ranking-item"
                    onClick={() => setSelecionado(item)}
                  >
                    <div className="rso-apreensao-ranking-pos">{index + 1}º</div>

                    <div className="rso-apreensao-ranking-main">
                      <strong>{item.viatura || "-"}</strong>
                      <p>
                        {item.equipeFixa?.chefe?.nome || "Sem chefe"} •{" "}
                        {formatarDataHora(item.createdAt)}
                      </p>
                    </div>

                    <div className="rso-apreensao-ranking-side">
                      <strong>{item.totalApreensoesQuantidade}</strong>
                      <small>itens</small>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="admin-module-section">
        <div className="admin-module-grid">
          <input
            className="admin-module-input"
            placeholder="Buscar por viatura, policial, funcional, status ou observação"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="todos">Todos os status</option>
            <option value="Pendente">Pendente</option>
            <option value="Ativo">Ativo</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Rejeitado">Rejeitado</option>
          </select>

          <select
            className="admin-module-select"
            value={viatura}
            onChange={(e) => setViatura(e.target.value)}
          >
            <option value="">Todas as viaturas</option>
            {viaturas.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <button
            className="admin-module-btn"
            onClick={() => {
              setBusca("");
              setStatus("todos");
              setViatura("");
            }}
          >
            Limpar filtros
          </button>
        </div>
      </section>

      {loading && (
        <section className="admin-module-section">
          <div className="admin-module-empty">Carregando histórico...</div>
        </section>
      )}

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Lista de RSOs</h2>
            <span>Total filtrado: {filtrados.length}</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Viatura</th>
                <th>Status</th>
                <th>Chefe</th>
                <th>Auxiliar</th>
                <th>Criado em</th>
                <th>Tempo total</th>
                <th>Total apreendido</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    Nenhum RSO encontrado.
                  </td>
                </tr>
              ) : (
                filtrados.map((item) => (
                  <tr key={item._id}>
                    <td>{item.viatura || "-"}</td>
                    <td>
                      <span className={`admin-module-badge ${statusBadge(item.status)}`}>
                        {item.status || "-"}
                      </span>
                    </td>
                    <td>
                      {item.equipeFixa?.chefe
                        ? `${item.equipeFixa.chefe.nome} (${item.equipeFixa.chefe.funcional})`
                        : "-"}
                    </td>
                    <td>
                      {item.equipeFixa?.auxiliar
                        ? `${item.equipeFixa.auxiliar.nome} (${item.equipeFixa.auxiliar.funcional})`
                        : "-"}
                    </td>
                    <td>{formatarDataHora(item.createdAt)}</td>
                    <td>{formatarTempo(item.totalMinutos || 0)}</td>
                    <td>{somarQuantidadeApreensoes(item.apreensoes)}</td>
                    <td>
                      <button
                        className="admin-module-btn"
                        onClick={() => setSelecionado(item)}
                      >
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

      {selecionado && (
        <div className="admin-module-modal-backdrop" onClick={() => setSelecionado(null)}>
          <div className="admin-module-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-module-section-title">
              <div>
                <h2>{selecionado.viatura || "RSO"}</h2>
                <span>{formatarDataHora(selecionado.createdAt)}</span>
              </div>
            </div>

            <div className="admin-module-kv-grid">
              <div className="admin-module-kv">
                <small>Status</small>
                <div>{selecionado.status || "-"}</div>
              </div>
              <div className="admin-module-kv">
                <small>Tempo total</small>
                <div>{formatarTempo(selecionado.totalMinutos || 0)}</div>
              </div>
              <div className="admin-module-kv">
                <small>Comentário ADM</small>
                <div>{selecionado.comentarioADM || "-"}</div>
              </div>
              <div className="admin-module-kv">
                <small>Encerrado em</small>
                <div>{formatarDataHora(selecionado.updatedAt)}</div>
              </div>
              <div className="admin-module-kv">
                <small>Total apreendido</small>
                <div>{somarQuantidadeApreensoes(selecionado.apreensoes)}</div>
              </div>
            </div>

            <div className="admin-module-grid-2">
              <div className="admin-module-section" style={{ padding: 14 }}>
                <strong>Equipe fixa</strong>
                <div className="admin-module-card-list" style={{ marginTop: 12 }}>
                  {[selecionado.equipeFixa?.chefe, selecionado.equipeFixa?.auxiliar]
                    .filter(Boolean)
                    .map((p, index) => (
                      <div key={`${p?.funcional || index}-${p?.horaEntrada || ""}`} className="admin-module-card">
                        <strong>{p.cargo || "-"}</strong>
                        <p>{p.patente} {p.nome}</p>
                        <p>Funcional: {p.funcional}</p>
                        <p>Entrada: {formatarDataHora(p.horaEntrada)}</p>
                        <p>Saída: {formatarDataHora(p.horaSaida)}</p>
                        <p>Tempo: {formatarTempo(p.tempoMinutos)}</p>
                      </div>
                    ))}
                </div>
              </div>

              <div className="admin-module-section" style={{ padding: 14 }}>
                <strong>Equipe rotativa</strong>
                <div className="admin-module-card-list" style={{ marginTop: 12 }}>
                  {equipeRotativa(selecionado).length > 0 ? (
                    equipeRotativa(selecionado).map((p) => (
                      <div key={p.key} className="admin-module-card">
                        <strong>{p.cargo || p.cargoLista || "-"}</strong>
                        <p>{p.patente} {p.nome}</p>
                        <p>Funcional: {p.funcional}</p>
                        <p>Entrada: {formatarDataHora(p.horaEntrada)}</p>
                        <p>Saída: {formatarDataHora(p.horaSaida)}</p>
                        <p>Tempo: {formatarTempo(p.tempoMinutos)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="admin-module-empty">Sem equipe rotativa registrada.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-module-grid-2">
              <div className="admin-module-section" style={{ padding: 14 }}>
                <strong>Observações</strong>
                <p style={{ marginTop: 10 }}>{selecionado.observacoes || "-"}</p>
              </div>

              <div className="admin-module-section" style={{ padding: 14 }}>
                <strong>Apreensões</strong>
                {Array.isArray(selecionado.apreensoes) && selecionado.apreensoes.length > 0 ? (
                  <div className="admin-module-card-list" style={{ marginTop: 12 }}>
                    {selecionado.apreensoes.map((a, index) => (
                      <div
                        key={`${a?.tipo || "apreensao"}-${index}`}
                        className="admin-module-card"
                      >
                        <strong>{a.tipo || "-"}</strong>
                        <p>Quantidade: {a.quantidade ?? 0}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ marginTop: 10 }}>Nenhuma apreensão registrada.</p>
                )}
              </div>
            </div>

            <div className="admin-module-actions">
              <button
                className="admin-module-btn blue"
                onClick={() => setSelecionado(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}