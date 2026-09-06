import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import api from "../../api/api";
import "./PatrolHoursAdmin.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const formatarTempo = (min = 0) => {
  const valor = Number(min || 0);

  if (valor <= 0) return "0 min";
  if (valor < 60) return `${valor} min`;

  const h = Math.floor(valor / 60);
  const m = valor % 60;

  return m > 0 ? `${h}h ${m}min` : `${h}h`;
};

const formatarDataHora = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR");
};

const formatarData = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("pt-BR");
};

const medalha = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return `${index + 1}º`;
};

const filterListByRemoved = (list = [], removedSet = new Set()) =>
  list.filter((item) => !removedSet.has(item._id));

const getPeriodLabel = (period) => {
  if (period === "week") return "Semanal";
  if (period === "month") return "Mensal";
  if (period === "history") return "Histórico por período";
  return "Semanal + Mensal";
};

const getSectionLabel = (sectionKey, weeklyThresholdHours) => {
  if (sectionKey === "topMonth") return "Top do mês";
  if (sectionKey === "topWeek") return "Top da semana";
  if (sectionKey === "weekAboveThreshold") return `Acima de ${weeklyThresholdHours}h`;
  if (sectionKey === "weekBetween1mAnd5h59") return "Entre 1 min e 5h59";
  if (sectionKey === "weekZero") return "0h na semana";
  return sectionKey;
};

const getExportTypeLabel = (tipoExportacao, weeklyThresholdHours) => {
  if (tipoExportacao === "top") return "Somente Top do mês";
  if (tipoExportacao === "topWeek") return "Somente Top da semana";
  if (tipoExportacao === "acima6") return `Somente acima de ${weeklyThresholdHours}h`;
  if (tipoExportacao === "entre1e559") return "Somente entre 1 min e 5h59";
  if (tipoExportacao === "zero") return "Somente 0h";
  return "Relatório completo";
};

const getAusenciaLabel = (value) => {
  if (value === "justificada") return "Justificada";
  if (value === "nao_justificada") return "Não justificada";
  if (value === "iniciante") return "Iniciante";
  return "";
};

const getBetweenSectionList = (sections = {}) =>
  sections.weekBetween1mAnd5h59 || sections.weekFrom1MinToBelowThreshold || [];

const getExportSections = (report, removedBySection, tipoExportacao, weeklyThresholdHours) => {
  if (!report?.sections) return [];

  const betweenList = getBetweenSectionList(report.sections);

  const sections = [
    {
      key: "topMonth",
      title: `Top ${report.filtersApplied.topMonthLimit} do mês`,
      rows: filterListByRemoved(
        report.sections.topMonth || [],
        new Set(removedBySection.topMonth || [])
      )
    },
    {
      key: "topWeek",
      title: `Top ${report.filtersApplied.topMonthLimit} da semana`,
      rows: filterListByRemoved(
        report.sections.topWeek || [],
        new Set(removedBySection.topWeek || [])
      )
    },
    {
      key: "weekAboveThreshold",
      title: `Policiais com ${weeklyThresholdHours}h ou mais na semana`,
      rows: filterListByRemoved(
        report.sections.weekAboveThreshold || [],
        new Set(removedBySection.weekAboveThreshold || [])
      )
    },
    {
      key: "weekBetween1mAnd5h59",
      title: "Policiais entre 1 min e 5h59 na semana",
      rows: filterListByRemoved(
        betweenList,
        new Set(removedBySection.weekBetween1mAnd5h59 || [])
      )
    },
    {
      key: "weekZero",
      title: "Policiais com 0h na semana",
      rows: filterListByRemoved(
        report.sections.weekZero || [],
        new Set(removedBySection.weekZero || [])
      )
    }
  ];

  if (tipoExportacao === "top") {
    return sections.filter((section) => section.key === "topMonth");
  }

  if (tipoExportacao === "topWeek") {
    return sections.filter((section) => section.key === "topWeek");
  }

  if (tipoExportacao === "acima6") {
    return sections.filter((section) => section.key === "weekAboveThreshold");
  }

  if (tipoExportacao === "entre1e559") {
    return sections.filter((section) => section.key === "weekBetween1mAnd5h59");
  }

  if (tipoExportacao === "zero") {
    return sections.filter((section) => section.key === "weekZero");
  }

  return sections;
};

const buildExportSummary = (sections = []) => {
  const mapa = new Map();

  sections.forEach((section) => {
    section.rows.forEach((item) => {
      if (!mapa.has(item._id)) {
        mapa.set(item._id, item);
      }
    });
  });

  const unicos = Array.from(mapa.values());

  const totalPoliciais = unicos.length;
  const ativos = unicos.filter((item) => item.status === "Ativo").length;
  const ausentes = unicos.filter((item) => item.status === "Ausente").length;
  const afastados = unicos.filter((item) => item.status === "Afastado").length;

  const totalSemanaMin = unicos.reduce(
    (acc, item) => acc + Number(item.horasSemanaMin || 0),
    0
  );

  const totalMesMin = unicos.reduce(
    (acc, item) => acc + Number(item.horasMesMin || 0),
    0
  );

  const totalAusenciaJustificada = unicos.filter(
    (item) => item.ausenciaPatrulhamento === "justificada"
  ).length;

  const totalAusenciaNaoJustificada = unicos.filter(
    (item) => item.ausenciaPatrulhamento === "nao_justificada"
  ).length;

  const totalIniciantes = unicos.filter(
    (item) => item.ausenciaPatrulhamento === "iniciante"
  ).length;

  return {
    totalPoliciais,
    ativos,
    ausentes,
    afastados,
    totalSemanaMin,
    totalMesMin,
    totalAusenciaJustificada,
    totalAusenciaNaoJustificada,
    totalIniciantes
  };
};

const buildVisualSummary = (sections = []) => {
  const mapa = new Map();

  sections.forEach((section) => {
    section.rows.forEach((item) => {
      if (!mapa.has(item._id)) {
        mapa.set(item._id, item);
      }
    });
  });

  const unicos = Array.from(mapa.values());

  const total = unicos.length;
  const ativos = unicos.filter((i) => i.status === "Ativo").length;
  const ausentes = unicos.filter((i) => i.status === "Ausente").length;
  const afastados = unicos.filter((i) => i.status === "Afastado").length;

  const totalSemana = unicos.reduce((acc, i) => acc + (i.horasSemanaMin || 0), 0);
  const totalMes = unicos.reduce((acc, i) => acc + (i.horasMesMin || 0), 0);
  const mediaSemana = total > 0 ? Math.round(totalSemana / total) : 0;
  const mediaMes = total > 0 ? Math.round(totalMes / total) : 0;

  const totalAusenciaJustificada = unicos.filter(
    (item) => item.ausenciaPatrulhamento === "justificada"
  ).length;

  const totalAusenciaNaoJustificada = unicos.filter(
    (item) => item.ausenciaPatrulhamento === "nao_justificada"
  ).length;

  const totalIniciantes = unicos.filter(
    (item) => item.ausenciaPatrulhamento === "iniciante"
  ).length;

  return {
    total,
    ativos,
    ausentes,
    afastados,
    totalSemana,
    totalMes,
    mediaSemana,
    mediaMes,
    totalAusenciaJustificada,
    totalAusenciaNaoJustificada,
    totalIniciantes
  };
};

