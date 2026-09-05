import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "../../styles/comando-patrulha-premium.css";

const MINIMO_PATRULHA_MIN = 360;

const formatarMinutos = (min) => {
  if (!min) return "0h";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m}min`;
  if (!m) return `${h}h`;
  return `${h}h ${m}min`;
};

const ausenciaLabel = (tipo) => {
  if (tipo === "nao_justificada") return "Não justificada";
  if (tipo === "justificada") return "Justificada";
  if (tipo === "iniciante") return "Iniciante";
  return "";
};

const badgeClassePatrulha = (min) => {
  if ((min || 0) === 0) return "danger";
  if ((min || 0) < MINIMO_PATRULHA_MIN) return "warning";
  return "success";
};

const labelPatrulha = (min) => {
  if ((min || 0) === 0) return "0h";
  if ((min || 0) < MINIMO_PATRULHA_MIN) return "< 6h";
  if ((min || 0) === MINIMO_PATRULHA_MIN) return "Meta";
  return "Acima da meta";
};

async function carregarLogoBase64() {
  try {
    const response = await fetch("/anchieta-logo.png");
    const blob = await response.blob();

    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Erro ao carregar logo do 2º BPChq Anchieta:", err);
    return null;
  }
}

export default function ComandoPatrulha() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [filtroPatrulha, setFiltroPatrulha] = useState("todos");
  const [fStatus, setFStatus] = useState("");
  const [fFuncao, setFFuncao] = useState("");

  const [filtrosAplicados, setFiltrosAplicados] = useState({
    busca: "",
    patrulha: "todos",
    status: "",
    funcao: ""
  });

  const carregar = async () => {
    try {
      setLoading(true);

      const [resPatrol, resHierarchy] = await Promise.all([
        api.get("/api/patrol-hours"),
        api.get("/api/hierarchy")
      ]);

      const patrol = Array.isArray(resPatrol.data) ? resPatrol.data : [];
      const hierarchy = Array.isArray(resHierarchy.data) ? resHierarchy.data : [];

      const mapaHierarchy = new Map(
        hierarchy.map((h) => [Number(h.funcional), h])
      );

      const combinado = patrol.map((p) => {
        const h = mapaHierarchy.get(Number(p.funcional));

        return {
          ...p,
          nome: h?.nome || p.nome || "-",
          patente: h?.patente || p.patente || "-",
          funcao: h?.funcao || "-",
          categoria: h?.categoria || "-",
          status: h?.status || p.status || "-",
          cursos: h?.cursos || [],
          medalhas: h?.medalhas || []
        };
      });

      setLista(combinado);
    } catch (err) {
      console.error("Erro ao carregar patrulha:", err);
      setLista([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const funcoes = useMemo(() => {
    return [...new Set(lista.map((item) => item.funcao).filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), "pt-BR")
    );
  }, [lista]);

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      busca,
      patrulha: filtroPatrulha,
      status: fStatus,
      funcao: fFuncao
    });
  };

  const limparFiltros = () => {
    setBusca("");
    setFiltroPatrulha("todos");
    setFStatus("");
    setFFuncao("");

    setFiltrosAplicados({
      busca: "",
      patrulha: "todos",
      status: "",
      funcao: ""
    });
  };

  const filtrados = useMemo(() => {
    return lista
      .filter((item) => {
        const texto = [
          item.funcional,
          item.nome,
          item.patente,
          item.funcao,
          item.categoria,
          item.status
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const okBusca = filtrosAplicados.busca.trim()
          ? texto.includes(filtrosAplicados.busca.trim().toLowerCase())
          : true;

        const okStatus = filtrosAplicados.status
          ? item.status === filtrosAplicados.status
          : true;

        const okFuncao = filtrosAplicados.funcao
          ? item.funcao === filtrosAplicados.funcao
          : true;

        let okPatrulha = true;

        if (filtrosAplicados.patrulha === "zero") {
          okPatrulha = (item.horasSemanaMin || 0) === 0;
        }

        if (filtrosAplicados.patrulha === "abaixo6") {
          okPatrulha =
            (item.horasSemanaMin || 0) > 0 &&
            (item.horasSemanaMin || 0) < MINIMO_PATRULHA_MIN;
        }

        if (filtrosAplicados.patrulha === "meta") {
          okPatrulha = (item.horasSemanaMin || 0) >= MINIMO_PATRULHA_MIN;
        }

        if (filtrosAplicados.patrulha === "acima") {
          okPatrulha = (item.horasSemanaMin || 0) > MINIMO_PATRULHA_MIN;
        }

        return okBusca && okStatus && okFuncao && okPatrulha;
      })
      .sort((a, b) => (b.horasSemanaMin || 0) - (a.horasSemanaMin || 0));
  }, [lista, filtrosAplicados]);

  const resumo = useMemo(() => {
    const ativos = lista.filter((p) => p.status === "Ativo");

    return {
      total: lista.length,
      ativos: ativos.length,
      zeroHoras: ativos.filter((p) => (p.horasSemanaMin || 0) === 0).length,
      abaixo6h: ativos.filter(
        (p) =>
          (p.horasSemanaMin || 0) > 0 &&
          (p.horasSemanaMin || 0) < MINIMO_PATRULHA_MIN
      ).length,
      meta: ativos.filter((p) => (p.horasSemanaMin || 0) >= MINIMO_PATRULHA_MIN).length
    };
  }, [lista]);

  const exportarPDF = async () => {
    const doc = new jsPDF("landscape", "mm", "a4");
    const dataAtual = new Date().toLocaleString("pt-BR");
    const logoBase64 = await carregarLogoBase64();

    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", 14, 8, 18, 18);
    }

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2º BATALHÃO DE POLÍCIA DE CHOQUE - ANCHIETA", 38, 12);

    doc.setFontSize(18);
    doc.text("Relatório de Patrulha - Comando", 38, 19);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    doc.text(`Emitido em: ${dataAtual}`, 38, 25);

    const filtrosTexto = [
      `Busca: ${filtrosAplicados.busca || "Todos"}`,
      `Patrulha: ${
        filtrosAplicados.patrulha === "todos"
          ? "Todos"
          : filtrosAplicados.patrulha === "zero"
          ? "Somente 0h"
          : filtrosAplicados.patrulha === "abaixo6"
          ? "Menos de 6h"
          : filtrosAplicados.patrulha === "meta"
          ? "Cumpriu meta"
          : "Acima da meta"
      }`,
      `Status: ${filtrosAplicados.status || "Todos"}`,
      `Função: ${filtrosAplicados.funcao || "Todas"}`
    ];

    doc.text(filtrosTexto, 14, 36);

    autoTable(doc, {
      startY: 46,
      head: [[
        "Funcional",
        "Nome",
        "Patente",
        "Função",
        "Status",
        "Horas Semana",
        "Horas Mês",
        "Faixa",
        "Ausência"
      ]],
      body: filtrados.map((item) => [
        item.funcional,
        item.nome,
        item.patente || "-",
        item.funcao || "-",
        item.status || "-",
        formatarMinutos(item.horasSemanaMin || 0),
        formatarMinutos(item.horasMesMin || 0),
        labelPatrulha(item.horasSemanaMin || 0),
        ausenciaLabel(item.ausenciaPatrulhamento)
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: "middle",
        textColor: [20, 20, 20]
      },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255]
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      didParseCell: function (data) {
        if (data.section === "body" && data.column.index === 8) {
          const valor = data.cell.raw;

          if (valor === "Justificada") {
            data.cell.styles.fillColor = [34, 197, 94];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          }

          if (valor === "Não justificada") {
            data.cell.styles.fillColor = [239, 68, 68];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          }

          if (valor === "Iniciante") {
            data.cell.styles.fillColor = [59, 130, 246];
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontStyle = "bold";
          }

          if (!valor) {
            data.cell.styles.fillColor = [255, 255, 255];
            data.cell.styles.textColor = [20, 20, 20];
          }
        }
      }
    });

    const totalPaginas = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      doc.setPage(pagina);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(110, 110, 110);

      doc.text(
        "2º BPChq Anchieta • Relatório institucional de patrulha",
        14,
        202
      );

      doc.text(
        `Página ${pagina} de ${totalPaginas}`,
        260,
        202
      );
    }

    doc.save("relatorio-patrulha-comando.pdf");
  };

  if (loading) {
    return <div className="patrulha-page">Carregando patrulha...</div>;
  }

  return (
    <div className="patrulha-page">
      <div className="patrulha-hero">
        <div>
          <span className="patrulha-kicker">2º BPChq ANCHIETA • COMANDO • PATRULHA</span>
          <h1>Painel de Patrulha Operacional</h1>
          <p>
            Controle estratégico da carga horária semanal e mensal, com filtros
            executivos e emissão de relatório em PDF.
          </p>
        </div>

        <div className="patrulha-hero-actions">
          <button className="patrulha-btn dark" onClick={carregar}>
            Recarregar
          </button>
          <button className="patrulha-btn gold" onClick={exportarPDF}>
            Exportar PDF
          </button>
        </div>
      </div>

      <section className="patrulha-summary-grid">
        <div className="patrulha-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>

        <div className="patrulha-summary-card">
          <small>Ativos</small>
          <strong>{resumo.ativos}</strong>
        </div>

        <div className="patrulha-summary-card danger">
          <small>0h na semana</small>
          <strong>{resumo.zeroHoras}</strong>
        </div>

        <div className="patrulha-summary-card warning">
          <small>Abaixo de 6h</small>
          <strong>{resumo.abaixo6h}</strong>
        </div>

        <div className="patrulha-summary-card success">
          <small>Meta cumprida</small>
          <strong>{resumo.meta}</strong>
        </div>
      </section>

      <section className="patrulha-section">
        <div className="patrulha-section-title">
          <div>
            <h2>Filtros Operacionais</h2>
            <span>Refine a lista antes de gerar o relatório.</span>
          </div>
        </div>

        <div className="patrulha-filters">
          <input
            className="patrulha-input"
            placeholder="Buscar por nome, funcional, patente ou função"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="patrulha-select"
            value={filtroPatrulha}
            onChange={(e) => setFiltroPatrulha(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="zero">Somente 0 horas</option>
            <option value="abaixo6">Menos de 6 horas</option>
            <option value="meta">Cumpriu a meta</option>
            <option value="acima">Acima da meta</option>
          </select>

          <select
            className="patrulha-select"
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Ausente">Ausente</option>
            <option value="Afastado">Afastado</option>
          </select>

          <select
            className="patrulha-select"
            value={fFuncao}
            onChange={(e) => setFFuncao(e.target.value)}
          >
            <option value="">Todas as funções</option>
            {funcoes.map((funcao) => (
              <option key={funcao} value={funcao}>
                {funcao}
              </option>
            ))}
          </select>
        </div>

        <div className="patrulha-actions">
          <button className="patrulha-btn green" onClick={aplicarFiltros}>
            Aplicar filtros
          </button>

          <button className="patrulha-btn light" onClick={limparFiltros}>
            Limpar filtros
          </button>
        </div>
      </section>

      <section className="patrulha-section">
        <div className="patrulha-section-title">
          <div>
            <h2>Resultado da Patrulha</h2>
            <span>Total filtrado: {filtrados.length}</span>
          </div>
        </div>

        <div className="patrulha-table-wrap">
          <table className="patrulha-table">
            <thead>
              <tr>
                <th>Funcional</th>
                <th>Nome</th>
                <th>Patente</th>
                <th>Função</th>
                <th>Status</th>
                <th>Horas Semana</th>
                <th>Horas Mês</th>
                <th>Faixa</th>
                <th>Ausência</th>
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
                  <tr key={item._id || item.funcional}>
                    <td>{item.funcional}</td>
                    <td>{item.nome}</td>
                    <td>{item.patente || "-"}</td>
                    <td>{item.funcao || "-"}</td>
                    <td>{item.status || "-"}</td>
                    <td>{formatarMinutos(item.horasSemanaMin || 0)}</td>
                    <td>{formatarMinutos(item.horasMesMin || 0)}</td>
                    <td>
                      <span className={`patrulha-badge ${badgeClassePatrulha(item.horasSemanaMin)}`}>
                        {labelPatrulha(item.horasSemanaMin || 0)}
                      </span>
                    </td>
                    <td>
                      {ausenciaLabel(item.ausenciaPatrulhamento) ? (
                        <span
                          className={`patrulha-badge ${
                            item.ausenciaPatrulhamento === "justificada"
                              ? "success"
                              : item.ausenciaPatrulhamento === "nao_justificada"
                              ? "danger"
                              : "info"
                          }`}
                        >
                          {ausenciaLabel(item.ausenciaPatrulhamento)}
                        </span>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}