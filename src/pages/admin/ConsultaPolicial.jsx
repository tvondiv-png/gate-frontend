import { useState } from "react";
import api from "../../api/api";

import "../../styles/admin-module-premium.css";
import "../../styles/consulta-policial.css";

const badgeClass = (status) => {
  if (status === "Regular") return "success";
  if (status === "Atenção") return "warning";
  return "danger";
};

const statusRsoClass = (status) => {
  const valor = String(status || "")
    .trim()
    .toLowerCase();

  if (valor === "ativo") return "ativo";
  if (valor === "aprovado") return "aprovado";
  if (valor === "rejeitado") return "rejeitado";

  return "pendente";
};

export default function ConsultaPolicial() {
  const [funcional, setFuncional] = useState("");
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================================================
     BUSCA
  ========================================================= */

  const buscar = async () => {
    if (!funcional) {
      alert("Digite a funcional");
      return;
    }

    try {
      setLoading(true);

      const res = await api.get(
        `/api/admin/consulta/${funcional}`
      );

      setDados(res.data);
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Erro na consulta"
      );

      setDados(null);
    } finally {
      setLoading(false);
    }
  };

  const buscarComEnter = (e) => {
    if (e.key === "Enter") {
      buscar();
    }
  };

  /* =========================================================
     FORMATADORES
  ========================================================= */

  const formatarHoras = (min) => {
    if (!min || min <= 0) {
      return "0h 0min";
    }

    const h = Math.floor(min / 60);
    const m = min % 60;

    return `${h}h ${m}min`;
  };

  const formatarData = (data) => {
    if (!data) return "-";

    const valor = new Date(data);

    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {
      return "-";
    }

    return valor.toLocaleString(
      "pt-BR"
    );
  };

  const formatarDataCurta = (data) => {
    if (!data) return "-";

    const valor = new Date(data);

    if (
      Number.isNaN(
        valor.getTime()
      )
    ) {
      return "-";
    }

    return valor.toLocaleDateString(
      "pt-BR"
    );
  };

  const formatarQualificacaoRocam = (
    valor
  ) => {
    if (valor === "BRACAL_ROCAM") {
      return "Braçal ROCAM";
    }

    if (valor === "ESTAGIARIO_ROCAM") {
      return "Estagiário ROCAM";
    }

    return "Não possui";
  };

  const formatarUltimaPatrulha = (
    patrulha
  ) => {
    if (!patrulha) {
      return null;
    }

    return {
      tipo:
        patrulha.tipoPatrulhamento ||
        "VIATURA",

      viatura:
        patrulha.viatura ||
        "-",

      cargo:
        patrulha.cargo ||
        "-",

      data:
        formatarData(
          patrulha.data
        )
    };
  };

  const formatarUltimoRSO = (rso) => {
    if (!rso) {
      return null;
    }

    return {
      tipo:
        rso.tipoPatrulhamento ||
        "VIATURA",

      viatura:
        rso.viatura ||
        "-",

      cargo:
        rso.cargo ||
        "-",

      status:
        rso.status ||
        "-",

      data:
        formatarData(
          rso.data
        )
    };
  };

  const ultimaPatrulha =
    formatarUltimaPatrulha(
      dados?.ultimaPatrulha
    );

  const ultimoRSO =
    formatarUltimoRSO(
      dados?.ultimoRSO
    );

  const possuiRocam =
    dados?.qualificacaoRocam &&
    dados.qualificacaoRocam !==
      "NENHUM";

  return (
    <div className="consulta-page">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <header className="consulta-topbar">

        <div>
          <span className="consulta-kicker">
            2º BPChq • ANCHIETA
          </span>

          <h1>
            Consulta Policial
          </h1>

          <p>
            Visão consolidada de dados
            institucionais, operacionais e
            disciplinares.
          </p>
        </div>

      </header>

      {/* =====================================================
          BUSCA
      ===================================================== */}

      <section className="consulta-search-panel">

        <div className="consulta-search-text">

          <span>
            CONSULTA POR FUNCIONAL
          </span>

          <strong>
            Localizar policial
          </strong>

          <small>
            Informe a funcional para acessar
            o painel completo.
          </small>

        </div>

        <div className="consulta-search-form">

          <input
            type="number"
            className="consulta-input"
            placeholder="Digite a funcional"
            value={funcional}
            onChange={(e) =>
              setFuncional(
                e.target.value
              )
            }
            onKeyDown={
              buscarComEnter
            }
          />

          <button
            type="button"
            className="consulta-search-btn"
            onClick={buscar}
            disabled={loading}
          >
            {loading
              ? "Buscando..."
              : "Buscar policial"}
          </button>

        </div>

      </section>

      {!dados && !loading && (
        <div className="consulta-empty-start">

          <div className="consulta-empty-icon">
            🔎
          </div>

          <strong>
            Nenhuma consulta aberta
          </strong>

          <span>
            Digite a funcional de um policial
            para visualizar as informações.
          </span>

        </div>
      )}

      {dados && (
        <>

          {/* =================================================
              IDENTIDADE PRINCIPAL
          ================================================= */}

          <section className="consulta-profile">

            <div className="consulta-profile-main">

              <div className="consulta-avatar">
                {String(
                  dados.nome || "P"
                )
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="consulta-profile-info">

                <div className="consulta-profile-title">

                  <div>
                    <small>
                      POLICIAL CONSULTADO
                    </small>

                    <h2>
                      {dados.patente || "-"}{" "}
                      {dados.nome || "-"}
                    </h2>
                  </div>

                  <span
                    className={`consulta-status ${badgeClass(
                      dados.statusOperacional
                    )}`}
                  >
                    {dados.statusOperacional ||
                      "-"}
                  </span>

                </div>

                <div className="consulta-profile-tags">

                  <span>
                    Funcional{" "}
                    <strong>
                      {dados.funcional ||
                        "-"}
                    </strong>
                  </span>

                  {possuiRocam && (
                    <span className="consulta-tag-rocam">
                      {formatarQualificacaoRocam(
                        dados.qualificacaoRocam
                      )}
                    </span>
                  )}

                </div>

              </div>

            </div>

            <div className="consulta-profile-grid">

              <div className="consulta-profile-item">
                <small>
                  Entrada
                </small>

                <strong>
                  {formatarDataCurta(
                    dados.dataEntrada
                  )}
                </strong>
              </div>

              <div className="consulta-profile-item">
                <small>
                  Última promoção
                </small>

                <strong>
                  {formatarDataCurta(
                    dados.dataUltimaPromocao
                  )}
                </strong>
              </div>

              <div className="consulta-profile-item">
                <small>
                  Qualificação ROCAM
                </small>

                <strong>
                  {formatarQualificacaoRocam(
                    dados.qualificacaoRocam
                  )}
                </strong>
              </div>

            </div>

          </section>

          {/* =================================================
              HORAS
          ================================================= */}

          <section className="consulta-hours-grid">

            <div className="consulta-hour-card destaque">

              <small>
                Horas na semana
              </small>

              <strong>
                {formatarHoras(
                  dados.horasSemana
                )}
              </strong>

            </div>

            <div className="consulta-hour-card">

              <small>
                Horas no mês
              </small>

              <strong>
                {formatarHoras(
                  dados.horasMes
                )}
              </strong>

            </div>

            <div className="consulta-hour-card">

              <small>
                Meta semanal
              </small>

              <strong>
                {formatarHoras(
                  dados.metaSemanal
                )}
              </strong>

            </div>

            <div
              className={`consulta-hour-card ${
                dados.faltante > 0
                  ? "warning"
                  : "success"
              }`}
            >

              <small>
                Faltante
              </small>

              <strong>
                {formatarHoras(
                  dados.faltante
                )}
              </strong>

            </div>

          </section>

          {/* =================================================
              PATRULHA / ÚLTIMO RSO
          ================================================= */}

          <section className="consulta-operacional-grid">

            <div
              className={`consulta-op-card ${
                ultimaPatrulha?.tipo ===
                "ROCAM"
                  ? "rocam"
                  : ""
              }`}
            >

              <div className="consulta-op-header">

                <div>
                  <small>
                    ÚLTIMA PATRULHA
                  </small>

                  <h3>
                    {ultimaPatrulha
                      ? ultimaPatrulha.viatura
                      : "Sem registro"}
                  </h3>
                </div>

                {ultimaPatrulha && (
                  <span className="consulta-op-type">
                    {
                      ultimaPatrulha.tipo
                    }
                  </span>
                )}

              </div>

              {ultimaPatrulha ? (
                <div className="consulta-op-info">

                  <div>
                    <small>
                      Função
                    </small>

                    <strong>
                      {
                        ultimaPatrulha.cargo
                      }
                    </strong>
                  </div>

                  <div>
                    <small>
                      Data
                    </small>

                    <strong>
                      {
                        ultimaPatrulha.data
                      }
                    </strong>
                  </div>

                </div>
              ) : (
                <div className="consulta-op-empty">
                  Nenhuma patrulha encontrada.
                </div>
              )}

            </div>

            <div
              className={`consulta-op-card ${
                ultimoRSO?.tipo === "ROCAM"
                  ? "rocam"
                  : ""
              }`}
            >

              <div className="consulta-op-header">

                <div>
                  <small>
                    ÚLTIMO RSO
                  </small>

                  <h3>
                    {ultimoRSO
                      ? ultimoRSO.viatura
                      : "Sem registro"}
                  </h3>
                </div>

                {ultimoRSO && (
                  <span
                    className={`consulta-rso-status ${statusRsoClass(
                      ultimoRSO.status
                    )}`}
                  >
                    {ultimoRSO.status}
                  </span>
                )}

              </div>

              {ultimoRSO ? (
                <div className="consulta-op-info">

                  <div>
                    <small>
                      Tipo
                    </small>

                    <strong>
                      {ultimoRSO.tipo}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Função
                    </small>

                    <strong>
                      {ultimoRSO.cargo}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Data
                    </small>

                    <strong>
                      {ultimoRSO.data}
                    </strong>
                  </div>

                </div>
              ) : (
                <div className="consulta-op-empty">
                  Nenhum RSO encontrado.
                </div>
              )}

            </div>

          </section>

          {/* =================================================
              SITUAÇÃO / COMUNICAÇÃO
          ================================================= */}

          <section className="consulta-info-grid">

            <div className="consulta-panel">

              <div className="consulta-panel-header">
                <div>
                  <small>
                    DISCIPLINA
                  </small>

                  <h3>
                    Situação atual
                  </h3>
                </div>

                <span
                  className={`consulta-indicator ${
                    dados.advertenciaAtiva
                      ? "danger"
                      : "success"
                  }`}
                >
                  {dados.advertenciaAtiva
                    ? "Atenção"
                    : "Regular"}
                </span>

              </div>

              <div className="consulta-data-list">

                <div>
                  <span>
                    Advertência ativa
                  </span>

                  <strong>
                    {dados.advertenciaAtiva
                      ? "Sim"
                      : "Não"}
                  </strong>
                </div>

                <div>
                  <span>
                    Tipo
                  </span>

                  <strong>
                    {dados.tipoAdvertencia ||
                      "-"}
                  </strong>
                </div>

              </div>

            </div>

            <div className="consulta-panel">

              <div className="consulta-panel-header">
                <div>
                  <small>
                    COMUNICAÇÃO
                  </small>

                  <h3>
                    Notificações
                  </h3>
                </div>
              </div>

              <div className="consulta-data-list">

                <div>
                  <span>
                    Total
                  </span>

                  <strong>
                    {dados.totalNotificacoes ??
                      0}
                  </strong>
                </div>

                <div>
                  <span>
                    Não lidas
                  </span>

                  <strong>
                    {dados.notificacoesNaoLidas ??
                      0}
                  </strong>
                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              CARREIRA
          ================================================= */}

          <section className="consulta-info-grid">

            <div className="consulta-panel">

              <div className="consulta-panel-header">
                <div>
                  <small>
                    FORMAÇÃO
                  </small>

                  <h3>
                    Cursos
                  </h3>
                </div>

                <span className="consulta-count">
                  {Array.isArray(
                    dados.cursos
                  )
                    ? dados.cursos.length
                    : 0}
                </span>

              </div>

              {Array.isArray(
                dados.cursos
              ) &&
              dados.cursos.length > 0 ? (
                <div className="consulta-chips">

                  {dados.cursos.map(
                    (curso, index) => (
                      <span key={index}>
                        {curso}
                      </span>
                    )
                  )}

                </div>
              ) : (
                <div className="consulta-panel-empty">
                  Nenhum curso registrado.
                </div>
              )}

            </div>

            <div className="consulta-panel">

              <div className="consulta-panel-header">
                <div>
                  <small>
                    CONDECORAÇÕES
                  </small>

                  <h3>
                    Medalhas
                  </h3>
                </div>

                <span className="consulta-count">
                  {Array.isArray(
                    dados.medalhas
                  )
                    ? dados.medalhas.length
                    : 0}
                </span>

              </div>

              {Array.isArray(
                dados.medalhas
              ) &&
              dados.medalhas.length > 0 ? (
                <div className="consulta-chips medalhas">

                  {dados.medalhas.map(
                    (medalha, index) => (
                      <span key={index}>
                        🏅 {medalha}
                      </span>
                    )
                  )}

                </div>
              ) : (
                <div className="consulta-panel-empty">
                  Nenhuma medalha registrada.
                </div>
              )}

            </div>

          </section>

          {/* =================================================
              HISTÓRICOS
          ================================================= */}

          <section className="consulta-history-grid">

            {/* ADVERTÊNCIAS */}

            <div className="consulta-panel">

              <div className="consulta-panel-header">

                <div>
                  <small>
                    HISTÓRICO DISCIPLINAR
                  </small>

                  <h3>
                    Advertências
                  </h3>
                </div>

                <span className="consulta-count">
                  {Array.isArray(
                    dados.historicoAdvertencias
                  )
                    ? dados.historicoAdvertencias
                        .length
                    : 0}
                </span>

              </div>

              {Array.isArray(
                dados.historicoAdvertencias
              ) &&
              dados.historicoAdvertencias
                .length > 0 ? (
                <div className="consulta-table-wrap">

                  <table className="consulta-table">

                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Semana</th>
                        <th>Status</th>
                        <th>Data</th>
                      </tr>
                    </thead>

                    <tbody>

                      {dados.historicoAdvertencias.map(
                        (a) => (
                          <tr key={a._id}>

                            <td>
                              {a.tipo || "-"}
                            </td>

                            <td>
                              {a.semanaReferencia ||
                                "-"}
                            </td>

                            <td>
                              <span
                                className={`consulta-mini-status ${
                                  a.ativa
                                    ? "danger"
                                    : "muted"
                                }`}
                              >
                                {a.ativa
                                  ? "Ativa"
                                  : "Encerrada"}
                              </span>
                            </td>

                            <td>
                              {formatarData(
                                a.createdAt
                              )}
                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              ) : (
                <div className="consulta-panel-empty">
                  Nenhuma advertência registrada.
                </div>
              )}

            </div>

            {/* RSO */}

            <div className="consulta-panel">

              <div className="consulta-panel-header">

                <div>
                  <small>
                    HISTÓRICO OPERACIONAL
                  </small>

                  <h3>
                    Últimos RSOs
                  </h3>
                </div>

                <span className="consulta-count">
                  {Array.isArray(
                    dados.ultimosRSOs
                  )
                    ? dados.ultimosRSOs.length
                    : 0}
                </span>

              </div>

              {Array.isArray(
                dados.ultimosRSOs
              ) &&
              dados.ultimosRSOs.length >
                0 ? (
                <div className="consulta-rso-list">

                  {dados.ultimosRSOs.map(
                    (rso) => (

                      <div
                        key={rso._id}
                        className={`consulta-rso-item ${
                          rso.tipoPatrulhamento ===
                          "ROCAM"
                            ? "rocam"
                            : ""
                        }`}
                      >

                        <div className="consulta-rso-main">

                          <div>
                            <small>
                              {rso.tipoPatrulhamento ||
                                "VIATURA"}
                            </small>

                            <strong>
                              {rso.viatura ||
                                "-"}
                            </strong>
                          </div>

                          <span
                            className={`consulta-rso-status ${statusRsoClass(
                              rso.status
                            )}`}
                          >
                            {rso.status ||
                              "-"}
                          </span>

                        </div>

                        <div className="consulta-rso-meta">

                          <span>
                            {rso.cargo ||
                              "-"}
                          </span>

                          <span>
                            •
                          </span>

                          <span>
                            {formatarData(
                              rso.createdAt
                            )}
                          </span>

                        </div>

                        {rso.observacoes && (
                          <p>
                            {rso.observacoes}
                          </p>
                        )}

                      </div>
                    )
                  )}

                </div>
              ) : (
                <div className="consulta-panel-empty">
                  Nenhum RSO encontrado.
                </div>
              )}

            </div>

          </section>

        </>
      )}

    </div>
  );
}