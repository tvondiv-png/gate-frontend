import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "./rso-admin.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const formatarDataHora = (valor) => {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR");
};

const formatarPessoa = (p) => {
  if (!p) return "-";

  return `${p.patente || "-"} ${p.nome || "-"} (${p.funcional || "-"})`;
};

const formatarTempo = (min) => {
  if (!min || min <= 0) return "-";

  const h = Math.floor(min / 60);
  const m = min % 60;

  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;

  return `${h}h ${m}min`;
};

/* =========================================================
   NOVA EQUIPE DINÂMICA
========================================================= */

const getEquipeDinamica = (rso) => {
  return Array.isArray(rso?.equipe)
    ? rso.equipe.filter((p) => p && p.funcional)
    : [];
};

/* =========================================================
   TODOS OS INTEGRANTES

   Suporta:
   - equipe[] nova
   - equipeFixa antiga
   - equipeRotativa antiga
========================================================= */

const getTodosIntegrantes = (rso) => {
  const integrantes = [];

  getEquipeDinamica(rso).forEach((p) => {
    integrantes.push(p);
  });

  if (rso?.equipeFixa?.chefe?.funcional) {
    integrantes.push(rso.equipeFixa.chefe);
  }

  if (rso?.equipeFixa?.auxiliar?.funcional) {
    integrantes.push(rso.equipeFixa.auxiliar);
  }

  Object.values(rso?.equipeRotativa || {}).forEach((lista) => {
    if (!Array.isArray(lista)) return;

    lista.forEach((p) => {
      if (p?.funcional) {
        integrantes.push(p);
      }
    });
  });

  return integrantes;
};

/* =========================================================
   ENCARREGADO / RESPONSÁVEL DO RSO
========================================================= */

const getEncarregadoRSO = (rso) => {
  const dinamica = getEquipeDinamica(rso);

  /*
   * NOVO MODELO
   */
  if (dinamica.length > 0) {
    /*
     * Primeiro tentamos encontrar
     * o Encarregado que ainda está ativo.
     */
    const encarregadoAtivo = dinamica.find(
      (p) =>
        p?.cargo === "Encarregado" &&
        p?.status === "Ativo"
    );

    if (encarregadoAtivo) {
      return encarregadoAtivo;
    }

    /*
     * Caso o RSO já tenha sido encerrado,
     * todos estarão Encerrados.
     *
     * Então mostramos o último policial
     * que exerceu a função de Encarregado.
     */
    const encarregados = dinamica.filter(
      (p) => p?.cargo === "Encarregado"
    );

    if (encarregados.length > 0) {
      return encarregados[
        encarregados.length - 1
      ];
    }

    /*
     * Compatibilidade com algum RSO
     * dinâmico antigo que tenha sido
     * criado antes da função Encarregado.
     */
    return dinamica[0] || null;
  }

  /*
   * MODELO ANTIGO
   */
  return rso?.equipeFixa?.chefe || null;
};

/* =========================================================
   TEMPO REAL DA OPERAÇÃO
========================================================= */

const somarTotalMinutos = (rso) => {
  if (
    rso.totalMinutos &&
    rso.totalMinutos > 0
  ) {
    return rso.totalMinutos;
  }

  const datas = [];

  getTodosIntegrantes(rso).forEach((p) => {
    if (p?.horaEntrada) {
      datas.push(
        new Date(p.horaEntrada)
      );
    }

    if (p?.horaSaida) {
      datas.push(
        new Date(p.horaSaida)
      );
    }
  });

  if (!datas.length) {
    return 0;
  }

  const menor = new Date(
    Math.min(
      ...datas.map((d) =>
        d.getTime()
      )
    )
  );

  const maior = new Date(
    Math.max(
      ...datas.map((d) =>
        d.getTime()
      )
    )
  );

  const diff = Math.floor(
    (maior - menor) / 60000
  );

  return diff > 0
    ? diff
    : 0;
};

/* =========================================================
   TEMPO ACUMULADO DE TODOS OS POLICIAIS
========================================================= */

