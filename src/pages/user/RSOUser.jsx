import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "./rso-user.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
/* =========================================================
   UTILITÁRIOS
========================================================= */

const formatarMinutos = (min) => {
  if (!min || min <= 0) return "-";

  const h = Math.floor(min / 60);
  const m = min % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;

  return `${h}h ${m}min`;
};

const formatarHora = (data) => {
  if (!data) return "-";

  return new Date(data).toLocaleTimeString(
    "pt-BR"
  );
};

const formatarDataHora = (data) => {
  if (!data) return "-";

  return new Date(data).toLocaleString(
    "pt-BR"
  );
};

const formatarValorBRL = (valor) => {
  const numero = Number(valor || 0);

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
};

const formatarApreensao = (a) => {
  if (!a) return "-";

  const quantidade = Number(
    a.quantidade || 0
  );

  if (a.tipo === "Valores") {
    return `${a.tipo} — ${formatarValorBRL(
      quantidade
    )}`;
  }

  if (a.tipo === "Entorpecentes") {
    return `${a.tipo} — ${quantidade.toLocaleString(
      "pt-BR"
    )} Kg`;
  }

  return `${a.tipo} — ${quantidade.toLocaleString(
    "pt-BR"
  )} unidade${
    quantidade !== 1 ? "s" : ""
  }`;
};

const labelQuantidadePorTipo = (tipo) => {
  if (tipo === "Valores") {
    return "Valor em R$";
  }

  if (tipo === "Entorpecentes") {
    return "Quantidade em Kg";
  }

  return "Quantidade em unidade";
};

/* =========================================================
   ORDEM DAS PATENTES
========================================================= */

const ordemPatentes = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante-a-Oficial PM": 7,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

const ordenarPorPatente = (lista) => {
  return [...lista].sort((a, b) => {
    const ordemA =
      ordemPatentes[a.patente] || 999;

    const ordemB =
      ordemPatentes[b.patente] || 999;

    if (ordemA !== ordemB) {
      return ordemA - ordemB;
    }

    return String(a.nome || "").localeCompare(
      String(b.nome || ""),
      "pt-BR"
    );
  });
};

/* =========================================================
   VIATURAS
========================================================= */

const VIATURAS_ANCHIETA = [
  "COMANDO ANCHIETA - 92000",
  "SUBCOMANDO ANCHIETA - 92001",
  "COORDENADOR ANCHIETA - 92002",
  "ANCHIETA COMANDO DOIS - 92200",
  "ANCHIETA 224 - 92224",
  "ANCHIETA 223 - 92223",
  "ANCHIETA 222 - 92222",
  "ANCHIETA 216 - 92216"
];

const VIATURAS_ROCAM = [
  "ROCAM COMANDO QUATRO - 92404",
  "ROCAM 416 - 92416 (APOIO 4 RODAS)",
  "ROCAM 321 - 9232"
];

/* =========================================================
   HELPERS ROCAM
========================================================= */

const labelRocam = (valor) => {
  if (valor === "BRACAL_ROCAM") {
    return "Braçal ROCAM";
  }

  if (valor === "ESTAGIARIO_ROCAM") {
    return "Estagiário ROCAM";
  }

  return "";
};

/* =========================================================
   STATUS
========================================================= */

const getStatusClass = (status) => {
  if (status === "Ativo") {
    return "ativo";
  }

  if (status === "Rejeitado") {
    return "rejeitado";
  }

  if (status === "Aprovado") {
    return "aprovado";
  }

  return "pendente";
};

/* =========================================================
   TODOS OS INTEGRANTES

   Compatibilidade:
   - equipe[] nova
   - equipeFixa antiga
   - equipeRotativa antiga
========================================================= */

const getIntegrantesRSO = (rso) => {
  const integrantes = [];

  if (
    Array.isArray(rso?.equipe) &&
    rso.equipe.length > 0
  ) {
    rso.equipe.forEach((p, index) => {
      integrantes.push({
        ...p,
        _origem: "equipe",
        _index: index
      });
    });
  }

  if (rso?.equipeFixa?.chefe) {
    integrantes.push({
      ...rso.equipeFixa.chefe,
      _origem: "chefe",
      _index: 0
    });
  }

  if (rso?.equipeFixa?.auxiliar) {
    integrantes.push({
      ...rso.equipeFixa.auxiliar,
      _origem: "auxiliar",
      _index: 0
    });
  }

  Object.entries(
    rso?.equipeRotativa || {}
  ).forEach(([cargo, lista]) => {
    if (!Array.isArray(lista)) return;

    lista.forEach((p, index) => {
      integrantes.push({
        ...p,
        _origem: cargo,
        _index: index
      });
    });
  });

  return integrantes;
};

const getEquipeTotal = (rso) => {
  return getIntegrantesRSO(rso).length;
};

const getQuantidadeTotalApreensoes = (
  rso
) => {
  if (!Array.isArray(rso.apreensoes)) {
    return 0;
  }

  return rso.apreensoes.length;
};

/* =========================================================
   TEMPO TOTAL DO RSO
========================================================= */

