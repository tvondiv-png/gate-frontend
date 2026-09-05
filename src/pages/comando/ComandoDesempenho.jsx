import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

const badgeClass = (classificacao) => {
  if (classificacao === "EXCELÊNCIA") return "success";
  if (classificacao === "ALTO DESEMPENHO") return "info";
  if (classificacao === "CRÍTICO") return "danger";
  return "warning";
};

export default function ComandoDesempenho() {
  const [lista, setLista] = useState([]);
  const [busca, setBusca] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState("todos");
  const [filtroClassificacao, setFiltroClassificacao] = useState("todos");

  const carregar = async () => {
    try {
      const res = await api.get("/api/comando/score-desempenho");
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar score de desempenho:", err);
      setLista([]);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const funcoes = useMemo(() => {
    return [...new Set(lista.map((x) => x.funcao).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [lista]);

  const filtrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return lista.filter((item) => {
      const texto = [
        item.nome,
        item.funcional,
        item.patente,
        item.funcao,
        item.classificacao
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const okBusca = termo ? texto.includes(termo) : true;
      const okFuncao = filtroFuncao === "todos" ? true : item.funcao === filtroFuncao;
      const okClassificacao =
        filtroClassificacao === "todos" ? true : item.classificacao === filtroClassificacao;

      return okBusca && okFuncao && okClassificacao;
    });
  }, [lista, busca, filtroFuncao, filtroClassificacao]);

  const resumo = useMemo(() => {
    return {
      total: filtrada.length,
      excelencia: filtrada.filter((x) => x.classificacao === "EXCELÊNCIA").length,
      alto: filtrada.filter((x) => x.classificacao === "ALTO DESEMPENHO").length,
      atencao: filtrada.filter((x) => x.classificacao === "ATENÇÃO").length,
      critico: filtrada.filter((x) => x.classificacao === "CRÍTICO").length
    };
  }, [filtrada]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Comando • Score de Desempenho</h1>
          <p>
            Leitura consolidada do desempenho real do policial, cruzando horas,
            ações, disciplina e ausência de patrulhamento.
          </p>
        </div>

        <button className="admin-module-btn blue" onClick={carregar}>
          Recarregar
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Excelência</small>
          <strong>{resumo.excelencia}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Alto desempenho</small>
          <strong>{resumo.alto}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Atenção</small>
          <strong>{resumo.atencao}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Crítico</small>
          <strong>{resumo.critico}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-grid">
          <input
            className="admin-module-input"
            placeholder="Buscar por nome, funcional, patente ou função"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={filtroFuncao}
            onChange={(e) => setFiltroFuncao(e.target.value)}
          >
            <option value="todos">Todas as funções</option>
            {funcoes.map((funcao) => (
              <option key={funcao} value={funcao}>
                {funcao}
              </option>
            ))}
          </select>

          <select
            className="admin-module-select"
            value={filtroClassificacao}
            onChange={(e) => setFiltroClassificacao(e.target.value)}
          >
            <option value="todos">Todas as classificações</option>
            <option value="EXCELÊNCIA">Excelência</option>
            <option value="ALTO DESEMPENHO">Alto desempenho</option>
            <option value="ATENÇÃO">Atenção</option>
            <option value="CRÍTICO">Crítico</option>
          </select>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Painel de score</h2>
            <span>Total filtrado: {filtrada.length}</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Funcional</th>
                <th>Nome</th>
                <th>Patente</th>
                <th>Função</th>
                <th>Horas Semana</th>
                <th>Ações</th>
                <th>Advertências</th>
                <th>Casos</th>
                <th>Score</th>
                <th>Classificação</th>
              </tr>
            </thead>

            <tbody>
              {filtrada.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>
                    Nenhum policial encontrado.
                  </td>
                </tr>
              ) : (
                filtrada.map((item) => (
                  <tr key={item._id}>
                    <td>{item.funcional}</td>
                    <td>{item.nome}</td>
                    <td>{item.patente || "-"}</td>
                    <td>{item.funcao || "-"}</td>
                    <td>{item.horasSemanaTexto || "0h"}</td>
                    <td>{item.totalAcoes || 0}</td>
                    <td>{item.totalAdvertencias || 0}</td>
                    <td>{item.totalCasosDisciplinares || 0}</td>
                    <td>
                      <strong>{item.scoreFinal || 0}</strong>
                    </td>
                    <td>
                      <span className={`admin-module-badge ${badgeClass(item.classificacao)}`}>
                        {item.classificacao || "-"}
                      </span>
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