function CardResumo({ titulo, valor }) {
  return (
    <div className="patrol-card-resumo">
      <div className="patrol-card-resumo-titulo">{titulo}</div>
      <div className="patrol-card-resumo-valor">{valor}</div>
    </div>
  );
}

function FiltroSelect({ label, value, onChange, options = [] }) {
  return (
    <div className="patrol-filter-group">
      <label className="patrol-label">{label}</label>
      <select value={value} onChange={onChange} className="patrol-input">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusBadge({ status }) {
  let className = "patrol-status-badge ";
  if (status === "Ativo") className += "status-ativo";
  else if (status === "Ausente") className += "status-ausente";
  else className += "status-afastado";
  return <span className={className}>{status}</span>;
}

function AusenciaBadge({ value }) {
  if (value === "justificada") {
    return <span className="patrol-badge patrol-badge-success">Justificada</span>;
  }

  if (value === "nao_justificada") {
    return <span className="patrol-badge patrol-badge-danger">Não justificada</span>;
  }

  if (value === "iniciante") {
    return <span className="patrol-badge patrol-badge-warning">Iniciante</span>;
  }

  return null;
}

function SectionTable({
  title,
  sectionKey,
  list,
  period,
  removedBySection,
  onRemoveItem,
  onRestoreItem
}) {
  const removedSet = new Set(removedBySection[sectionKey] || []);
  const finalList = filterListByRemoved(list, removedSet);

  return (
    <div className="patrol-card">
      <div className="patrol-section-header">
        <h3>{title}</h3>
        <div className="patrol-section-count">Exibindo {finalList.length} registro(s)</div>
      </div>

      <div className="patrol-table-wrapper">
        <table className="patrol-table">
          <thead>
            <tr>
              <th>Posição</th>
              <th>Funcional</th>
              <th>Patente</th>
              <th>Nome</th>
              <th>Status</th>
              <th>Ausência</th>
              {(period === "week" || period === "both" || period === "history") && <th>Horas Semanais</th>}
              {(period === "month" || period === "both" || period === "history") && <th>Horas Mensais</th>}
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {finalList.length === 0 ? (
              <tr>
                <td className="patrol-empty-cell" colSpan={9}>
                  Nenhum policial nesta seção.
                </td>
              </tr>
            ) : (
              finalList.map((item, index) => {
                const isRemoved = removedSet.has(item._id);

                return (
                  <tr key={`${sectionKey}-${item._id}`}>
                    <td>{medalha(index)}</td>
                    <td>{item.funcional}</td>
                    <td>{item.patente}</td>
                    <td>{item.nome}</td>
                    <td><StatusBadge status={item.status} /></td>
                    <td><AusenciaBadge value={item.ausenciaPatrulhamento} /></td>
                    {(period === "week" || period === "both" || period === "history") && (
                      <td>{formatarTempo(item.horasSemanaMin)}</td>
                    )}
                    {(period === "month" || period === "both" || period === "history") && (
                      <td>{formatarTempo(item.horasMesMin)}</td>
                    )}
                    <td>
                      {!isRemoved ? (
                        <button
                          className="btn btn-danger-sm"
                          onClick={() => onRemoveItem(sectionKey, item._id)}
                        >
                          Remover
                        </button>
                      ) : (
                        <button
                          className="btn btn-secondary-sm"
                          onClick={() => onRestoreItem(sectionKey, item._id)}
                        >
                          Restaurar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RemovedList({ items, onRestore, weeklyThresholdHours }) {
  return (
    <div className="patrol-card">
      <div className="patrol-section-header">
        <div>
          <h2>Removidos do relatório</h2>
          <p className="patrol-removed-subtitle">
            Policiais removidos manualmente das seções do relatório.
          </p>
        </div>
        <div className="patrol-section-count patrol-removed-total">
          Total removido: {items.length}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="patrol-removed-empty">Nenhum policial removido no momento.</div>
      ) : (
        <div className="patrol-removed-grid">
          {items.map((item) => (
            <div className="patrol-removed-card" key={`${item.sectionKey}-${item._id}`}>
              <div className="patrol-removed-card-header">
                <div className="patrol-removed-main">
                  <div className="patrol-removed-name">{item.nome}</div>
                  <div className="patrol-removed-meta">
                    {item.patente} • Funcional {item.funcional}
                  </div>
                </div>

                <div className="patrol-removed-badges">
                  <StatusBadge status={item.status} />
                  <span className="patrol-removed-section-badge">
                    {getSectionLabel(item.sectionKey, weeklyThresholdHours)}
                  </span>
                </div>
              </div>

              <div className="patrol-removed-details">
                <div className="patrol-removed-detail-item">
                  <span className="patrol-removed-detail-label">Horas semana</span>
                  <strong>{formatarTempo(item.horasSemanaMin)}</strong>
                </div>

                <div className="patrol-removed-detail-item">
                  <span className="patrol-removed-detail-label">Horas mês</span>
                  <strong>{formatarTempo(item.horasMesMin)}</strong>
                </div>

                {!!getAusenciaLabel(item.ausenciaPatrulhamento) && (
                  <div className="patrol-removed-detail-item">
                    <span className="patrol-removed-detail-label">Ausência</span>
                    <strong>{getAusenciaLabel(item.ausenciaPatrulhamento)}</strong>
                  </div>
                )}
              </div>

              <div className="patrol-removed-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => onRestore(item.sectionKey, item._id)}
                >
                  Restaurar pessoa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PatrolHoursAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [abaRelatorio, setAbaRelatorio] = useState("atual");

  const [lista, setLista] = useState([]);
  const [report, setReport] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyReport, setHistoryReport] = useState(null);

  const [periodo, setPeriodo] = useState("both");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [patente, setPatente] = useState("todas");
  const [funcionalFiltro, setFuncionalFiltro] = useState("");
  const [ausenciaFiltro, setAusenciaFiltro] = useState("todas");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [topMonthLimit, setTopMonthLimit] = useState(10);
  const [weeklyThresholdHours, setWeeklyThresholdHours] = useState(6);
  const [tipoExportacao, setTipoExportacao] = useState("completo");
  const [modoVisualizacao, setModoVisualizacao] = useState("todas");
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    statuses: [],
    patentes: [],
    funcionais: [],
    ausencias: []
  });

  const [absenceForms, setAbsenceForms] = useState({});

  const [removedBySection, setRemovedBySection] = useState({
    topMonth: [],
    topWeek: [],
    weekAboveThreshold: [],
    weekBetween1mAnd5h59: [],
    weekZero: []
  });

  const activeReport = abaRelatorio === "atual" ? report : historyReport;

  const loadFilters = async () => {
    const res = await api.get("/api/patrol-hours/filters");
    setFilters(
      res.data || {
        statuses: [],
        patentes: [],
        funcionais: [],
        ausencias: []
      }
    );
  };

  const loadList = async ({
    nextSearch = search,
    nextStatus = status,
    nextPatente = patente,
    nextFuncional = funcionalFiltro,
    nextAusencia = ausenciaFiltro
  } = {}) => {
    const params = new URLSearchParams();

    if (nextSearch.trim()) params.append("search", nextSearch.trim());
    if (nextStatus !== "todos") params.append("status", nextStatus);
    if (nextPatente !== "todas") params.append("patente", nextPatente);
    if (nextFuncional) params.append("funcional", nextFuncional);
    if (nextAusencia !== "todas") params.append("ausencia", nextAusencia);

    const query = params.toString();
    const url = query ? `/api/patrol-hours?${query}` : "/api/patrol-hours";

    const res = await api.get(url);
    setLista(res.data || []);

    const initialAbsenceForms = {};
    (res.data || []).forEach((item) => {
      initialAbsenceForms[item._id] = {
        ausenciaPatrulhamento: item.ausenciaPatrulhamento || "normal",
        observacaoAusencia: item.observacaoAusencia || ""
      };
    });
    setAbsenceForms(initialAbsenceForms);
  };

  const loadReport = async ({
    nextPeriodo = periodo,
    nextSearch = search,
    nextStatus = status,
    nextPatente = patente,
    nextFuncional = funcionalFiltro,
    nextAusencia = ausenciaFiltro,
    nextTopMonthLimit = topMonthLimit,
    nextWeeklyThresholdHours = weeklyThresholdHours
  } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("period", nextPeriodo);
      params.append("topMonthLimit", String(nextTopMonthLimit));
      params.append("weeklyThresholdHours", String(nextWeeklyThresholdHours));

      if (nextSearch.trim()) params.append("search", nextSearch.trim());
      if (nextStatus !== "todos") params.append("status", nextStatus);
      if (nextPatente !== "todas") params.append("patente", nextPatente);
      if (nextFuncional) params.append("funcional", nextFuncional);
      if (nextAusencia !== "todas") params.append("ausencia", nextAusencia);

      const res = await api.get(`/api/patrol-hours/report?${params.toString()}`);
      setReport(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar relatório.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async ({
    nextSearch = search,
    nextStatus = status,
    nextPatente = patente,
    nextFuncional = funcionalFiltro,
    nextAusencia = ausenciaFiltro,
    nextDataInicio = dataInicio,
    nextDataFim = dataFim
  } = {}) => {
    try {
      const params = new URLSearchParams();

      if (nextSearch.trim()) params.append("search", nextSearch.trim());
      if (nextStatus !== "todos") params.append("status", nextStatus);
      if (nextPatente !== "todas") params.append("patente", nextPatente);
      if (nextFuncional) params.append("funcional", nextFuncional);
      if (nextAusencia !== "todas") params.append("ausencia", nextAusencia);
      if (nextDataInicio) params.append("dataInicio", nextDataInicio);
      if (nextDataFim) params.append("dataFim", nextDataFim);

      const query = params.toString();
      const url = query ? `/api/patrol-hours/history?${query}` : "/api/patrol-hours/history";

      const res = await api.get(url);
      setHistoryList(res.data || []);
    } catch (error) {
      console.error(error);

      if (error?.response?.status === 404) {
        setHistoryList([]);
        return;
      }

      toast.error("Erro ao carregar histórico.");
    }
  };

  const loadHistoryReport = async ({
    nextSearch = search,
    nextStatus = status,
    nextPatente = patente,
    nextFuncional = funcionalFiltro,
    nextAusencia = ausenciaFiltro,
    nextDataInicio = dataInicio,
    nextDataFim = dataFim,
    nextTopMonthLimit = topMonthLimit,
    nextWeeklyThresholdHours = weeklyThresholdHours
  } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append("topMonthLimit", String(nextTopMonthLimit));
      params.append("weeklyThresholdHours", String(nextWeeklyThresholdHours));

      if (nextSearch.trim()) params.append("search", nextSearch.trim());
      if (nextStatus !== "todos") params.append("status", nextStatus);
      if (nextPatente !== "todas") params.append("patente", nextPatente);
      if (nextFuncional) params.append("funcional", nextFuncional);
      if (nextAusencia !== "todas") params.append("ausencia", nextAusencia);
      if (nextDataInicio) params.append("dataInicio", nextDataInicio);
      if (nextDataFim) params.append("dataFim", nextDataFim);

      const res = await api.get(`/api/patrol-hours/history/report?${params.toString()}`);
      setHistoryReport(res.data);
    } catch (error) {
      console.error(error);

      if (error?.response?.status === 404) {
        setHistoryReport(null);
        return;
      }

      toast.error("Erro ao carregar relatório histórico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        await loadFilters();
        await loadList({
          nextSearch: "",
          nextStatus: "todos",
          nextPatente: "todas",
          nextFuncional: "",
          nextAusencia: "todas"
        });
        await loadReport({
          nextPeriodo: "both",
          nextSearch: "",
          nextStatus: "todos",
          nextPatente: "todas",
          nextFuncional: "",
          nextAusencia: "todas",
          nextTopMonthLimit: 10,
          nextWeeklyThresholdHours: 6
        });
        await loadHistory({
          nextSearch: "",
          nextStatus: "todos",
          nextPatente: "todas",
          nextFuncional: "",
          nextAusencia: "todas",
          nextDataInicio: "",
          nextDataFim: ""
        });
        await loadHistoryReport({
          nextSearch: "",
          nextStatus: "todos",
          nextPatente: "todas",
          nextFuncional: "",
          nextAusencia: "todas",
          nextDataInicio: "",
          nextDataFim: "",
          nextTopMonthLimit: 10,
          nextWeeklyThresholdHours: 6
        });
      } catch (error) {
        console.error(error);
        toast.error("Erro ao carregar dados da página.");
      }
    })();
  }, []);

  const aplicarFiltros = async () => {
    if (abaRelatorio === "atual") {
      await Promise.all([loadList(), loadReport()]);
      return;
    }

    await Promise.all([loadHistory(), loadHistoryReport()]);
  };

  const limparFiltros = async () => {
    const nextPeriodo = "both";
    const nextSearch = "";
    const nextStatus = "todos";
    const nextPatente = "todas";
    const nextFuncional = "";
    const nextAusencia = "todas";
    const nextDataInicio = "";
    const nextDataFim = "";
    const nextTopMonthLimit = 10;
    const nextWeeklyThresholdHours = 6;

    setPeriodo(nextPeriodo);
    setSearch(nextSearch);
    setStatus(nextStatus);
    setPatente(nextPatente);
    setFuncionalFiltro(nextFuncional);
    setAusenciaFiltro(nextAusencia);
    setDataInicio(nextDataInicio);
    setDataFim(nextDataFim);
    setTopMonthLimit(nextTopMonthLimit);
    setWeeklyThresholdHours(nextWeeklyThresholdHours);
    setTipoExportacao("completo");
    setModoVisualizacao("todas");

    setRemovedBySection({
      topMonth: [],
      topWeek: [],
      weekAboveThreshold: [],
      weekBetween1mAnd5h59: [],
      weekZero: []
    });

    await Promise.all([
      loadList({
        nextSearch,
        nextStatus,
        nextPatente,
        nextFuncional,
        nextAusencia
      }),
      loadReport({
        nextPeriodo,
        nextSearch,
        nextStatus,
        nextPatente,
        nextFuncional,
        nextAusencia,
        nextTopMonthLimit,
        nextWeeklyThresholdHours
      }),
      loadHistory({
        nextSearch,
        nextStatus,
        nextPatente,
        nextFuncional,
        nextAusencia,
        nextDataInicio,
        nextDataFim
      }),
      loadHistoryReport({
        nextSearch,
        nextStatus,
        nextPatente,
        nextFuncional,
        nextAusencia,
        nextDataInicio,
        nextDataFim,
        nextTopMonthLimit,
        nextWeeklyThresholdHours
      })
    ]);
  };

  const handleRemoveItem = (sectionKey, id) => {
    setRemovedBySection((prev) => {
      const current = prev[sectionKey] || [];
      if (current.includes(id)) return prev;

      return {
        ...prev,
        [sectionKey]: [...current, id]
      };
    });
  };

  const handleRestoreItem = (sectionKey, id) => {
    setRemovedBySection((prev) => ({
      ...prev,
      [sectionKey]: (prev[sectionKey] || []).filter((item) => item !== id)
    }));
  };

  const handleRestoreAllSections = () => {
    setRemovedBySection({
      topMonth: [],
      topWeek: [],
      weekAboveThreshold: [],
      weekBetween1mAnd5h59: [],
      weekZero: []
    });
  };

  const handleAbsenceFormChange = (id, field, value) => {
    setAbsenceForms((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || {
          ausenciaPatrulhamento: "normal",
          observacaoAusencia: ""
        }),
        [field]: value
      }
    }));
  };

  const atualizarAusencia = async (id) => {
    const form = absenceForms[id] || {
      ausenciaPatrulhamento: "normal",
      observacaoAusencia: ""
    };

    try {
      await api.put(`/api/patrol-hours/${id}/absence-status`, form);
      await Promise.all([loadList(), loadReport(), loadHistory(), loadHistoryReport()]);
      toast.success("Ausência atualizada com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Erro ao atualizar ausência.");
    }
  };

  const zerarSemana = async () => {
    const ok = await confirm({ tone: "danger", message: "Deseja realmente zerar as horas semanais de todos os policiais? O histórico será salvo." });
    if (!ok) return;

    try {
      const res = await api.post("/api/patrol-hours/reset-week");
      await Promise.all([loadList(), loadReport(), loadHistory(), loadHistoryReport()]);
      toast.success(
        `${res.data?.message || "Horas semanais zeradas com sucesso."}\n` +
          `Registros alterados: ${res.data?.modifiedCount || 0}\n` +
          `Histórico salvo: ${res.data?.historyInsertedCount || 0}\n` +
          `Inválidos ignorados: ${res.data?.skippedInvalidCount || 0}`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Erro ao zerar horas semanais."
      );
    }
  };

  const zerarMes = async () => {
    const ok = await confirm({ tone: "danger", message: "Deseja realmente zerar as horas mensais de todos os policiais? O histórico será salvo." });
    if (!ok) return;

    try {
      const res = await api.post("/api/patrol-hours/reset-month");
      await Promise.all([loadList(), loadReport(), loadHistory(), loadHistoryReport()]);
      toast.success(
        `${res.data?.message || "Horas mensais zeradas com sucesso."}\n` +
          `Registros alterados: ${res.data?.modifiedCount || 0}\n` +
          `Histórico salvo: ${res.data?.historyInsertedCount || 0}\n` +
          `Inválidos ignorados: ${res.data?.skippedInvalidCount || 0}`
      );
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Erro ao zerar horas mensais."
      );
    }
  };

  const zerarHistorico = async () => {
    const ok = await confirm({ tone: "danger", message: "Deseja realmente apagar todo o histórico de horas?" });
    if (!ok) return;

    try {
      await api.delete("/api/patrol-hours/history/clear");
      await Promise.all([loadHistory(), loadHistoryReport()]);
      toast.success("Histórico apagado com sucesso.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao apagar histórico.");
    }
  };

  const exportarCSV = () => {
    if (!activeReport) return;

    const rows = [];
    rows.push([
      "SEÇÃO",
      "FUNCIONAL",
      "PATENTE",
      "NOME",
      "STATUS",
      "AUSÊNCIA",
      "OBSERVAÇÃO",
      "HORAS SEMANA",
      "HORAS MÊS"
    ]);

    const sections = getExportSections(
      activeReport,
      removedBySection,
      tipoExportacao,
      weeklyThresholdHours
    );

    sections.forEach((section) => {
      section.rows.forEach((item) => {
        rows.push([
          section.title,
          item.funcional || "",
          item.patente || "",
          item.nome || "",
          item.status || "",
          getAusenciaLabel(item.ausenciaPatrulhamento),
          item.observacaoAusencia || "",
          formatarTempo(item.horasSemanaMin),
          formatarTempo(item.horasMesMin)
        ]);
      });
    });

    const csv = rows
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-horas-${abaRelatorio}-${tipoExportacao}-${Date.now()}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const carregarImagemComoBase64 = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error(`Não foi possível carregar a imagem: ${src}`));
      };

      img.src = src;
    });

  const desenharTabelaPdf = (doc, rows, startY, title) => {
    let y = startY;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text(title, 14, y);
    y += 6;

    const headers = ["Func.", "Patente", "Nome", "Status", "Ausência", "Sem.", "Mês"];
    const colX = [14, 27, 58, 112, 134, 167, 184];

    doc.setFillColor(230, 235, 245);
    doc.rect(14, y, 182, 8, "F");

    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    headers.forEach((h, i) => doc.text(h, colX[i], y + 5.3));
    y += 10;

    doc.setFont("helvetica", "normal");

    rows.forEach((item) => {
      if (y > 250) {
        doc.addPage();
        y = 20;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        doc.text(title, 14, y);
        y += 6;

        doc.setFillColor(230, 235, 245);
        doc.rect(14, y, 182, 8, "F");
        doc.setFontSize(8);
        doc.setTextColor(20, 20, 20);
        headers.forEach((h, i) => doc.text(h, colX[i], y + 5.3));
        y += 10;
        doc.setFont("helvetica", "normal");
      }

      doc.setDrawColor(220, 220, 220);
      doc.line(14, y, 196, y);

      doc.setTextColor(20, 20, 20);
      doc.text(String(item.funcional ?? ""), colX[0], y + 5);
      doc.text(String(item.patente ?? "").slice(0, 20), colX[1], y + 5);
      doc.text(String(item.nome ?? "").slice(0, 22), colX[2], y + 5);
      doc.text(String(item.status ?? "").slice(0, 10), colX[3], y + 5);

      if (item.ausenciaPatrulhamento === "justificada") {
        doc.setFillColor(220, 252, 231);
        doc.roundedRect(colX[4] - 2, y + 1, 22, 6, 1.5, 1.5, "F");
        doc.setTextColor(22, 101, 52);
        doc.text("Justificada", colX[4], y + 4.8);
      } else if (item.ausenciaPatrulhamento === "nao_justificada") {
        doc.setFillColor(254, 226, 226);
        doc.roundedRect(colX[4] - 2, y + 1, 28, 6, 1.5, 1.5, "F");
        doc.setTextColor(153, 27, 27);
        doc.text("Não Justificada", colX[4], y + 4.8);
      } else if (item.ausenciaPatrulhamento === "iniciante") {
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(colX[4] - 2, y + 1, 18, 6, 1.5, 1.5, "F");
        doc.setTextColor(146, 64, 14);
        doc.text("Iniciante", colX[4], y + 4.8);
      }

      doc.setTextColor(20, 20, 20);
      doc.text(formatarTempo(item.horasSemanaMin), colX[5], y + 5);
      doc.text(formatarTempo(item.horasMesMin), colX[6], y + 5);

      y += 8;
    });

    return y + 6;
  };

  const gerarRubrica = (doc, x, y, nome) => {
    doc.setDrawColor(90, 90, 90);
    doc.setLineWidth(0.5);
    doc.line(x, y, x + 58, y);

    doc.setDrawColor(70, 70, 70);
    doc.setLineWidth(0.7);

    let startX = x + 4;
    const points = [
      [startX, y - 5],
      [startX + 6, y - 9],
      [startX + 11, y - 4],
      [startX + 17, y - 10],
      [startX + 23, y - 3],
      [startX + 31, y - 8],
      [startX + 39, y - 4],
      [startX + 47, y - 7]
    ];

    for (let i = 0; i < points.length - 1; i += 1) {
      doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
    }

    doc.setFont("times", "bolditalic");
    doc.setFontSize(10);
    doc.setTextColor(45, 45, 45);
    doc.text(nome, x, y + 6);

    return y + 18;
  };

  const desenharAssinaturasPdf = (doc) => {
    doc.addPage();

    doc.setFillColor(10, 16, 32);
    doc.rect(0, 0, 210, 24, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("ASSINATURAS E VALIDAÇÃO INSTITUCIONAL", 14, 15);

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
      "Documento oficial emitido pelo sistema administrativo do 2º Batalhão de Polícia de Choque - Anchieta.",
      14,
      34,
      { maxWidth: 180 }
    );

    doc.text(
      "As autoridades abaixo constam no presente relatório para fins de referência administrativa e validação documental.",
      14,
      42,
      { maxWidth: 180 }
    );

    let y = 68;

    y = gerarRubrica(doc, 20, y, "Tenente Coronel PM Xing Ling");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Comando", 20, y);
    y += 24;

    y = gerarRubrica(doc, 20, y, "Major PM João Martinelli");
    doc.text("Subcomando", 20, y);
    y += 24;

    y = gerarRubrica(doc, 20, y, "Capitão PM Vangola Marques");
    doc.text("Coordenador Operacional", 20, y);
    doc.setFontSize(9);
    doc.text("(Responsável pela emissão do relatório)", 20, y + 6);

    doc.setDrawColor(190, 190, 190);
    doc.line(14, 268, 196, 268);

    doc.setTextColor(110, 110, 110);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Documento gerado automaticamente pelo sistema institucional do 2º BPChq Anchieta.", 14, 275);
    doc.text(`Emitido em: ${formatarDataHora(new Date())}`, 14, 280);
  };

  const exportarPDF = async () => {
    if (!activeReport) return;

    try {
      const doc = new jsPDF("p", "mm", "a4");

      let logoBase64 = null;

      try {
        logoBase64 = await carregarImagemComoBase64("/anchieta-logo.png");
      } catch (logoError) {
        console.warn("Logo não carregado no PDF:", logoError);
      }

      const sections = getExportSections(
        activeReport,
        removedBySection,
        tipoExportacao,
        weeklyThresholdHours
      );

      const summary = buildExportSummary(sections);

      doc.setFillColor(10, 16, 32);
      doc.rect(0, 0, 210, 38, "F");

      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", 14, 6, 20, 20);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(
        "2º BATALHÃO DE POLÍCIA DE CHOQUE - ANCHIETA",
        logoBase64 ? 40 : 14,
        14
      );

      doc.setFontSize(18);
      doc.text(
        abaRelatorio === "atual"
          ? "Relatório de Horas de Patrulha"
          : "Relatório Histórico de Horas",
        logoBase64 ? 40 : 14,
        23
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Período: ${getPeriodLabel(activeReport.period)}`,
        logoBase64 ? 40 : 14,
        30
      );
      doc.text(
        `Emitido em: ${formatarDataHora(activeReport.generatedAt)}`,
        logoBase64 ? 40 : 14,
        35
      );

      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Filtros aplicados", 14, 50);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Status: ${activeReport.filtersApplied.status}`, 14, 56);
      doc.text(`Patente: ${activeReport.filtersApplied.patente}`, 70, 56);
      doc.text(`Busca: ${activeReport.filtersApplied.search || "Nenhuma"}`, 126, 56);

      doc.text(`Top do mês: ${activeReport.filtersApplied.topMonthLimit}`, 14, 62);
      doc.text(`Limite semanal: ${activeReport.filtersApplied.weeklyThresholdHours}h`, 70, 62);
      doc.text(`Extração: ${getExportTypeLabel(tipoExportacao, weeklyThresholdHours)}`, 126, 62);

      if (abaRelatorio === "historico") {
        doc.text(`Data inicial: ${activeReport.filtersApplied.dataInicio || "-"}`, 14, 68);
        doc.text(`Data final: ${activeReport.filtersApplied.dataFim || "-"}`, 70, 68);
        doc.text(`Funcional: ${activeReport.filtersApplied.funcional || "-"}`, 126, 68);
      }

      const summaryY = abaRelatorio === "historico" ? 78 : 72;

      doc.setFont("helvetica", "bold");
      doc.text("Resumo do recorte exportado", 14, summaryY);

      doc.setFont("helvetica", "normal");
      doc.text(`Total de policiais: ${summary.totalPoliciais}`, 14, summaryY + 6);
      doc.text(`Ativos: ${summary.ativos}`, 70, summaryY + 6);
      doc.text(`Ausentes: ${summary.ausentes}`, 110, summaryY + 6);
      doc.text(`Afastados: ${summary.afastados}`, 150, summaryY + 6);

      doc.text(`Horas semana: ${formatarTempo(summary.totalSemanaMin)}`, 14, summaryY + 12);
      doc.text(`Horas mês: ${formatarTempo(summary.totalMesMin)}`, 70, summaryY + 12);
      doc.text(`Justificadas: ${summary.totalAusenciaJustificada}`, 126, summaryY + 12);
      doc.text(`Não justificadas: ${summary.totalAusenciaNaoJustificada}`, 160, summaryY + 12);
      doc.text(`Iniciantes: ${summary.totalIniciantes}`, 14, summaryY + 18);

      let y = summaryY + 28;

      sections.forEach((section) => {
        if (section.rows.length === 0) return;
        y = desenharTabelaPdf(doc, section.rows, y, section.title);
      });

      if (y > 240) {
        doc.addPage();
        y = 24;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(25, 25, 25);
      doc.text("Observação institucional", 14, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "Este relatório foi emitido automaticamente pelo sistema administrativo do 2º BPChq Anchieta e considera exclusivamente os filtros, recortes e remoções manuais definidos no momento da geração do documento.",
        14,
        y + 7,
        { maxWidth: 180 }
      );

      desenharAssinaturasPdf(doc);

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Página ${i} de ${totalPages}`, 180, 290);
      }

      doc.save(`relatorio-horas-${abaRelatorio}-${tipoExportacao}-${Date.now()}.pdf`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar PDF.");
    }
  };

  const removedItems = useMemo(() => {
    if (!activeReport?.sections) return [];

    const result = [];

    const mapSections = {
      topMonth: activeReport.sections.topMonth || [],
      topWeek: activeReport.sections.topWeek || [],
      weekAboveThreshold: activeReport.sections.weekAboveThreshold || [],
      weekBetween1mAnd5h59: getBetweenSectionList(activeReport.sections),
      weekZero: activeReport.sections.weekZero || []
    };

    Object.entries(removedBySection).forEach(([sectionKey, ids]) => {
      const sourceList = mapSections[sectionKey] || [];

      ids.forEach((id) => {
        const found = sourceList.find((item) => item._id === id);
        if (found) {
          result.push({
            ...found,
            sectionKey
          });
        }
      });
    });

    return result.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }, [removedBySection, activeReport]);

  const sectionsForView = useMemo(() => {
    if (!activeReport?.sections) return null;

    return {
      topMonth: filterListByRemoved(
        activeReport.sections.topMonth || [],
        new Set(removedBySection.topMonth || [])
      ),
      topWeek: filterListByRemoved(
        activeReport.sections.topWeek || [],
        new Set(removedBySection.topWeek || [])
      ),
      weekAboveThreshold: filterListByRemoved(
        activeReport.sections.weekAboveThreshold || [],
        new Set(removedBySection.weekAboveThreshold || [])
      ),
      weekBetween1mAnd5h59: filterListByRemoved(
        getBetweenSectionList(activeReport.sections),
        new Set(removedBySection.weekBetween1mAnd5h59 || [])
      ),
      weekZero: filterListByRemoved(
        activeReport.sections.weekZero || [],
        new Set(removedBySection.weekZero || [])
      )
    };
  }, [activeReport, removedBySection]);

  const sectionsExport = activeReport
    ? getExportSections(activeReport, removedBySection, tipoExportacao, weeklyThresholdHours)
    : [];

  const summaryVisual = buildVisualSummary(sectionsExport);

  const isManipulado = removedItems.length > 0;
  const isFiltrado = tipoExportacao !== "completo";

  const mostrarTodasAsListas = modoVisualizacao === "todas";

  const mostrarTopMonth =
    mostrarTodasAsListas || tipoExportacao === "completo" || tipoExportacao === "top";

  const mostrarTopWeek =
    mostrarTodasAsListas || tipoExportacao === "completo" || tipoExportacao === "topWeek";

  const mostrarWeekAboveThreshold =
    mostrarTodasAsListas || tipoExportacao === "completo" || tipoExportacao === "acima6";

  const mostrarWeekBetween1mAnd5h59 =
    mostrarTodasAsListas || tipoExportacao === "completo" || tipoExportacao === "entre1e559";

  const mostrarWeekZero =
    mostrarTodasAsListas || tipoExportacao === "completo" || tipoExportacao === "zero";

  return (
    <div className="patrol-admin-page">
      <div className="patrol-container">
        <div className="patrol-hero">
          <h1>Horas de Patrulha</h1>
          <p>
            Controle administrativo de horas, rankings, ausências, histórico e
            relatórios institucionais do 2º BPChq Anchieta.
          </p>
        </div>

        <div className="patrol-tabs no-print">
          <button
            className={`patrol-tab-btn ${abaRelatorio === "atual" ? "active" : ""}`}
            onClick={() => setAbaRelatorio("atual")}
          >
            Relatório Atual
          </button>

          <button
            className={`patrol-tab-btn ${abaRelatorio === "historico" ? "active" : ""}`}
            onClick={() => setAbaRelatorio("historico")}
          >
            Histórico por Período
          </button>
        </div>

        <div className="patrol-card no-print">
          <h2>Filtros e ações</h2>

          <div className="patrol-filters-grid">
            <FiltroSelect
              label="Período"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              options={[
                { label: "Semanal", value: "week" },
                { label: "Mensal", value: "month" },
                { label: "Semanal + Mensal", value: "both" }
              ]}
            />

            <FiltroSelect
              label="Tipo de extração"
              value={tipoExportacao}
              onChange={(e) => setTipoExportacao(e.target.value)}
              options={[
                { label: "Relatório completo", value: "completo" },
                { label: "Somente Top do mês", value: "top" },
                { label: "Somente Top da semana", value: "topWeek" },
                { label: `Somente acima de ${weeklyThresholdHours}h`, value: "acima6" },
                { label: "Somente entre 1 min e 5h59", value: "entre1e559" },
                { label: "Somente 0h", value: "zero" }
              ]}
            />

            <FiltroSelect
              label="Visualização das listas"
              value={modoVisualizacao}
              onChange={(e) => setModoVisualizacao(e.target.value)}
              options={[
                { label: "Todas as listas", value: "todas" },
                { label: "Somente lista da extração", value: "somente_extracao" }
              ]}
            />

            <FiltroSelect
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { label: "Todos", value: "todos" },
                ...filters.statuses.map((item) => ({ label: item, value: item }))
              ]}
            />

            <FiltroSelect
              label="Patente"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
              options={[
                { label: "Todas", value: "todas" },
                ...filters.patentes.map((item) => ({ label: item, value: item }))
              ]}
            />

            <FiltroSelect
              label="Ausência"
              value={ausenciaFiltro}
              onChange={(e) => setAusenciaFiltro(e.target.value)}
              options={[
                { label: "Todas", value: "todas" },
                { label: "Justificada", value: "justificada" },
                { label: "Não justificada", value: "nao_justificada" },
                { label: "Iniciante", value: "iniciante" },
                { label: "Sem marcação", value: "normal" }
              ]}
            />

            <div className="patrol-filter-group">
              <label className="patrol-label">Busca</label>
              <input
                className="patrol-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, patente, funcional ou status"
              />
            </div>

            <div className="patrol-filter-group">
              <label className="patrol-label">Funcional</label>
              <input
                className="patrol-input"
                type="number"
                value={funcionalFiltro}
                onChange={(e) => setFuncionalFiltro(e.target.value)}
                placeholder="Filtrar por funcional"
              />
            </div>

            <div className="patrol-filter-group">
              <label className="patrol-label">Top mês / semana</label>
              <input
                className="patrol-input"
                type="number"
                min="1"
                value={topMonthLimit}
                onChange={(e) => setTopMonthLimit(Number(e.target.value || 10))}
              />
            </div>

            <div className="patrol-filter-group">
              <label className="patrol-label">Limite semanal (horas)</label>
              <input
                className="patrol-input"
                type="number"
                min="1"
                value={weeklyThresholdHours}
                onChange={(e) => setWeeklyThresholdHours(Number(e.target.value || 6))}
              />
            </div>

            {abaRelatorio === "historico" && (
              <>
                <div className="patrol-filter-group">
                  <label className="patrol-label">Data inicial</label>
                  <input
                    className="patrol-input"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>

                <div className="patrol-filter-group">
                  <label className="patrol-label">Data final</label>
                  <input
                    className="patrol-input"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="patrol-actions">
            <button className="btn btn-primary" onClick={aplicarFiltros}>
              Aplicar filtros
            </button>

            <button className="btn btn-secondary" onClick={limparFiltros}>
              Limpar filtros
            </button>

            <button className="btn btn-secondary" onClick={handleRestoreAllSections}>
              Restaurar removidos
            </button>

            <button className="btn btn-secondary" onClick={exportarCSV}>
              Exportar CSV
            </button>

            <button className="btn btn-secondary" onClick={exportarPDF}>
              Exportar PDF
            </button>
          </div>
        </div>

        <div className="patrol-danger-zone no-print">
          <h3>Administração de períodos</h3>
          <p>
            As ações abaixo alteram ou apagam dados de horas. Utilize somente no
            fechamento correto do período administrativo.
          </p>

          <div className="patrol-actions">
            <button className="btn btn-warning" onClick={zerarSemana}>
              Zerar semana
            </button>

            <button className="btn btn-danger" onClick={zerarMes}>
              Zerar mês
            </button>

            <button className="btn btn-danger" onClick={zerarHistorico}>
              Apagar histórico
            </button>
          </div>
        </div>

        {loading ? (
          <div className="patrol-card">
            <strong>Carregando relatório...</strong>
          </div>
        ) : null}

        {activeReport ? (
          <>
            <div className="patrol-card">
              <div className="patrol-report-header">
                <div>
                  <h2>{abaRelatorio === "atual" ? "Relatório Atual" : "Relatório Histórico"}</h2>
                  <div className="patrol-muted">
                    Período: <strong>{getPeriodLabel(activeReport.period)}</strong>
                  </div>
                  <div className="patrol-muted">
                    Gerado em: <strong>{formatarDataHora(activeReport.generatedAt)}</strong>
                  </div>
                  {abaRelatorio === "historico" ? (
                    <div className="patrol-muted">
                      Intervalo:{" "}
                      <strong>
                        {activeReport.filtersApplied.dataInicio || "-"} até{" "}
                        {activeReport.filtersApplied.dataFim || "-"}
                      </strong>
                    </div>
                  ) : null}
                </div>

                <div className="patrol-muted patrol-report-filters">
                  Filtros: status <strong>{activeReport.filtersApplied.status}</strong>, patente{" "}
                  <strong>{activeReport.filtersApplied.patente}</strong>, ausência{" "}
                  <strong>{activeReport.filtersApplied.ausencia || "todas"}</strong>
                  {activeReport.filtersApplied.funcional ? (
                    <>
                      , funcional <strong>{activeReport.filtersApplied.funcional}</strong>
                    </>
                  ) : null}
                  {activeReport.filtersApplied.search ? (
                    <>
                      , busca <strong>{activeReport.filtersApplied.search}</strong>
                    </>
                  ) : null}
                  <br />
                  Extração: <strong>{getExportTypeLabel(tipoExportacao, weeklyThresholdHours)}</strong>
                </div>
              </div>

              <div className="patrol-cards-grid">
                <CardResumo titulo="Policiais" valor={summaryVisual.total} />
                <CardResumo titulo="Ativos" valor={summaryVisual.ativos} />
                <CardResumo titulo="Ausentes" valor={summaryVisual.ausentes} />
                <CardResumo titulo="Afastados" valor={summaryVisual.afastados} />
                <CardResumo titulo="Horas semana" valor={formatarTempo(summaryVisual.totalSemana)} />
                <CardResumo titulo="Horas mês" valor={formatarTempo(summaryVisual.totalMes)} />
                <CardResumo titulo="Média semana" valor={formatarTempo(summaryVisual.mediaSemana)} />
                <CardResumo titulo="Média mês" valor={formatarTempo(summaryVisual.mediaMes)} />
                <CardResumo titulo="Ausência justificada" valor={summaryVisual.totalAusenciaJustificada} />
                <CardResumo titulo="Ausência não justificada" valor={summaryVisual.totalAusenciaNaoJustificada} />
                <CardResumo titulo="Iniciantes" valor={summaryVisual.totalIniciantes} />
                <CardResumo titulo="Top semana" valor={sectionsForView?.topWeek?.length || 0} />
                <CardResumo
                  titulo={`Acima de ${weeklyThresholdHours}h`}
                  valor={sectionsForView?.weekAboveThreshold?.length || 0}
                />
                <CardResumo titulo="0h na semana" valor={sectionsForView?.weekZero?.length || 0} />
              </div>
            </div>

            <RemovedList
              items={removedItems}
              onRestore={handleRestoreItem}
              weeklyThresholdHours={weeklyThresholdHours}
            />

            {mostrarTopMonth && (
              <SectionTable
                title={`Top ${topMonthLimit} do mês`}
                sectionKey="topMonth"
                list={activeReport.sections.topMonth || []}
                period={abaRelatorio === "historico" ? "history" : periodo}
                removedBySection={removedBySection}
                onRemoveItem={handleRemoveItem}
                onRestoreItem={handleRestoreItem}
              />
            )}

            {mostrarTopWeek && (
              <SectionTable
                title={`Top ${topMonthLimit} da semana`}
                sectionKey="topWeek"
                list={activeReport.sections.topWeek || []}
                period={abaRelatorio === "historico" ? "history" : periodo}
                removedBySection={removedBySection}
                onRemoveItem={handleRemoveItem}
                onRestoreItem={handleRestoreItem}
              />
            )}

            {mostrarWeekAboveThreshold && (
              <SectionTable
                title={`Policiais com ${weeklyThresholdHours}h ou mais na semana`}
                sectionKey="weekAboveThreshold"
                list={activeReport.sections.weekAboveThreshold || []}
                period={abaRelatorio === "historico" ? "history" : periodo}
                removedBySection={removedBySection}
                onRemoveItem={handleRemoveItem}
                onRestoreItem={handleRestoreItem}
              />
            )}

            {mostrarWeekBetween1mAnd5h59 && (
              <SectionTable
                title="Policiais entre 1 min e 5h59 na semana"
                sectionKey="weekBetween1mAnd5h59"
                list={getBetweenSectionList(activeReport.sections)}
                period={abaRelatorio === "historico" ? "history" : periodo}
                removedBySection={removedBySection}
                onRemoveItem={handleRemoveItem}
                onRestoreItem={handleRestoreItem}
              />
            )}

            {mostrarWeekZero && (
              <SectionTable
                title="Policiais com 0h na semana"
                sectionKey="weekZero"
                list={activeReport.sections.weekZero || []}
                period={abaRelatorio === "historico" ? "history" : periodo}
                removedBySection={removedBySection}
                onRemoveItem={handleRemoveItem}
                onRestoreItem={handleRestoreItem}
              />
            )}
          </>
        ) : null}

        {abaRelatorio === "atual" && (
          <>
            <div className="patrol-card">
              <div className="patrol-section-header">
                <h2>Controle de ausência por policial</h2>
                <div className="patrol-section-count">Atualização administrativa individual</div>
              </div>

              <div className="patrol-table-wrapper">
                <table className="patrol-table">
                  <thead>
                    <tr>
                      <th>Funcional</th>
                      <th>Nome</th>
                      <th>Patente</th>
                      <th>Status</th>
                      <th>Horas Semanais</th>
                      <th>Ausência atual</th>
                      <th>Marcação ADM</th>
                      <th>Observação</th>
                      <th>Salvar</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lista.length === 0 ? (
                      <tr>
                        <td className="patrol-empty-cell" colSpan="9">
                          Nenhum policial encontrado.
                        </td>
                      </tr>
                    ) : (
                      lista.map((item) => (
                        <tr key={item._id}>
                          <td>{item.funcional}</td>
                          <td>{item.nome}</td>
                          <td>{item.patente}</td>
                          <td><StatusBadge status={item.status} /></td>
                          <td>{formatarTempo(item.horasSemanaMin)}</td>
                          <td><AusenciaBadge value={item.ausenciaPatrulhamento} /></td>
                          <td>
                            <select
                              className="patrol-input"
                              value={absenceForms[item._id]?.ausenciaPatrulhamento || "normal"}
                              onChange={(e) =>
                                handleAbsenceFormChange(
                                  item._id,
                                  "ausenciaPatrulhamento",
                                  e.target.value
                                )
                              }
                            >
                              <option value="normal">Sem marcação</option>
                              <option value="justificada">Justificada</option>
                              <option value="nao_justificada">Não justificada</option>
                              <option value="iniciante">Iniciante</option>
                            </select>
                          </td>
                          <td>
                            <textarea
                              className="patrol-input patrol-absence-textarea"
                              value={absenceForms[item._id]?.observacaoAusencia || ""}
                              onChange={(e) =>
                                handleAbsenceFormChange(
                                  item._id,
                                  "observacaoAusencia",
                                  e.target.value
                                )
                              }
                              placeholder="Observação do ADM"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-primary"
                              onClick={() => atualizarAusencia(item._id)}
                            >
                              Salvar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="patrol-card">
              <div className="patrol-section-header">
                <h2>Lista geral de policiais</h2>
                <div className="patrol-section-count">Total exibido: {lista.length} registro(s)</div>
              </div>

              <div className="patrol-table-wrapper">
                <table className="patrol-table">
                  <thead>
                    <tr>
                      <th>Funcional</th>
                      <th>Nome</th>
                      <th>Patente</th>
                      <th>Status</th>
                      <th>Ausência</th>
                      <th>Horas Semanais</th>
                      <th>Horas Mensais</th>
                    </tr>
                  </thead>

                  <tbody>
                    {lista.length === 0 ? (
                      <tr>
                        <td className="patrol-empty-cell" colSpan="7">
                          Nenhum policial encontrado.
                        </td>
                      </tr>
                    ) : (
                      lista.map((item) => (
                        <tr key={item._id}>
                          <td>{item.funcional}</td>
                          <td>{item.nome}</td>
                          <td>{item.patente}</td>
                          <td><StatusBadge status={item.status} /></td>
                          <td><AusenciaBadge value={item.ausenciaPatrulhamento} /></td>
                          <td>{formatarTempo(item.horasSemanaMin)}</td>
                          <td>{formatarTempo(item.horasMesMin)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {abaRelatorio === "historico" && (
          <div className="patrol-card">
            <div className="patrol-section-header">
              <h2>Histórico detalhado</h2>
              <div className="patrol-section-count">Total exibido: {historyList.length} registro(s)</div>
            </div>

            <div className="patrol-table-wrapper">
              <table className="patrol-table">
                <thead>
                  <tr>
                    <th>Período início</th>
                    <th>Período fim</th>
                    <th>Tipo</th>
                    <th>Funcional</th>
                    <th>Nome</th>
                    <th>Patente</th>
                    <th>Status</th>
                    <th>Ausência</th>
                    <th>Horas Semanais</th>
                    <th>Horas Mensais</th>
                  </tr>
                </thead>

                <tbody>
                  {historyList.length === 0 ? (
                    <tr>
                      <td className="patrol-empty-cell" colSpan="10">
                        Nenhum registro histórico encontrado.
                      </td>
                    </tr>
                  ) : (
                    historyList.map((item) => (
                      <tr key={item._id}>
                        <td>{formatarData(item.periodoInicio || item.dataReferenciaInicio)}</td>
                        <td>{formatarData(item.periodoFim || item.dataReferenciaFim)}</td>
                        <td>{item.tipoRegistro || "-"}</td>
                        <td>{item.funcional}</td>
                        <td>{item.nome}</td>
                        <td>{item.patente}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td><AusenciaBadge value={item.ausenciaPatrulhamento} /></td>
                        <td>{formatarTempo(item.horasSemanaMin)}</td>
                        <td>{formatarTempo(item.horasMesMin)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeReport && sectionsForView ? (
          <div className="patrol-card">
            <h2>Resumo executivo</h2>

            <div className="patrol-executive-summary">
              <div className="patrol-status-bar">
                <strong>Status do relatório:</strong>{" "}
                {isManipulado ? (
                  <span style={{ color: "#ef4444" }}>Manipulado</span>
                ) : isFiltrado ? (
                  <span style={{ color: "#f59e0b" }}>Filtrado</span>
                ) : (
                  <span style={{ color: "#22c55e" }}>Completo</span>
                )}
              </div>

              <div><strong>Período analisado:</strong> {getPeriodLabel(activeReport.period)}</div>
              <div><strong>Total de policiais (recorte):</strong> {summaryVisual.total}</div>
              <div><strong>Ativos:</strong> {summaryVisual.ativos}</div>
              <div><strong>Ausentes:</strong> {summaryVisual.ausentes}</div>
              <div><strong>Afastados:</strong> {summaryVisual.afastados}</div>
              <div><strong>Total de horas semana:</strong> {formatarTempo(summaryVisual.totalSemana)}</div>
              <div><strong>Total de horas mês:</strong> {formatarTempo(summaryVisual.totalMes)}</div>
              <div><strong>Média semanal:</strong> {formatarTempo(summaryVisual.mediaSemana)}</div>
              <div><strong>Média mensal:</strong> {formatarTempo(summaryVisual.mediaMes)}</div>
              <div><strong>Justificadas:</strong> {summaryVisual.totalAusenciaJustificada}</div>
              <div><strong>Não justificadas:</strong> {summaryVisual.totalAusenciaNaoJustificada}</div>
              <div><strong>Iniciantes:</strong> {summaryVisual.totalIniciantes}</div>
              <div><strong>Top exibido:</strong> {sectionsForView.topMonth.length}</div>
              <div><strong>Top semanal exibido:</strong> {sectionsForView.topWeek.length}</div>
              <div><strong>Acima de {weeklyThresholdHours}h:</strong> {sectionsForView.weekAboveThreshold.length}</div>
              <div><strong>Entre 1 min e 5h59:</strong> {sectionsForView.weekBetween1mAnd5h59.length}</div>
              <div><strong>Zero horas:</strong> {sectionsForView.weekZero.length}</div>
              <div><strong>Removidos manualmente:</strong> {removedItems.length}</div>
              <div><strong>Tipo de extração:</strong> {getExportTypeLabel(tipoExportacao, weeklyThresholdHours)}</div>
              <div>
                <strong>Visualização das listas:</strong>{" "}
                {modoVisualizacao === "todas" ? "Todas as listas" : "Somente lista da extração"}
              </div>
              {abaRelatorio === "historico" ? (
                <div>
                  <strong>Intervalo:</strong> {dataInicio || "-"} até {dataFim || "-"}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}