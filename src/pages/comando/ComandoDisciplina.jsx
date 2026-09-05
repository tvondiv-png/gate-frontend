import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

const badgePrioridade = (prioridade) => {
  if (prioridade === "URGENTE") return "danger";
  if (prioridade === "ALTA") return "warning";
  return "info";
};

const badgeStatus = (status) => {
  if (status === "CONCLUIDO" || status === "ARQUIVADO") return "success";
  if (
    status === "ABERTO" ||
    status === "AGUARDANDO_CIENCIA" ||
    status === "AGUARDANDO_MANIFESTACAO" ||
    status === "EM_ANALISE" ||
    status === "CONVOCADO"
  ) {
    return "warning";
  }
  return "info";
};

const getAdvertenciasAcumuladas = (tipo) => {
  if (tipo === "ADV 3") return ["ADV 1", "ADV 2", "ADV 3"];
  if (tipo === "ADV 2") return ["ADV 1", "ADV 2"];
  if (tipo === "ADV 1") return ["ADV 1"];
  return [];
};

const badgeAdvertencia = (tipo) => {
  if (tipo === "ADV 3") return "danger";
  if (tipo === "ADV 2") return "warning";
  return "info";
};

const formatarData = (data) => {
  if (!data) return "-";
  return new Date(data).toLocaleDateString("pt-BR");
};

const dentroDoPeriodo = (data, inicio, fim) => {
  if (!data) return false;

  const dataBase = new Date(data);
  if (Number.isNaN(dataBase.getTime())) return false;

  if (inicio) {
    const dataInicio = new Date(inicio);
    dataInicio.setHours(0, 0, 0, 0);
    if (dataBase < dataInicio) return false;
  }

  if (fim) {
    const dataFim = new Date(fim);
    dataFim.setHours(23, 59, 59, 999);
    if (dataBase > dataFim) return false;
  }

  return true;
};