const somarTempoRSO = (rso) => {
  if (
    rso.totalMinutos &&
    rso.totalMinutos > 0
  ) {
    return rso.totalMinutos;
  }

  const datas = [];

  getIntegrantesRSO(rso).forEach((p) => {
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

  const diffMs =
    maior - menor;

  const diffMin =
    Math.floor(diffMs / 60000);

  return diffMin > 0
    ? diffMin
    : 0;
};

/* =========================================================
   TIMELINE
========================================================= */

function montarTimelineServico(rso) {
  const eventos = [];

  if (rso?.createdAt) {
    eventos.push({
      titulo:
        rso.tipoPatrulhamento === "ROCAM"
          ? "RSO ROCAM aberto"
          : "RSO aberto",

      descricao: `Viatura ${rso.viatura}`,

      data: rso.createdAt
    });
  }

  getIntegrantesRSO(rso).forEach((p) => {
    if (p?.horaEntrada) {
      eventos.push({
        titulo: `${
          p.cargo || "Operador"
        } em serviço`,

        descricao: `${p.nome} (${p.funcional})`,

        data: p.horaEntrada
      });
    }

    if (p?.horaSaida) {
      eventos.push({
        titulo: `${
          p.cargo || "Operador"
        } encerrado`,

        descricao: `${p.nome} (${p.funcional})`,

        data: p.horaSaida
      });
    }
  });

  if (
    rso?.updatedAt &&
    rso?.status !== "Ativo"
  ) {
    eventos.push({
      titulo: `RSO ${String(
        rso.status || ""
      ).toLowerCase()}`,

      descricao:
        `Situação atual: ${rso.status}`,

      data: rso.updatedAt
    });
  }

  return eventos
    .filter((e) => e.data)
    .sort(
      (a, b) =>
        new Date(a.data) -
        new Date(b.data)
    );
}

/* =========================================================
   CONFLITO
========================================================= */

const montarMensagemConflito = (
  policial,
  data
) => {
  if (!data) return "";

  const policialTexto =
    policial
      ? `${policial.patente || ""} ${
          policial.nome || ""
        } (${
          policial.funcional || "-"
        })`.trim()
      : "Policial selecionado";

  const viatura =
    data?.viatura || "-";

  const abriu =
    data?.criadoPor &&
    (
      data.criadoPor.nome ||
      data.criadoPor.funcional
    )
      ? `${
          data.criadoPor.patente
            ? `${data.criadoPor.patente} `
            : ""
        }${
          data.criadoPor.nome ||
          "Não identificado"
        }${
          data.criadoPor.funcional
            ? ` (${data.criadoPor.funcional})`
            : ""
        }`
      : "Não identificado";

  const responsavel =
    data?.responsavel ||
    data?.chefe;

  const responsavelTexto =
    responsavel &&
    (
      responsavel.nome ||
      responsavel.funcional
    )
      ? `${
          responsavel.patente
            ? `${responsavel.patente} `
            : ""
        }${
          responsavel.nome ||
          "Não identificado"
        }${
          responsavel.funcional
            ? ` (${responsavel.funcional})`
            : ""
        }`
      : "Não identificado";

  const abertura =
    data?.createdAt
      ? formatarDataHora(
          data.createdAt
        )
      : "-";

  return (
    `${policialTexto} já está em outro RSO ativo. ` +
    `Viatura: ${viatura}. ` +
    `Aberto por: ${abriu}. ` +
    `Responsável: ${responsavelTexto}. ` +
    `Abertura: ${abertura}.`
  );
};

/* =========================================================
   COMPONENTE
========================================================= */

export default function RSOUser() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rsos, setRsos] =
    useState([]);

  const [hierarquia, setHierarquia] =
    useState([]);

  const [
    hierarquiaRocam,
    setHierarquiaRocam
  ] = useState([]);

  /* =======================================================
     ABERTURA
  ======================================================= */

  const [
    tipoPatrulhamento,
    setTipoPatrulhamento
  ] = useState("VIATURA");

  const [viatura, setViatura] =
    useState("");

  const [
    equipeAbertura,
    setEquipeAbertura
  ] = useState([
    {
      funcional: "",
      cargo: "Encarregado"
    }
  ]);

  const [
    erroAbrirRSO,
    setErroAbrirRSO
  ] = useState("");

  const [
    conflitoAbrirRSO,
    setConflitoAbrirRSO
  ] = useState(null);

  const [
    policialConflitoAbrir,
    setPolicialConflitoAbrir
  ] = useState(null);

  /* =======================================================
     ADICIONAR POLICIAL
     Form independente por RSO
  ======================================================= */

  const [
    adicaoEquipeForm,
    setAdicaoEquipeForm
  ] = useState({});

  const [
    erroAdicionarPolicial,
    setErroAdicionarPolicial
  ] = useState({});

  const [
    conflitoAdicionarPolicial,
    setConflitoAdicionarPolicial
  ] = useState({});

  const [
    policialConflito,
    setPolicialConflito
  ] = useState({});

  /* =======================================================
     OUTROS
  ======================================================= */

  const [
    apreensoesForm,
    setApreensoesForm
  ] = useState({});

  const [
    buscaHierarquia,
    setBuscaHierarquia
  ] = useState("");

  const [
    buscaMeuRso,
    setBuscaMeuRso
  ] = useState("");

  /* =======================================================
     FORM APREENSÃO
  ======================================================= */

  const getApreensaoForm = (id) => {
    return (
      apreensoesForm[id] || {
        tipo: "",
        quantidade: ""
      }
    );
  };

  const atualizarApreensaoForm = (
    id,
    campo,
    valor
  ) => {
    setApreensoesForm((prev) => ({
      ...prev,

      [id]: {
        ...(prev[id] || {
          tipo: "",
          quantidade: ""
        }),

        [campo]: valor
      }
    }));
  };

  /* =======================================================
     FORM DE REFORÇO
  ======================================================= */

  const getAdicaoForm = (
    rso
  ) => {
    const tipo =
      rso?.tipoPatrulhamento ||
      "VIATURA";

    return (
      adicaoEquipeForm[rso._id] || {
        funcional: "",
        cargo:
          tipo === "ROCAM"
            ? "Operador"
            : "Operador"
      }
    );
  };

  const atualizarAdicaoForm = (
    id,
    campo,
    valor
  ) => {
    setAdicaoEquipeForm(
      (prev) => ({
        ...prev,

        [id]: {
          ...(prev[id] || {
            funcional: "",
            cargo: "Operador"
          }),

          [campo]: valor
        }
      })
    );
  };

  /* =======================================================
     CARREGAR
  ======================================================= */

  const carregar = async () => {
    try {
      const [
        rsoRes,
        hierRes,
        rocamRes
      ] = await Promise.all([
        api.get("/api/rso/me"),

        api.get(
          "/api/hierarchy/public"
        ),

        api.get(
          "/api/hierarchy/rocam/list"
        )
      ]);

      const listaRso =
        Array.isArray(rsoRes.data)
          ? rsoRes.data
          : [];

      setRsos(listaRso);

      const listaGeral =
        Object.values(
          hierRes.data || {}
        )
          .flatMap(
            (c) =>
              c.membros || []
          )
          .filter(
            (p) =>
              p.status === "Ativo"
          );

      setHierarquia(
        ordenarPorPatente(
          listaGeral
        )
      );

      const listaRocam =
        Array.isArray(
          rocamRes.data
        )
          ? rocamRes.data
          : [];

      setHierarquiaRocam(
        ordenarPorPatente(
          listaRocam
        )
      );
    } catch (err) {
      console.error(
        "Erro ao carregar RSO:",
        err
      );

      setRsos([]);
      setHierarquia([]);
      setHierarquiaRocam([]);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  /* =======================================================
     QUANDO TROCAR VIATURA / ROCAM
  ======================================================= */

  const trocarTipoPatrulhamento = (
    novoTipo
  ) => {
    setTipoPatrulhamento(
      novoTipo
    );

    setViatura("");

    setBuscaHierarquia("");

    setErroAbrirRSO("");

    setConflitoAbrirRSO(null);

    setPolicialConflitoAbrir(
      null
    );

    if (
      novoTipo === "ROCAM"
    ) {
      setEquipeAbertura([
        {
          funcional: "",
          cargo: "Encarregado"
        },
        {
          funcional: "",
          cargo: "Operador"
        }
      ]);
    } else {
      setEquipeAbertura([
        {
          funcional: "",
          cargo: "Encarregado"
        }
      ]);
    }
  };

  /* =======================================================
     LISTA DISPONÍVEL PARA ABERTURA
  ======================================================= */

  const listaPoliciaisAbertura =
    tipoPatrulhamento === "ROCAM"
      ? hierarquiaRocam
      : hierarquia;

  const hierarquiaFiltrada =
    useMemo(() => {
      const termo =
        buscaHierarquia
          .trim()
          .toLowerCase();

      if (!termo) {
        return listaPoliciaisAbertura;
      }

      return listaPoliciaisAbertura.filter(
        (p) => {
          const nome =
            String(
              p.nome || ""
            ).toLowerCase();

          const patente =
            String(
              p.patente || ""
            ).toLowerCase();

          const funcional =
            String(
              p.funcional || ""
            ).toLowerCase();

          return (
            nome.includes(
              termo
            ) ||
            patente.includes(
              termo
            ) ||
            funcional.includes(
              termo
            )
          );
        }
      );
    }, [
      listaPoliciaisAbertura,
      buscaHierarquia
    ]);

  /* =======================================================
     RSOs FILTRADOS
  ======================================================= */

  const rsosFiltrados =
    useMemo(() => {
      const termo =
        buscaMeuRso
          .trim()
          .toLowerCase();

      if (!termo) {
        return rsos;
      }

      return rsos.filter(
        (rso) => {
          const viaturaTexto =
            String(
              rso.viatura || ""
            ).toLowerCase();

          const statusTexto =
            String(
              rso.status || ""
            ).toLowerCase();

          const tipoTexto =
            String(
              rso.tipoPatrulhamento ||
              "VIATURA"
            ).toLowerCase();

          const observacoesTexto =
            String(
              rso.observacoes || ""
            ).toLowerCase();

          return (
            viaturaTexto.includes(
              termo
            ) ||
            statusTexto.includes(
              termo
            ) ||
            tipoTexto.includes(
              termo
            ) ||
            observacoesTexto.includes(
              termo
            )
          );
        }
      );
    }, [
      rsos,
      buscaMeuRso
    ]);

  /* =======================================================
     RESUMO
  ======================================================= */

  const resumo = useMemo(() => {
    const total =
      rsos.length;

    const ativos =
      rsos.filter(
        (r) =>
          r.status === "Ativo"
      ).length;

    const aprovados =
      rsos.filter(
        (r) =>
          r.status === "Aprovado"
      ).length;

    const rejeitados =
      rsos.filter(
        (r) =>
          r.status === "Rejeitado"
      ).length;

    const rocam =
      rsos.filter(
        (r) =>
          r.tipoPatrulhamento ===
          "ROCAM"
      ).length;

    const totalMinutos =
      rsos.reduce(
        (acc, rso) =>
          acc +
          somarTempoRSO(rso),
        0
      );

    const totalApreensoes =
      rsos.reduce(
        (acc, rso) =>
          acc +
          getQuantidadeTotalApreensoes(
            rso
          ),
        0
      );

    return {
      total,
      ativos,
      aprovados,
      rejeitados,
      rocam,
      totalMinutos,
      totalApreensoes
    };
  }, [rsos]);

  /* =======================================================
     ALTERAR INTEGRANTE NA ABERTURA
  ======================================================= */

  const atualizarEquipeAbertura = (
    index,
    campo,
    valor
  ) => {
    setEquipeAbertura(
      (prev) =>
        prev.map(
          (item, i) =>
            i === index
              ? {
                  ...item,
                  [campo]:
                    valor
                }
              : item
        )
    );
  };

  const adicionarLinhaEquipe = () => {
    setEquipeAbertura(
      (prev) => [
        ...prev,

        {
          funcional: "",
          cargo: "Operador"
        }
      ]
    );
  };

  const removerLinhaEquipe = (
    index
  ) => {
    setEquipeAbertura(
      (prev) => {
        const novaEquipe =
          prev.filter(
            (_, i) =>
              i !== index
          );

        if (
          tipoPatrulhamento ===
            "ROCAM" &&
          novaEquipe.length > 0
        ) {
          return novaEquipe.map(
            (item, i) => ({
              ...item,
              cargo:
                i === 0
                  ? "Encarregado"
                  : "Operador"
            })
          );
        }

        return novaEquipe;
      }
    );
  };

  /* =======================================================
     ABRIR RSO
  ======================================================= */

  const abrirRSO = async () => {
    setErroAbrirRSO("");
    setConflitoAbrirRSO(null);
    setPolicialConflitoAbrir(
      null
    );

    if (!viatura) {
      setErroAbrirRSO(
        "Selecione a viatura."
      );

      return;
    }

    const equipeValida =
      equipeAbertura.filter(
        (item) =>
          item.funcional
      );

    if (
      tipoPatrulhamento ===
        "VIATURA" &&
      equipeValida.length < 1
    ) {
      setErroAbrirRSO(
        "Adicione pelo menos um integrante à equipe."
      );

      return;
    }

    if (
      tipoPatrulhamento ===
        "ROCAM" &&
      equipeValida.length < 2
    ) {
      setErroAbrirRSO(
        "A ROCAM deve ser aberta com no mínimo 2 integrantes."
      );

      return;
    }

    if (
      tipoPatrulhamento ===
      "ROCAM"
    ) {
      const totalEncarregados =
        equipeValida.filter(
          (item) =>
            item.cargo ===
            "Encarregado"
        ).length;

      if (
        totalEncarregados !== 1
      ) {
        setErroAbrirRSO(
          "A equipe ROCAM deve possuir exatamente 1 Encarregado."
        );

        return;
      }
    }

    const funcionais =
      equipeValida.map(
        (item) =>
          Number(
            item.funcional
          )
      );

    if (
      new Set(
        funcionais
      ).size !==
      funcionais.length
    ) {
      setErroAbrirRSO(
        "O mesmo policial não pode ser adicionado duas vezes na equipe."
      );

      return;
    }

    try {
      const payload = {
        tipoPatrulhamento,

        viatura,

        equipe:
          equipeValida.map(
            (item) => ({
              funcional:
                Number(
                  item.funcional
                ),

              cargo:
                item.cargo
            })
          )
      };

      await api.post(
        "/api/rso",
        payload
      );

      setViatura("");

      if (
        tipoPatrulhamento ===
        "ROCAM"
      ) {
        setEquipeAbertura([
          {
            funcional: "",
            cargo: "Encarregado"
          },
          {
            funcional: "",
            cargo: "Operador"
          }
        ]);
      } else {
        setEquipeAbertura([
          {
            funcional: "",
            cargo:
              "Encarregado"
          }
        ]);
      }

      setErroAbrirRSO("");

      setConflitoAbrirRSO(
        null
      );

      setPolicialConflitoAbrir(
        null
      );

      await carregar();
    } catch (err) {
      console.error(
        "Erro ao abrir RSO:",
        err
      );

      const data =
        err?.response?.data ||
        {};

      setErroAbrirRSO(
        data.message ||
        "Erro ao abrir RSO"
      );

      setConflitoAbrirRSO(
        data.rsoConflitante ||
        null
      );

      setPolicialConflitoAbrir(
        data.policialConflitante ||
        null
      );
    }
  };

  /* =======================================================
     ADICIONAR POLICIAL AO RSO
  ======================================================= */

  const adicionarPolicial = async (
    rso
  ) => {
    const form =
      getAdicaoForm(rso);

    if (!form.funcional) {
      return;
    }

    const lista =
      rso.tipoPatrulhamento ===
      "ROCAM"
        ? hierarquiaRocam
        : hierarquia;

    const policialSelecionado =
      lista.find(
        (p) =>
          Number(
            p.funcional
          ) ===
          Number(
            form.funcional
          )
      ) || null;

    try {
      setErroAdicionarPolicial(
        (prev) => ({
          ...prev,
          [rso._id]: ""
        })
      );

      setConflitoAdicionarPolicial(
        (prev) => ({
          ...prev,
          [rso._id]: null
        })
      );

      setPolicialConflito(
        (prev) => ({
          ...prev,
          [rso._id]: null
        })
      );

      await api.post(
        `/api/rso/${rso._id}/adicionar-policial`,
        {
          funcional:
            Number(
              form.funcional
            ),

          cargo:
            form.cargo
        }
      );

      setAdicaoEquipeForm(
        (prev) => ({
          ...prev,

          [rso._id]: {
            funcional: "",
            cargo: "Operador"
          }
        })
      );

      await carregar();
    } catch (err) {
      const data =
        err?.response?.data ||
        {};

      const conflito =
        data.rsoConflitante ||
        null;

      setConflitoAdicionarPolicial(
        (prev) => ({
          ...prev,
          [rso._id]:
            conflito
        })
      );

      setPolicialConflito(
        (prev) => ({
          ...prev,
          [rso._id]:
            policialSelecionado
        })
      );

      setErroAdicionarPolicial(
        (prev) => ({
          ...prev,

          [rso._id]:
            conflito
              ? montarMensagemConflito(
                  policialSelecionado,
                  conflito
                )
              : data.message ||
                "Não foi possível adicionar o policial"
        })
      );
    }
  };

  /* =======================================================
     APREENSÃO
  ======================================================= */

  const adicionarApreensao =
    async (id) => {
      const form =
        getApreensaoForm(id);

      if (
        !form.tipo ||
        !form.quantidade
      ) {
        return;
      }

      try {
        await api.post(
          `/api/rso/${id}/apreensao`,
          {
            tipo:
              form.tipo,

            quantidade:
              Number(
                form.quantidade
              )
          }
        );

        setApreensoesForm(
          (prev) => ({
            ...prev,

            [id]: {
              tipo: "",
              quantidade: ""
            }
          })
        );

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
          "Erro ao adicionar apreensão"
        );
      }
    };

  /* =======================================================
     ENCERRAR POLICIAL
  ======================================================= */

  const encerrarPolicial =
    async (
      id,
      origem,
      index
    ) => {
      try {
        await api.put(
          `/api/rso/${id}/encerrar-policial/${origem}/${index}`
        );

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
          "Erro ao encerrar policial"
        );
      }
    };

  /* =======================================================
     ENCERRAR RSO
  ======================================================= */

  const encerrarRSO =
    async (id) => {
      if (
        !(await confirm({ tone: "danger", message: "Deseja encerrar este RSO? Todos os integrantes ainda ativos terão o ponto encerrado." }))
      ) {
        return;
      }

      try {
        await api.put(
          `/api/rso/${id}/encerrar`
        );

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
          "Erro ao encerrar RSO"
        );
      }
    };

  /* =======================================================
     EXCLUIR RSO
  ======================================================= */

  const excluirRSO =
    async (id) => {
      if (
        !(await confirm({ tone: "danger", message: "Deseja excluir este RSO?" }))
      ) {
        return;
      }

      try {
        await api.delete(
          `/api/rso/${id}`
        );

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
          "Erro ao excluir RSO"
        );
      }
    };

  /* =======================================================
     REENVIAR
  ======================================================= */

  const reenviarRSO =
    async (id) => {
      try {
        await api.put(
          `/api/rso/${id}/reenviar`
        );

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
          "Erro ao reenviar RSO"
        );
      }
    };

  /* =======================================================
     OBSERVAÇÕES
  ======================================================= */

  const salvarObservacoes =
    async (
      id,
      texto,
      status
    ) => {
      try {
        if (
          status ===
          "Ativo"
        ) {
          await api.put(
            `/api/rso/${id}/observacoes`,
            {
              observacoes:
                texto
            }
          );
        }

        if (
          status ===
          "Rejeitado"
        ) {
          await api.put(
            `/api/rso/${id}/editar`,
            {
              observacoes:
                texto
            }
          );
        }

        await carregar();
      } catch (err) {
        console.error(err);

        toast.error(
          err.response?.data
            ?.message ||
          "Erro ao salvar observações"
        );
      }
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="rso-page">

      {/* =====================================================
          TOPO
      ===================================================== */}

      <div className="rso-topbar">
        <div>
          <h2>
            RSO • Registro de Serviço Operacional
          </h2>

          <p>
            Central operacional do
            2º BPChq Anchieta para
            viaturas e equipes ROCAM.
          </p>
        </div>

        <button
          className="rso-btn"
          type="button"
          onClick={carregar}
        >
          Recarregar dados
        </button>
      </div>

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <section className="rso-summary-grid">

        <div className="rso-summary-card">
          <small>
            Total de RSOs
          </small>

          <strong>
            {resumo.total}
          </strong>
        </div>

        <div className="rso-summary-card">
          <small>
            Ativos
          </small>

          <strong>
            {resumo.ativos}
          </strong>
        </div>

        <div className="rso-summary-card">
          <small>
            Aprovados
          </small>

          <strong>
            {resumo.aprovados}
          </strong>
        </div>

        <div className="rso-summary-card">
          <small>
            Rejeitados
          </small>

          <strong>
            {resumo.rejeitados}
          </strong>
        </div>

        <div className="rso-summary-card">
          <small>
            RSOs ROCAM
          </small>

          <strong>
            {resumo.rocam}
          </strong>
        </div>

        <div className="rso-summary-card">
          <small>
            Tempo consolidado
          </small>

          <strong>
            {formatarMinutos(
              resumo.totalMinutos
            )}
          </strong>
        </div>

        <div className="rso-summary-card">
          <small>
            Apreensões
          </small>

          <strong>
            {
              resumo.totalApreensoes
            }
          </strong>
        </div>

      </section>

      {/* =====================================================
          ABERTURA
      ===================================================== */}

      <section className="rso-section">

        <div className="rso-section-title">
          <div>
            <h3>
              Abertura de RSO
            </h3>

            <span>
              Escolha o tipo de
              patrulhamento, viatura
              e composição da equipe.
            </span>
          </div>
        </div>

        {/* TIPO DE PATRULHAMENTO */}

        <div
          className="rso-toolbar"
          style={{
            marginBottom: 16
          }}
        >
          <button
            className="rso-btn"
            type="button"
            onClick={() =>
              trocarTipoPatrulhamento(
                "VIATURA"
              )
            }
            style={{
              opacity:
                tipoPatrulhamento ===
                "VIATURA"
                  ? 1
                  : 0.55
            }}
          >
            🚔 VIATURA
          </button>

          <button
            className="rso-btn"
            type="button"
            onClick={() =>
              trocarTipoPatrulhamento(
                "ROCAM"
              )
            }
            style={{
              opacity:
                tipoPatrulhamento ===
                "ROCAM"
                  ? 1
                  : 0.55
            }}
          >
            🏍️ ROCAM
          </button>
        </div>

        {/* VIATURA */}

        <div
          className="rso-form-grid"
          style={{
            marginBottom: 16
          }}
        >
          <select
            className="rso-input"
            value={viatura}
            onChange={(e) =>
              setViatura(
                e.target.value
              )
            }
          >
            <option value="">
              {tipoPatrulhamento ===
              "ROCAM"
                ? "Selecione a ROCAM"
                : "Selecione a viatura"}
            </option>

            {(tipoPatrulhamento ===
            "ROCAM"
              ? VIATURAS_ROCAM
              : VIATURAS_ANCHIETA
            ).map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <input
            className="rso-search"
            placeholder={
              tipoPatrulhamento ===
              "ROCAM"
                ? "Buscar integrante ROCAM"
                : "Buscar policial por nome, patente ou funcional"
            }
            value={buscaHierarquia}
            onChange={(e) =>
              setBuscaHierarquia(
                e.target.value
              )
            }
          />
        </div>

        {/* EQUIPE */}

        <div
          className="rso-stack"
          style={{
            gap: 10
          }}
        >
          {equipeAbertura.map(
            (item, index) => (
              <div
                key={index}
                className="rso-inline-grid"
              >
                <select
                  className="rso-input"
                  value={
                    item.funcional
                  }
                  onChange={(e) =>
                    atualizarEquipeAbertura(
                      index,
                      "funcional",
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Selecione o policial
                  </option>

                  {hierarquiaFiltrada.map(
                    (p) => (
                      <option
                        key={`${index}-${p.funcional}`}
                        value={
                          p.funcional
                        }
                      >
                        {p.patente} -{" "}
                        {p.nome} (
                        {p.funcional})
                        {tipoPatrulhamento ===
                          "ROCAM" &&
                        p.qualificacaoRocam
                          ? ` • ${labelRocam(
                              p.qualificacaoRocam
                            )}`
                          : ""}
                      </option>
                    )
                  )}
                </select>

                {tipoPatrulhamento ===
                "VIATURA" ? (
                  <select
                    className="rso-input"
                    value={
                      item.cargo
                    }
                    onChange={(e) =>
                      atualizarEquipeAbertura(
                        index,
                        "cargo",
                        e.target.value
                      )
                    }
                  >
                    <option value="Encarregado">
                      Encarregado
                    </option>

                    <option value="Motorista">
                      Motorista
                    </option>

                    <option value="Operador">
                      Operador
                    </option>
                  </select>
                ) : (
                  <div className="rso-readonly-box">
                    {item.cargo === "Encarregado"
                      ? "Encarregado ROCAM"
                      : "Operador ROCAM"}
                  </div>
                )}

                <button
                  className="rso-btn danger small"
                  type="button"
                  onClick={() =>
                    removerLinhaEquipe(
                      index
                    )
                  }
                  disabled={
                    tipoPatrulhamento ===
                    "ROCAM"
                      ? equipeAbertura.length <=
                        2
                      : equipeAbertura.length <=
                        1
                  }
                >
                  Remover
                </button>
              </div>
            )
          )}
        </div>

        <div
          className="rso-toolbar"
          style={{
            marginTop: 14
          }}
        >
          <button
            className="rso-btn"
            type="button"
            onClick={
              adicionarLinhaEquipe
            }
          >
            + Adicionar integrante
          </button>

          <button
            className="rso-btn"
            type="button"
            onClick={abrirRSO}
          >
            Abrir RSO
          </button>
        </div>

        {tipoPatrulhamento ===
          "ROCAM" && (
          <div
            className="rso-readonly-box"
            style={{
              marginTop: 14
            }}
          >
            <strong>
              Regra ROCAM:
            </strong>{" "}
            mínimo de 2 integrantes.
            Somente policiais com
            Braçal ROCAM ou
            Estagiário ROCAM aparecem
            nesta seleção.
          </div>
        )}

        {/* ERRO ABERTURA */}

        {erroAbrirRSO && (
          <div
            className="rso-alert danger premium"
            style={{
              marginTop: 12
            }}
          >
            <strong>
              Não foi possível abrir
              o RSO
            </strong>

            <p>
              {erroAbrirRSO}
            </p>

            {policialConflitoAbrir && (
              <div>
                <strong>
                  Policial:
                </strong>{" "}
                {
                  policialConflitoAbrir.patente
                }{" "}
                {
                  policialConflitoAbrir.nome
                }{" "}
                (
                {
                  policialConflitoAbrir.funcional
                }
                )
              </div>
            )}

            {conflitoAbrirRSO && (
              <div
                style={{
                  marginTop: 10,
                  display: "grid",
                  gap: 6
                }}
              >
                <div>
                  <strong>
                    Viatura atual:
                  </strong>{" "}
                  {conflitoAbrirRSO.viatura ||
                    "-"}
                </div>

                <div>
                  <strong>
                    Tipo:
                  </strong>{" "}
                  {conflitoAbrirRSO.tipoPatrulhamento ||
                    "VIATURA"}
                </div>

                <div>
                  <strong>
                    Abertura:
                  </strong>{" "}
                  {formatarDataHora(
                    conflitoAbrirRSO.createdAt
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </section>

      {/* =====================================================
          MEUS RSOs
      ===================================================== */}

      <section className="rso-section">

        <div className="rso-section-title">
          <div>
            <h3>
              Meus RSOs
            </h3>

            <span>
              Acompanhamento completo
              dos seus registros.
            </span>
          </div>

          <input
            className="rso-search"
            placeholder="Buscar por viatura, tipo, status ou observação"
            value={buscaMeuRso}
            onChange={(e) =>
              setBuscaMeuRso(
                e.target.value
              )
            }
            style={{
              maxWidth: 360
            }}
          />
        </div>

        {rsosFiltrados.length ===
          0 && (
          <div className="rso-empty">
            Nenhum RSO encontrado.
          </div>
        )}

        <div className="rso-list">

          {rsosFiltrados.map(
            (rso) => {
              const totalMin =
                somarTempoRSO(rso);

              const apreensaoForm =
                getApreensaoForm(
                  rso._id
                );

              const timeline =
                montarTimelineServico(
                  rso
                );

              const integrantes =
                getIntegrantesRSO(
                  rso
                );

              const formAdicionar =
                getAdicaoForm(rso);

              const listaAdicionar =
                rso.tipoPatrulhamento ===
                "ROCAM"
                  ? hierarquiaRocam
                  : hierarquia;

              return (
                <article
                  key={rso._id}
                  className="rso-card"
                >

                  {/* HERO */}

                  <div className="rso-hero">

                    <div className="rso-hero-top">

                      <div className="rso-hero-title">

                        <small>
                          {rso.tipoPatrulhamento ===
                          "ROCAM"
                            ? "Patrulhamento ROCAM"
                            : "Viatura operacional"}
                        </small>

                        <h3>
                          {rso.viatura}
                        </h3>

                      </div>

                      <span
                        className={`rso-status-badge ${getStatusClass(
                          rso.status
                        )}`}
                      >
                        {rso.status}
                      </span>

                    </div>

                    <div className="rso-hero-grid">

                      <div className="rso-info-box">
                        <small>
                          Tipo
                        </small>

                        <strong>
                          {rso.tipoPatrulhamento ||
                            "VIATURA"}
                        </strong>
                      </div>

                      <div className="rso-info-box">
                        <small>
                          Tempo total
                        </small>

                        <strong>
                          {formatarMinutos(
                            totalMin
                          )}
                        </strong>
                      </div>

                      <div className="rso-info-box">
                        <small>
                          Equipe
                        </small>

                        <strong>
                          {
                            integrantes.length
                          }{" "}
                          policial(is)
                        </strong>
                      </div>

                      <div className="rso-info-box">
                        <small>
                          Apreensões
                        </small>

                        <strong>
                          {getQuantidadeTotalApreensoes(
                            rso
                          )}
                        </strong>
                      </div>

                      <div className="rso-info-box">
                        <small>
                          Abertura
                        </small>

                        <strong>
                          {formatarDataHora(
                            rso.createdAt
                          )}
                        </strong>
                      </div>

                    </div>

                  </div>

                  {/* REJEIÇÃO */}

                  {rso.status ===
                    "Rejeitado" &&
                    rso.comentarioADM && (
                    <div className="rso-alert danger">
                      <strong>
                        Motivo da
                        rejeição (ADM)
                      </strong>

                      <p>
                        {
                          rso.comentarioADM
                        }
                      </p>
                    </div>
                  )}

                  <div className="rso-grid-main">

                    {/* COLUNA ESQUERDA */}

                    <div className="rso-stack">

                      {/* EQUIPE */}

                      <section className="rso-block">

                        <div className="rso-block-title">
                          <h4>
                            Equipe operacional
                          </h4>

                          <span>
                            {
                              integrantes.length
                            }{" "}
                            integrante(s)
                          </span>
                        </div>

                        <div className="rso-team-grid">

                          {integrantes.map(
                            (
                              p,
                              index
                            ) => (
                              <div
                                key={`${p._origem}-${p._index}-${p.funcional}-${index}`}
                                className="rso-person-card"
                              >

                                <strong>
                                  {p.cargo ||
                                    "Operador"}
                                </strong>

                                <div className="rso-person-name">
                                  {p.patente}{" "}
                                  {p.nome} (
                                  {
                                    p.funcional
                                  }
                                  )
                                </div>

                                {rso.tipoPatrulhamento ===
                                  "ROCAM" &&
                                  p.qualificacaoRocam &&
                                  p.qualificacaoRocam !==
                                    "NENHUM" && (
                                    <small>
                                      {labelRocam(
                                        p.qualificacaoRocam
                                      )}
                                    </small>
                                  )}

                                <small>
                                  Entrada:{" "}
                                  {formatarHora(
                                    p.horaEntrada
                                  )}
                                </small>

                                <small>
                                  Saída:{" "}
                                  {formatarHora(
                                    p.horaSaida
                                  )}
                                </small>

                                <span>
                                  Total:{" "}
                                  {formatarMinutos(
                                    p.tempoMinutos
                                  )}
                                </span>

                                <small>
                                  Status:{" "}
                                  {p.status ||
                                    "-"}
                                </small>

                                {rso.status ===
                                  "Ativo" &&
                                  p.status ===
                                    "Ativo" && (
                                    <button
                                      className="rso-btn danger small"
                                      type="button"
                                      onClick={() =>
                                        encerrarPolicial(
                                          rso._id,
                                          p._origem,
                                          p._index
                                        )
                                      }
                                    >
                                      Encerrar policial
                                    </button>
                                  )}

                              </div>
                            )
                          )}

                        </div>

                      </section>

                      {/* ADICIONAR POLICIAL */}

                      {rso.status ===
                        "Ativo" && (
                        <section className="rso-block">

                          <div className="rso-block-title">
                            <h4>
                              Adicionar integrante
                            </h4>

                            <span>
                              Reforço de equipe
                            </span>
                          </div>

                          <div className="rso-inline-grid">

                            <select
                              className="rso-input"
                              value={
                                formAdicionar.funcional
                              }
                              onChange={(e) =>
                                atualizarAdicaoForm(
                                  rso._id,
                                  "funcional",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">
                                Selecione o policial
                              </option>

                              {listaAdicionar.map(
                                (p) => (
                                  <option
                                    key={`${rso._id}-${p.funcional}`}
                                    value={
                                      p.funcional
                                    }
                                  >
                                    {p.patente} -{" "}
                                    {p.nome} (
                                    {
                                      p.funcional
                                    }
                                    )
                                    {rso.tipoPatrulhamento ===
                                      "ROCAM"
                                      ? ` • ${labelRocam(
                                          p.qualificacaoRocam
                                        )}`
                                      : ""}
                                  </option>
                                )
                              )}
                            </select>

                            {rso.tipoPatrulhamento ===
                            "ROCAM" ? (
                              <select
                                className="rso-input"
                                value={
                                  formAdicionar.cargo
                                }
                                onChange={(e) =>
                                  atualizarAdicaoForm(
                                    rso._id,
                                    "cargo",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="Operador">
                                  Operador
                                </option>

                                <option value="Encarregado">
                                  Encarregado
                                </option>
                              </select>
                            ) : (
                              <select
                                className="rso-input"
                                value={
                                  formAdicionar.cargo
                                }
                                onChange={(e) =>
                                  atualizarAdicaoForm(
                                    rso._id,
                                    "cargo",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="Encarregado">
                                  Encarregado
                                </option>

                                <option value="Motorista">
                                  Motorista
                                </option>

                                <option value="Operador">
                                  Operador
                                </option>
                              </select>
                            )}

                            <button
                              className="rso-btn"
                              type="button"
                              onClick={() =>
                                adicionarPolicial(
                                  rso
                                )
                              }
                            >
                              Adicionar
                            </button>

                          </div>

                          {erroAdicionarPolicial[
                            rso._id
                          ] && (
                            <div
                              className="rso-alert danger"
                              style={{
                                marginTop: 12
                              }}
                            >
                              <strong>
                                Não foi possível
                                adicionar o policial
                              </strong>

                              <p>
                                {
                                  erroAdicionarPolicial[
                                    rso
                                      ._id
                                  ]
                                }
                              </p>

                              {policialConflito[
                                rso._id
                              ] && (
                                <div>
                                  <strong>
                                    Policial:
                                  </strong>{" "}
                                  {
                                    policialConflito[
                                      rso
                                        ._id
                                    ]
                                      .patente
                                  }{" "}
                                  {
                                    policialConflito[
                                      rso
                                        ._id
                                    ].nome
                                  }{" "}
                                  (
                                  {
                                    policialConflito[
                                      rso
                                        ._id
                                    ]
                                      .funcional
                                  }
                                  )
                                </div>
                              )}

                              {conflitoAdicionarPolicial[
                                rso._id
                              ] && (
                                <div>
                                  <strong>
                                    Viatura atual:
                                  </strong>{" "}
                                  {
                                    conflitoAdicionarPolicial[
                                      rso
                                        ._id
                                    ]
                                      .viatura
                                  }
                                </div>
                              )}
                            </div>
                          )}

                        </section>
                      )}

                      {/* OBSERVAÇÕES */}

                      <section className="rso-block">

                        <div className="rso-block-title">
                          <h4>
                            Observações operacionais
                          </h4>

                          <span>
                            Registro complementar
                          </span>
                        </div>

                        {rso.status ===
                          "Ativo" ||
                        rso.status ===
                          "Rejeitado" ? (
                          <textarea
                            className="rso-textarea"
                            defaultValue={
                              rso.observacoes ||
                              ""
                            }
                            onBlur={(e) =>
                              salvarObservacoes(
                                rso._id,
                                e.target
                                  .value,
                                rso.status
                              )
                            }
                          />
                        ) : (
                          <div className="rso-readonly-box">
                            {rso.observacoes ||
                              "-"}
                          </div>
                        )}

                      </section>

                      {/* TIMELINE */}

                      <section className="rso-block">

                        <div className="rso-block-title">
                          <h4>
                            Timeline do serviço
                          </h4>

                          <span>
                            {
                              timeline.length
                            }{" "}
                            evento(s)
                          </span>
                        </div>

                        {timeline.length ===
                        0 ? (
                          <div className="rso-empty">
                            Sem eventos
                            registrados.
                          </div>
                        ) : (
                          <div className="rso-timeline">

                            {timeline.map(
                              (
                                evento,
                                i
                              ) => (
                                <div
                                  key={i}
                                  className="rso-timeline-item"
                                >
                                  <strong>
                                    {
                                      evento.titulo
                                    }
                                  </strong>

                                  <p>
                                    {
                                      evento.descricao
                                    }
                                  </p>

                                  <small>
                                    {formatarDataHora(
                                      evento.data
                                    )}
                                  </small>
                                </div>
                              )
                            )}

                          </div>
                        )}

                      </section>

                    </div>

                    {/* COLUNA DIREITA */}

                    <div className="rso-stack">

                      {/* RESUMO TÁTICO */}

                      <section className="rso-highlight-panel">

                        <div className="rso-block-title">
                          <h4>
                            Resumo operacional
                          </h4>

                          <span>
                            Leitura rápida
                          </span>
                        </div>

                        <div className="rso-mini-grid">

                          <div className="rso-info-box">
                            <small>
                              Status
                            </small>

                            <strong>
                              {rso.status}
                            </strong>
                          </div>

                          <div className="rso-info-box">
                            <small>
                              Tipo
                            </small>

                            <strong>
                              {rso.tipoPatrulhamento ||
                                "VIATURA"}
                            </strong>
                          </div>

                          <div className="rso-info-box">
                            <small>
                              Viatura
                            </small>

                            <strong>
                              {rso.viatura}
                            </strong>
                          </div>

                          <div className="rso-info-box">
                            <small>
                              Total equipe
                            </small>

                            <strong>
                              {
                                integrantes.length
                              }
                            </strong>
                          </div>

                          <div className="rso-info-box">
                            <small>
                              Total apreensões
                            </small>

                            <strong>
                              {getQuantidadeTotalApreensoes(
                                rso
                              )}
                            </strong>
                          </div>

                        </div>

                      </section>

                      {/* APREENSÕES */}

                      <section className="rso-block">

                        <div className="rso-block-title">
                          <h4>
                            Apreensões
                          </h4>

                          <span>
                            {getQuantidadeTotalApreensoes(
                              rso
                            )}{" "}
                            registrada(s)
                          </span>
                        </div>

                        {Array.isArray(
                          rso.apreensoes
                        ) &&
                        rso.apreensoes
                          .length > 0 ? (
                          <div className="rso-capture-list">

                            {rso.apreensoes.map(
                              (a, i) => (
                                <div
                                  key={i}
                                  className="rso-capture-card"
                                >
                                  {formatarApreensao(
                                    a
                                  )}
                                </div>
                              )
                            )}

                          </div>
                        ) : (
                          <div className="rso-empty">
                            Nenhuma apreensão
                            registrada.
                          </div>
                        )}

                        {rso.status ===
                          "Ativo" && (
                          <div
                            className="rso-inline-grid"
                            style={{
                              marginTop: 14
                            }}
                          >
                            <select
                              className="rso-input"
                              value={
                                apreensaoForm.tipo
                              }
                              onChange={(e) =>
                                atualizarApreensaoForm(
                                  rso._id,
                                  "tipo",
                                  e.target.value
                                )
                              }
                            >
                              <option value="">
                                Tipo de apreensão
                              </option>

                              <option value="Armas">
                                Armas
                              </option>

                              <option value="Munições">
                                Munições
                              </option>

                              <option value="Entorpecentes">
                                Entorpecentes
                              </option>

                              <option value="Ilicitos">
                                Ilícitos
                              </option>

                              <option value="Valores">
                                Valores
                              </option>
                            </select>

                            <input
                              className="rso-input"
                              type="number"
                              step={
                                apreensaoForm.tipo ===
                                  "Valores" ||
                                apreensaoForm.tipo ===
                                  "Entorpecentes"
                                  ? "0.01"
                                  : "1"
                              }
                              min="0"
                              placeholder={labelQuantidadePorTipo(
                                apreensaoForm.tipo
                              )}
                              value={
                                apreensaoForm.quantidade
                              }
                              onChange={(e) =>
                                atualizarApreensaoForm(
                                  rso._id,
                                  "quantidade",
                                  e.target.value
                                )
                              }
                            />

                            <button
                              className="rso-btn"
                              type="button"
                              onClick={() =>
                                adicionarApreensao(
                                  rso._id
                                )
                              }
                            >
                              Adicionar apreensão
                            </button>

                          </div>
                        )}

                      </section>

                      {/* AÇÕES */}

                      <section className="rso-decision-box">

                        <div className="rso-block-title">
                          <h4>
                            Ações do RSO
                          </h4>

                          <span>
                            Encerramento e gestão
                          </span>
                        </div>

                        <div className="rso-action-row">

                          {rso.status ===
                            "Ativo" && (
                            <button
                              className="rso-btn"
                              type="button"
                              onClick={() =>
                                encerrarRSO(
                                  rso._id
                                )
                              }
                            >
                              Encerrar RSO
                            </button>
                          )}

                          {(rso.status ===
                            "Aprovado" ||
                            rso.status ===
                              "Rejeitado") && (
                            <button
                              className="rso-btn danger"
                              type="button"
                              onClick={() =>
                                excluirRSO(
                                  rso._id
                                )
                              }
                            >
                              Excluir RSO
                            </button>
                          )}

                          {rso.status ===
                            "Rejeitado" && (
                            <button
                              className="rso-btn"
                              type="button"
                              onClick={() =>
                                reenviarRSO(
                                  rso._id
                                )
                              }
                            >
                              Reenviar RSO
                            </button>
                          )}

                        </div>

                      </section>

                    </div>

                  </div>

                </article>
              );
            }
          )}

        </div>

      </section>

    </div>
  );
}