const somarTempoEquipe = (rso) => {
  return getTodosIntegrantes(rso).reduce(
    (total, p) =>
      total +
      Number(
        p?.tempoMinutos || 0
      ),
    0
  );
};

/* =========================================================
   DATETIME LOCAL
========================================================= */

const toDatetimeLocal = (valor) => {
  if (!valor) return "";

  const d = new Date(valor);

  const pad = (n) =>
    String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(
    d.getMonth() + 1
  )}-${pad(
    d.getDate()
  )}T${pad(
    d.getHours()
  )}:${pad(
    d.getMinutes()
  )}`;
};

const toIsoFromDatetimeLocal = (valor) => {
  if (!valor) return null;

  const data = new Date(valor);

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  return data.toISOString();
};

/* =========================================================
   STATUS
========================================================= */

const getBadgeClass = (status) => {
  if (status === "Pendente") {
    return "pendente";
  }

  if (status === "Ativo") {
    return "ativo";
  }

  if (status === "Aprovado") {
    return "aprovado";
  }

  if (status === "Rejeitado") {
    return "rejeitado";
  }

  return "pendente";
};

/* =========================================================
   APREENSÕES
========================================================= */

const getApreensoesTexto = (a) => {
  if (!a) return "-";

  return `${a.tipo || "-"} — ${
    a.quantidade ?? 0
  }`;
};

/* =========================================================
   TOTAL DA EQUIPE
========================================================= */

const getEquipeTotal = (rso) => {
  return getTodosIntegrantes(rso).length;
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function RSOAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rsos, setRsos] =
    useState([]);

  const [selecionado, setSelecionado] =
    useState(null);

  const [busca, setBusca] =
    useState("");

  const [manual, setManual] =
    useState({
      tipoEquipe: "",
      cargo: "",
      index: 0,
      horaEntrada: "",
      horaSaida: ""
    });

  const [
    encerramentoManual,
    setEncerramentoManual
  ] = useState("");

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar = async () => {
    try {
      const res =
        await api.get(
          "/api/admin/rso/pendentes"
        );

      const filtrados =
        Array.isArray(res.data)
          ? res.data.filter(
              (rso) =>
                rso.status ===
                  "Pendente" ||
                rso.status ===
                  "Ativo"
            )
          : [];

      setRsos(filtrados);

      if (selecionado) {
        const atualizado =
          filtrados.find(
            (r) =>
              r._id ===
              selecionado._id
          );

        setSelecionado(
          atualizado || null
        );
      }
    } catch (err) {
      console.error(
        "Erro ao carregar RSOs:",
        err
      );

      setRsos([]);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  /* =======================================================
     APROVAR
  ======================================================= */

  const aprovar = async (id) => {
    try {
      await api.post(
        `/api/admin/rso/aprovar/${id}`
      );

      await carregar();

      if (
        selecionado?._id === id
      ) {
        setSelecionado(null);
      }

      toast.success(
        "RSO aprovado e horas contabilizadas com sucesso."
      );
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
          "Erro ao aprovar RSO"
      );
    }
  };

  /* =======================================================
     REJEITAR
  ======================================================= */

  const rejeitar = async (id) => {
    const comentario =
      prompt(
        "Motivo da rejeição:"
      );

    if (!comentario) return;

    try {
      await api.post(
        `/api/admin/rso/rejeitar/${id}`,
        {
          motivo:
            comentario
        }
      );

      await carregar();

      if (
        selecionado?._id === id
      ) {
        setSelecionado(null);
      }
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
          "Erro ao rejeitar RSO"
      );
    }
  };

  /* =======================================================
     DADOS DA EQUIPE

     NOVO:
     dinamica = equipe[]

     ANTIGO:
     fixa + rotativa
  ======================================================= */

  const dadosEquipe =
    useMemo(() => {
      if (!selecionado) {
        return null;
      }

      const dinamica =
        getEquipeDinamica(
          selecionado
        ).map(
          (p, index) => ({
            ...p,

            key:
              `equipe-${index}`,

            tipoEquipe:
              "equipe",

            cargoOriginal:
              "equipe",

            indexOriginal:
              index
          })
        );

      const fixa = [
        {
          ...selecionado
            .equipeFixa
            ?.chefe,

          tipoEquipe:
            "fixa",

          cargoOriginal:
            "chefe",

          indexOriginal:
            0
        },

        {
          ...selecionado
            .equipeFixa
            ?.auxiliar,

          tipoEquipe:
            "fixa",

          cargoOriginal:
            "auxiliar",

          indexOriginal:
            0
        }
      ].filter(
        (p) =>
          p &&
          p.funcional
      );

      const rotativa =
        Object.entries(
          selecionado
            .equipeRotativa ||
            {}
        ).flatMap(
          ([cargo, lista]) =>
            Array.isArray(lista)
              ? lista.map(
                  (
                    p,
                    index
                  ) => ({
                    ...p,

                    cargoLista:
                      cargo,

                    key:
                      `${cargo}-${index}`,

                    tipoEquipe:
                      "rotativa",

                    cargoOriginal:
                      cargo,

                    indexOriginal:
                      index
                  })
                )
              : []
        );

      return {
        dinamica,
        fixa,
        rotativa
      };
    }, [selecionado]);

  /* =======================================================
     OPÇÕES DE EDIÇÃO MANUAL
  ======================================================= */

  const opcoesManual =
    useMemo(() => {
      if (!dadosEquipe) {
        return [];
      }

      return [
        /* NOVA EQUIPE */
        ...dadosEquipe.dinamica.map(
          (p) => ({
            label:
              `${p.cargo || "Operador"} — ${p.nome} (${p.funcional})`,

            tipoEquipe:
              "equipe",

            cargo:
              "equipe",

            index:
              p.indexOriginal,

            horaEntrada:
              p.horaEntrada,

            horaSaida:
              p.horaSaida
          })
        ),

        /* EQUIPE FIXA ANTIGA */
        ...dadosEquipe.fixa.map(
          (p) => ({
            label:
              `${p.cargo} — ${p.nome} (${p.funcional})`,

            tipoEquipe:
              "fixa",

            cargo:
              p.cargoOriginal,

            index:
              0,

            horaEntrada:
              p.horaEntrada,

            horaSaida:
              p.horaSaida
          })
        ),

        /* EQUIPE ROTATIVA ANTIGA */
        ...dadosEquipe.rotativa.map(
          (p) => ({
            label:
              `${p.cargo || p.cargoLista} — ${p.nome} (${p.funcional})`,

            tipoEquipe:
              "rotativa",

            cargo:
              p.cargoOriginal,

            index:
              p.indexOriginal,

            horaEntrada:
              p.horaEntrada,

            horaSaida:
              p.horaSaida
          })
        )
      ];
    }, [dadosEquipe]);

  /* =======================================================
     SELECIONAR MEMBRO PARA EDIÇÃO
  ======================================================= */

  const selecionarMembroManual =
    (chave) => {
      const [
        tipoEquipe,
        cargo,
        index
      ] = chave.split("|");

      const item =
        opcoesManual.find(
          (o) =>
            o.tipoEquipe ===
              tipoEquipe &&
            o.cargo ===
              cargo &&
            String(o.index) ===
              String(index)
        );

      if (!item) return;

      setManual({
        tipoEquipe,

        cargo,

        index:
          Number(index),

        horaEntrada:
          toDatetimeLocal(
            item.horaEntrada
          ),

        horaSaida:
          toDatetimeLocal(
            item.horaSaida
          )
      });
    };

  /* =======================================================
     SALVAR HORÁRIO MANUAL
  ======================================================= */

  const salvarHorarioManual =
    async () => {
      if (!selecionado) {
        return;
      }

      try {
        await api.put(
          `/api/admin/rso/${selecionado._id}/editar-horario-manual`,
          {
            tipoEquipe:
              manual.tipoEquipe,

            cargo:
              manual.cargo,

            index:
              manual.index,

            horaEntrada:
              toIsoFromDatetimeLocal(
                manual.horaEntrada
              ),

            horaSaida:
              toIsoFromDatetimeLocal(
                manual.horaSaida
              )
          }
        );

        toast.warning(
          "Horário atualizado manualmente"
        );

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
            "Erro ao atualizar horário manual"
        );
      }
    };

  /* =======================================================
     ENCERRAMENTO MANUAL
  ======================================================= */

  const encerrarManual =
    async () => {
      if (!selecionado) {
        return;
      }

      const confirmar =
        await confirm({ tone: "danger", message: "Encerrar este RSO manualmente pelo ADM?" });

      if (!confirmar) {
        return;
      }

      try {
        await api.put(
          `/api/admin/rso/${selecionado._id}/encerrar-manual`,
          {
            dataEncerramento:
              encerramentoManual
                ? toIsoFromDatetimeLocal(
                    encerramentoManual
                  )
                : new Date()
                    .toISOString()
          }
        );

        toast.warning(
          "RSO encerrado manualmente"
        );

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
            "Erro ao encerrar manualmente"
        );
      }
    };

  /* =======================================================
     BUSCA
  ======================================================= */

  const rsosFiltrados =
    useMemo(() => {
      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return rsos;
      }

      return rsos.filter(
        (rso) => {
          const viatura =
            String(
              rso.viatura || ""
            ).toLowerCase();

          const status =
            String(
              rso.status || ""
            ).toLowerCase();

          const tipo =
            String(
              rso.tipoPatrulhamento ||
                "VIATURA"
            ).toLowerCase();

          const equipeTexto =
            getTodosIntegrantes(
              rso
            )
              .map(
                (p) =>
                  `${
                    p?.patente || ""
                  } ${
                    p?.nome || ""
                  } ${
                    p?.funcional || ""
                  } ${
                    p?.cargo || ""
                  }`
              )
              .join(" ")
              .toLowerCase();

          return (
            viatura.includes(
              termo
            ) ||
            status.includes(
              termo
            ) ||
            tipo.includes(
              termo
            ) ||
            equipeTexto.includes(
              termo
            )
          );
        }
      );
    }, [rsos, busca]);

  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo =
    useMemo(() => {
      const total =
        rsos.length;

      const pendentes =
        rsos.filter(
          (r) =>
            r.status ===
            "Pendente"
        ).length;

      const ativos =
        rsos.filter(
          (r) =>
            r.status ===
            "Ativo"
        ).length;

      const horasOperacionais =
        rsos.reduce(
          (acc, rso) =>
            acc +
            somarTotalMinutos(
              rso
            ),
          0
        );

      return {
        total,
        pendentes,
        ativos,
        horasOperacionais
      };
    }, [rsos]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="rso-admin-page">

      {/* ===================================================
          TOPO
      =================================================== */}

      <div className="rso-admin-topbar">
        <div>
          <h1>
            RSO • Painel Administrativo
          </h1>

          <p>
            Central de validação, acompanhamento e ajuste manual de registros operacionais.
          </p>
        </div>

        <button
          className="rso-admin-btn"
          type="button"
          onClick={carregar}
        >
          Recarregar dados
        </button>
      </div>

      {/* ===================================================
          RESUMO
      =================================================== */}

      <section className="rso-admin-summary-grid">

        <div className="rso-admin-summary-card">
          <small>
            Total monitorado
          </small>

          <strong>
            {resumo.total}
          </strong>
        </div>

        <div className="rso-admin-summary-card">
          <small>
            Pendentes
          </small>

          <strong>
            {resumo.pendentes}
          </strong>
        </div>

        <div className="rso-admin-summary-card">
          <small>
            Ativos
          </small>

          <strong>
            {resumo.ativos}
          </strong>
        </div>

        <div className="rso-admin-summary-card">
          <small>
            Tempo operacional
          </small>

          <strong>
            {formatarTempo(
              resumo.horasOperacionais
            )}
          </strong>
        </div>

      </section>

      {/* ===================================================
          TABELA
      =================================================== */}

      <section className="rso-admin-section">

        <div className="rso-admin-section-title">
          <div>
            <h3>
              RSOs pendentes e ativos
            </h3>

            <span>
              Validação, leitura operacional e gestão administrativa.
            </span>
          </div>

          <input
            className="rso-admin-search"
            style={{
              maxWidth: 320
            }}
            placeholder="Buscar por viatura, tipo, status ou integrante"
            value={busca}
            onChange={(e) =>
              setBusca(
                e.target.value
              )
            }
          />
        </div>

        <div className="rso-admin-table-wrap">

          <table className="rso-admin-table">

            <thead>
              <tr>
                <th>
                  Tipo
                </th>

                <th>
                  Viatura
                </th>

                <th>
                  Status
                </th>

                <th>
                  Criado em
                </th>

                <th>
                  Encarregado
                </th>

                <th>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>

              {rsosFiltrados.map(
                (rso) => (
                  <tr
                    key={
                      rso._id
                    }
                    className={
                      selecionado?._id ===
                      rso._id
                        ? "rso-admin-row-active"
                        : ""
                    }
                  >

                    <td>
                      {rso.tipoPatrulhamento ||
                        "VIATURA"}
                    </td>

                    <td>
                      {rso.viatura ||
                        "-"}
                    </td>

                    <td>
                      <span
                        className={`rso-admin-badge ${getBadgeClass(
                          rso.status
                        )}`}
                      >
                        {
                          rso.status
                        }
                      </span>
                    </td>

                    <td>
                      {formatarDataHora(
                        rso.createdAt
                      )}
                    </td>

                    <td>
                      {formatarPessoa(
                        getEncarregadoRSO(
                          rso
                        )
                      )}
                    </td>

                    <td>
                      <div className="rso-admin-actions">

                        <button
                          className="rso-admin-btn blue"
                          type="button"
                          onClick={() =>
                            setSelecionado(
                              rso
                            )
                          }
                        >
                          Ver
                        </button>

                        {rso.status ===
                          "Pendente" && (
                          <button
                            className="rso-admin-btn"
                            type="button"
                            onClick={() =>
                              aprovar(
                                rso._id
                              )
                            }
                          >
                            Aprovar
                          </button>
                        )}

                        <button
                          className="rso-admin-btn danger"
                          type="button"
                          onClick={() =>
                            rejeitar(
                              rso._id
                            )
                          }
                        >
                          Rejeitar
                        </button>

                      </div>
                    </td>

                  </tr>
                )
              )}

              {rsosFiltrados.length ===
                0 && (
                <tr>
                  <td
                    colSpan="6"
                  >
                    <div className="rso-admin-empty">
                      Nenhum RSO pendente ou ativo.
                    </div>
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ===================================================
          DETALHES
      =================================================== */}

      {selecionado && (
        <section className="rso-admin-section">

          <div className="rso-admin-detail">

            {/* ===============================================
                HERO
            =============================================== */}

            <div className="rso-admin-hero">

              <div className="rso-admin-hero-top">

                <div className="rso-admin-hero-title">
                  <small>
                    RSO em análise
                  </small>

                  <h3>
                    {
                      selecionado.viatura
                    }
                  </h3>
                </div>

                <span
                  className={`rso-admin-badge ${getBadgeClass(
                    selecionado.status
                  )}`}
                >
                  {
                    selecionado.status
                  }
                </span>

              </div>

              <div className="rso-admin-hero-grid">

                <div className="rso-admin-box">
                  <small>
                    Criado em
                  </small>

                  <strong>
                    {formatarDataHora(
                      selecionado.createdAt
                    )}
                  </strong>
                </div>

                <div className="rso-admin-box">
                  <small>
                    Tipo
                  </small>

                  <strong>
                    {selecionado.tipoPatrulhamento ||
                      "VIATURA"}
                  </strong>
                </div>

                <div className="rso-admin-box">
                  <small>
                    Encarregado
                  </small>

                  <strong>
                    {formatarPessoa(
                      getEncarregadoRSO(
                        selecionado
                      )
                    )}
                  </strong>
                </div>

                <div className="rso-admin-box">
                  <small>
                    Tempo da operação
                  </small>

                  <strong>
                    {formatarTempo(
                      somarTotalMinutos(
                        selecionado
                      )
                    )}
                  </strong>
                </div>

                <div className="rso-admin-box">
                  <small>
                    Tempo acumulado da equipe
                  </small>

                  <strong>
                    {formatarTempo(
                      somarTempoEquipe(
                        selecionado
                      )
                    )}
                  </strong>
                </div>

                <div className="rso-admin-box">
                  <small>
                    Total da equipe
                  </small>

                  <strong>
                    {getEquipeTotal(
                      selecionado
                    )}{" "}
                    integrante(s)
                  </strong>
                </div>

                <div className="rso-admin-box">
                  <small>
                    Apreensões
                  </small>

                  <strong>
                    {Array.isArray(
                      selecionado.apreensoes
                    )
                      ? selecionado
                          .apreensoes
                          .length
                      : 0}
                  </strong>
                </div>

              </div>

            </div>

            {/* ===============================================
                ENCERRAMENTO MANUAL
            =============================================== */}

            {selecionado.encerradoManualmentePorADM && (
              <div className="rso-admin-alert info">

                <strong>
                  Encerramento manual do ADM
                </strong>

                <p>
                  Encerrado por{" "}
                  {selecionado.nomeADMEncerramento ||
                    "-"}{" "}
                  em{" "}
                  {formatarDataHora(
                    selecionado.dataEncerramentoADM
                  )}
                </p>

              </div>
            )}

            {/* ===============================================
                GRID PRINCIPAL
            =============================================== */}

            <div className="rso-admin-grid-main">

              {/* =============================================
                  COLUNA ESQUERDA
              ============================================= */}

              <div className="rso-admin-stack">

                {/* OBSERVAÇÕES */}

                <section className="rso-admin-block">

                  <div className="rso-admin-block-title">
                    <h4>
                      Observações
                    </h4>

                    <span>
                      Registro do usuário
                    </span>
                  </div>

                  <div className="rso-admin-readonly">
                    {selecionado.observacoes ||
                      "-"}
                  </div>

                </section>

                {/* COMENTÁRIO ADM */}

                <section className="rso-admin-block">

                  <div className="rso-admin-block-title">
                    <h4>
                      Comentário ADM
                    </h4>

                    <span>
                      Retorno administrativo
                    </span>
                  </div>

                  <div className="rso-admin-readonly">
                    {selecionado.comentarioADM ||
                      "-"}
                  </div>

                </section>

                {/* ===========================================
                    NOVA EQUIPE DINÂMICA
                =========================================== */}

                {dadosEquipe?.dinamica?.length >
                0 ? (
                  <section className="rso-admin-block">

                    <div className="rso-admin-block-title">

                      <h4>
                        {selecionado.tipoPatrulhamento ===
                        "ROCAM"
                          ? "Equipe ROCAM"
                          : "Equipe operacional"}
                      </h4>

                      <span>
                        {
                          dadosEquipe
                            .dinamica
                            .length
                        }{" "}
                        integrante(s)
                      </span>

                    </div>

                    <div className="rso-admin-team-grid">

                      {dadosEquipe.dinamica.map(
                        (p) => (
                          <div
                            key={
                              p.key
                            }
                            className={`rso-admin-person-card ${
                              p.cargo ===
                              "Encarregado"
                                ? "fixa"
                                : ""
                            }`}
                          >

                            <strong>
                              {p.cargo ||
                                "Operador"}
                            </strong>

                            <div>
                              {formatarPessoa(
                                p
                              )}
                            </div>

                            <small>
                              Status:{" "}
                              {p.status ||
                                "-"}
                            </small>

                            <small>
                              Entrada:{" "}
                              {formatarDataHora(
                                p.horaEntrada
                              )}
                            </small>

                            <small>
                              Saída:{" "}
                              {formatarDataHora(
                                p.horaSaida
                              )}
                            </small>

                            <div className="tempo">
                              Tempo:{" "}
                              {formatarTempo(
                                p.tempoMinutos
                              )}
                            </div>

                          </div>
                        )
                      )}

                    </div>

                  </section>
                ) : (
                  <>
                    {/* =========================================
                        EQUIPE FIXA ANTIGA
                    ========================================= */}

                    <section className="rso-admin-block">

                      <div className="rso-admin-block-title">

                        <h4>
                          Equipe fixa
                        </h4>

                        <span>
                          {dadosEquipe?.fixa
                            ?.length ||
                            0}{" "}
                          integrante(s)
                        </span>

                      </div>

                      {dadosEquipe?.fixa
                        ?.length ? (
                        <div className="rso-admin-team-grid">

                          {dadosEquipe.fixa.map(
                            (
                              p,
                              index
                            ) => (
                              <div
                                key={
                                  index
                                }
                                className="rso-admin-person-card fixa"
                              >

                                <strong>
                                  {p.cargo ||
                                    "-"}
                                </strong>

                                <div>
                                  {formatarPessoa(
                                    p
                                  )}
                                </div>

                                <small>
                                  Entrada:{" "}
                                  {formatarDataHora(
                                    p.horaEntrada
                                  )}
                                </small>

                                <small>
                                  Saída:{" "}
                                  {formatarDataHora(
                                    p.horaSaida
                                  )}
                                </small>

                                <div className="tempo">
                                  Tempo:{" "}
                                  {formatarTempo(
                                    p.tempoMinutos
                                  )}
                                </div>

                              </div>
                            )
                          )}

                        </div>
                      ) : (
                        <div className="rso-admin-empty">
                          Sem equipe fixa registrada.
                        </div>
                      )}

                    </section>

                    {/* =========================================
                        EQUIPE ROTATIVA ANTIGA
                    ========================================= */}

                    <section className="rso-admin-block">

                      <div className="rso-admin-block-title">

                        <h4>
                          Equipe rotativa
                        </h4>

                        <span>
                          {dadosEquipe
                            ?.rotativa
                            ?.length ||
                            0}{" "}
                          integrante(s)
                        </span>

                      </div>

                      {dadosEquipe
                        ?.rotativa
                        ?.length ? (
                        <div className="rso-admin-team-grid">

                          {dadosEquipe.rotativa.map(
                            (p) => (
                              <div
                                key={
                                  p.key
                                }
                                className="rso-admin-person-card"
                              >

                                <strong>
                                  {p.cargo ||
                                    p.cargoLista ||
                                    "-"}
                                </strong>

                                <div>
                                  {formatarPessoa(
                                    p
                                  )}
                                </div>

                                <small>
                                  Entrada:{" "}
                                  {formatarDataHora(
                                    p.horaEntrada
                                  )}
                                </small>

                                <small>
                                  Saída:{" "}
                                  {formatarDataHora(
                                    p.horaSaida
                                  )}
                                </small>

                                <div className="tempo">
                                  Tempo:{" "}
                                  {formatarTempo(
                                    p.tempoMinutos
                                  )}
                                </div>

                              </div>
                            )
                          )}

                        </div>
                      ) : (
                        <div className="rso-admin-empty">
                          Sem equipe rotativa registrada.
                        </div>
                      )}

                    </section>
                  </>
                )}

              </div>

              {/* =============================================
                  COLUNA DIREITA
              ============================================= */}

              <div className="rso-admin-stack">

                {/* APREENSÕES */}

                <section className="rso-admin-block">

                  <div className="rso-admin-block-title">

                    <h4>
                      Apreensões
                    </h4>

                    <span>
                      {Array.isArray(
                        selecionado.apreensoes
                      )
                        ? selecionado
                            .apreensoes
                            .length
                        : 0}{" "}
                      item(ns)
                    </span>

                  </div>

                  {Array.isArray(
                    selecionado.apreensoes
                  ) &&
                  selecionado.apreensoes
                    .length > 0 ? (
                    <div className="rso-admin-capture-list">

                      {selecionado.apreensoes.map(
                        (a, i) => (
                          <div
                            key={i}
                            className="rso-admin-capture-card"
                          >
                            {getApreensoesTexto(
                              a
                            )}
                          </div>
                        )
                      )}

                    </div>
                  ) : (
                    <div className="rso-admin-empty">
                      Nenhuma apreensão registrada.
                    </div>
                  )}

                </section>

                {/* ===========================================
                    EDIÇÃO MANUAL
                =========================================== */}

                <section className="rso-admin-block">

                  <div className="rso-admin-block-title">

                    <h4>
                      Edição manual do ADM
                    </h4>

                    <span>
                      Ajuste fino operacional
                    </span>

                  </div>

                  {selecionado.status ===
                  "Ativo" ? (
                    <>

                      <div className="rso-admin-inline-grid">

                        <select
                          className="rso-admin-select"
                          onChange={(e) =>
                            selecionarMembroManual(
                              e.target
                                .value
                            )
                          }
                          defaultValue=""
                        >

                          <option value="">
                            Selecione o integrante
                          </option>

                          {opcoesManual.map(
                            (
                              item,
                              index
                            ) => (
                              <option
                                key={
                                  index
                                }
                                value={`${item.tipoEquipe}|${item.cargo}|${item.index}`}
                              >
                                {
                                  item.label
                                }
                              </option>
                            )
                          )}

                        </select>

                        <input
                          className="rso-admin-input"
                          type="datetime-local"
                          value={
                            manual.horaEntrada
                          }
                          onChange={(e) =>
                            setManual(
                              (
                                prev
                              ) => ({
                                ...prev,

                                horaEntrada:
                                  e
                                    .target
                                    .value
                              })
                            )
                          }
                        />

                        <input
                          className="rso-admin-input"
                          type="datetime-local"
                          value={
                            manual.horaSaida
                          }
                          onChange={(e) =>
                            setManual(
                              (
                                prev
                              ) => ({
                                ...prev,

                                horaSaida:
                                  e
                                    .target
                                    .value
                              })
                            )
                          }
                        />

                        <button
                          className="rso-admin-btn"
                          type="button"
                          onClick={
                            salvarHorarioManual
                          }
                        >
                          Salvar
                        </button>

                      </div>

                      <div
                        className="rso-admin-inline-grid-2"
                        style={{
                          marginTop: 12
                        }}
                      >

                        <input
                          className="rso-admin-input"
                          type="datetime-local"
                          value={
                            encerramentoManual
                          }
                          onChange={(e) =>
                            setEncerramentoManual(
                              e.target
                                .value
                            )
                          }
                        />

                        <button
                          className="rso-admin-btn blue"
                          type="button"
                          onClick={
                            encerrarManual
                          }
                        >
                          Encerrar manualmente
                        </button>

                      </div>

                    </>
                  ) : (
                    <div className="rso-admin-empty">
                      Edição manual disponível apenas para RSO ativo.
                    </div>
                  )}

                </section>

                {/* ===========================================
                    AÇÕES ADMINISTRATIVAS
                =========================================== */}

                <section className="rso-admin-decision-box">

                  <div className="rso-admin-block-title">

                    <h4>
                      Ações administrativas
                    </h4>

                    <span>
                      Validação final
                    </span>

                  </div>

                  <div className="rso-admin-actions">

                    {selecionado.status ===
                      "Pendente" && (
                      <button
                        className="rso-admin-btn"
                        type="button"
                        onClick={() =>
                          aprovar(
                            selecionado._id
                          )
                        }
                      >
                        Aprovar RSO
                      </button>
                    )}

                    <button
                      className="rso-admin-btn danger"
                      type="button"
                      onClick={() =>
                        rejeitar(
                          selecionado._id
                        )
                      }
                    >
                      Rejeitar RSO
                    </button>

                    <button
                      className="rso-admin-btn blue"
                      type="button"
                      onClick={() =>
                        setSelecionado(
                          null
                        )
                      }
                    >
                      Fechar painel
                    </button>

                  </div>

                </section>

              </div>

            </div>

          </div>

        </section>
      )}

    </div>
  );
}