export default function ComandoDisciplina() {
  const [advertencias, setAdvertencias] = useState([]);
  const [casos, setCasos] = useState([]);

  const [busca, setBusca] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPrioridade, setFPrioridade] = useState("");
  const [fAdvertencia, setFAdvertencia] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    busca: "",
    status: "",
    prioridade: "",
    advertencia: "",
    dataInicial: "",
    dataFinal: ""
  });

  const carregar = async () => {
    try {
      const res = await api.get("/api/comando/disciplina");
      setAdvertencias(Array.isArray(res.data?.advertencias) ? res.data.advertencias : []);
      setCasos(Array.isArray(res.data?.casos) ? res.data.casos : []);
    } catch (err) {
      console.error("Erro ao carregar disciplina:", err);
      setAdvertencias([]);
      setCasos([]);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      busca,
      status: fStatus,
      prioridade: fPrioridade,
      advertencia: fAdvertencia,
      dataInicial,
      dataFinal
    });
  };

  const limparFiltros = () => {
    setBusca("");
    setFStatus("");
    setFPrioridade("");
    setFAdvertencia("");
    setDataInicial("");
    setDataFinal("");

    setFiltrosAplicados({
      busca: "",
      status: "",
      prioridade: "",
      advertencia: "",
      dataInicial: "",
      dataFinal: ""
    });
  };

  const resumo = useMemo(() => {
    return {
      advertencias: advertencias.length,
      casos: casos.length,
      abertos: casos.filter((c) =>
        ["ABERTO", "AGUARDANDO_CIENCIA", "AGUARDANDO_MANIFESTACAO", "EM_ANALISE", "CONVOCADO"].includes(c.status)
      ).length,
      urgentes: casos.filter((c) => ["URGENTE", "ALTA"].includes(c.prioridade)).length
    };
  }, [advertencias, casos]);

  const advertenciasFiltradas = useMemo(() => {
    const termo = filtrosAplicados.busca.trim().toLowerCase();

    return advertencias.filter((item) => {
      const texto = [
        item.funcional,
        item.nome,
        item.patente,
        item.tipo,
        item.semanaReferencia,
        item.motivo
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = termo ? texto.includes(termo) : true;
      const okAdvertencia = filtrosAplicados.advertencia
  ? getAdvertenciasAcumuladas(item.tipo).includes(filtrosAplicados.advertencia)
  : true;

      const okPeriodo =
        !filtrosAplicados.dataInicial && !filtrosAplicados.dataFinal
          ? true
          : dentroDoPeriodo(item.createdAt, filtrosAplicados.dataInicial, filtrosAplicados.dataFinal);

      return okBusca && okAdvertencia && okPeriodo;
    });
  }, [advertencias, filtrosAplicados]);

  const casosFiltrados = useMemo(() => {
    const termo = filtrosAplicados.busca.trim().toLowerCase();

    return casos.filter((item) => {
      const texto = [
        item.numero,
        item.tipo,
        item.status,
        item.prioridade,
        item.descricao
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = termo ? texto.includes(termo) : true;
      const okStatus = filtrosAplicados.status
        ? item.status === filtrosAplicados.status
        : true;
      const okPrioridade = filtrosAplicados.prioridade
        ? item.prioridade === filtrosAplicados.prioridade
        : true;

      const okPeriodo =
        !filtrosAplicados.dataInicial && !filtrosAplicados.dataFinal
          ? true
          : dentroDoPeriodo(item.createdAt, filtrosAplicados.dataInicial, filtrosAplicados.dataFinal);

      return okBusca && okStatus && okPrioridade && okPeriodo;
    });
  }, [casos, filtrosAplicados]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Comando • Disciplina & Justiça</h1>
          <p>Visão executiva de advertências e casos disciplinares com filtros avançados.</p>
        </div>

        <button className="admin-module-btn blue" onClick={carregar}>
          Recarregar
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Advertências</small>
          <strong>{resumo.advertencias}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Casos</small>
          <strong>{resumo.casos}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Casos abertos</small>
          <strong>{resumo.abertos}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Urgentes / Altos</small>
          <strong>{resumo.urgentes}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Filtros</h2>
            <span>Refine por advertência, período, status, prioridade e busca textual.</span>
          </div>
        </div>

        <div className="admin-module-grid">
          <input
            className="admin-module-input"
            placeholder="Buscar por nome, funcional, número, tipo ou descrição"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={fAdvertencia}
            onChange={(e) => setFAdvertencia(e.target.value)}
          >
            <option value="">Todas as advertências</option>
            <option value="ADV 1">ADV 1</option>
            <option value="ADV 2">ADV 2</option>
            <option value="ADV 3">ADV 3</option>
          </select>

          <select
            className="admin-module-select"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ABERTO">ABERTO</option>
            <option value="AGUARDANDO_CIENCIA">AGUARDANDO_CIENCIA</option>
            <option value="AGUARDANDO_MANIFESTACAO">AGUARDANDO_MANIFESTACAO</option>
            <option value="EM_ANALISE">EM_ANALISE</option>
            <option value="CONVOCADO">CONVOCADO</option>
            <option value="CONCLUIDO">CONCLUIDO</option>
            <option value="ARQUIVADO">ARQUIVADO</option>
            <option value="SANCAO_APLICADA">SANCAO_APLICADA</option>
          </select>

          <select
            className="admin-module-select"
            value={fPrioridade}
            onChange={(e) => setFPrioridade(e.target.value)}
          >
            <option value="">Todas as prioridades</option>
            <option value="BAIXA">BAIXA</option>
            <option value="MEDIA">MEDIA</option>
            <option value="ALTA">ALTA</option>
            <option value="URGENTE">URGENTE</option>
          </select>
        </div>

        <div className="admin-module-grid-2" style={{ marginTop: 12 }}>
          <input
            className="admin-module-input"
            type="date"
            value={dataInicial}
            onChange={(e) => setDataInicial(e.target.value)}
          />

          <input
            className="admin-module-input"
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value)}
          />
        </div>

        <div className="admin-module-actions" style={{ marginTop: 14 }}>
          <button className="admin-module-btn green" onClick={aplicarFiltros}>
            Aplicar filtros
          </button>

          <button className="admin-module-btn" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="admin-module-grid-2">
        <div className="admin-module-section">
          <div className="admin-module-section-title">
            <div>
              <h2>Advertências</h2>
              <span>Total filtrado: {advertenciasFiltradas.length}</span>
            </div>
          </div>

          <div className="admin-module-table-wrap">
            <table className="admin-module-table">
              <thead>
                <tr>
                  <th>Funcional</th>
                  <th>Nome</th>
                  <th>Patente</th>
                  <th>Tipo</th>
                  <th>Semana</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {advertenciasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      Nenhuma advertência encontrada.
                    </td>
                  </tr>
                ) : (
                  advertenciasFiltradas.map((item) => (
                    <tr key={item._id}>
                      <td>{item.funcional || "-"}</td>
                      <td>{item.nome || "-"}</td>
                      <td>{item.patente || "-"}</td>
                      <td>
  <div className="adv-badges-inline">
    {getAdvertenciasAcumuladas(item.tipo).map((adv) => (
      <span key={adv} className={`admin-module-badge ${badgeAdvertencia(adv)}`}>
        {adv}
      </span>
    ))}
  </div>
</td>
                      <td>{item.semanaReferencia || "-"}</td>
                      <td>{formatarData(item.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-module-section">
          <div className="admin-module-section-title">
            <div>
              <h2>Casos disciplinares</h2>
              <span>Total filtrado: {casosFiltrados.length}</span>
            </div>
          </div>

          <div className="admin-module-table-wrap">
            <table className="admin-module-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  <th>Data</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                {casosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center" }}>
                      Nenhum caso disciplinar encontrado.
                    </td>
                  </tr>
                ) : (
                  casosFiltrados.map((item) => (
                    <tr key={item._id}>
                      <td>{item.numero || "-"}</td>
                      <td>{item.tipo || "-"}</td>
                      <td>
                        <span className={`admin-module-badge ${badgeStatus(item.status)}`}>
                          {item.status || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-module-badge ${badgePrioridade(item.prioridade)}`}>
                          {item.prioridade || "-"}
                        </span>
                      </td>
                      <td>{formatarData(item.createdAt)}</td>
                      <td>{item.descricao || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}