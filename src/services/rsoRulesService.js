const RSO = require("../models/RSO");
const User = require("../models/User");

/* =========================================================
   VERIFICA EQUIPE FIXA ANTIGA
========================================================= */

const policialEstaNaEquipeFixa = (rso, funcional) => {
  const funcionalNumero = Number(funcional);

  const chefe = rso?.equipeFixa?.chefe;
  const auxiliar = rso?.equipeFixa?.auxiliar;

  const chefeAtivo =
    chefe &&
    Number(chefe.funcional) === funcionalNumero &&
    String(chefe.status || "Ativo") === "Ativo";

  const auxiliarAtivo =
    auxiliar &&
    Number(auxiliar.funcional) === funcionalNumero &&
    String(auxiliar.status || "Ativo") === "Ativo";

  return Boolean(
    chefeAtivo ||
    auxiliarAtivo
  );
};

/* =========================================================
   VERIFICA EQUIPE ROTATIVA ANTIGA
========================================================= */

const policialEstaNaEquipeRotativa = (
  rso,
  funcional
) => {
  const funcionalNumero = Number(funcional);

  return Object.values(
    rso?.equipeRotativa || {}
  ).some((lista) => {
    return (
      Array.isArray(lista) &&
      lista.some((p) => {
        return (
          Number(p?.funcional) ===
            funcionalNumero &&
          String(
            p?.status || "Ativo"
          ) === "Ativo"
        );
      })
    );
  });
};

/* =========================================================
   VERIFICA NOVA EQUIPE DINÂMICA
========================================================= */

const policialEstaNaEquipeNova = (
  rso,
  funcional
) => {
  const funcionalNumero = Number(funcional);

  if (!Array.isArray(rso?.equipe)) {
    return false;
  }

  return rso.equipe.some((p) => {
    return (
      Number(p?.funcional) ===
        funcionalNumero &&
      String(
        p?.status || "Ativo"
      ) === "Ativo"
    );
  });
};

/* =========================================================
   VERIFICA QUALQUER MODELO DE EQUIPE
========================================================= */

const policialEstaNoRSO = (
  rso,
  funcional
) => {
  return (
    policialEstaNaEquipeNova(
      rso,
      funcional
    ) ||
    policialEstaNaEquipeFixa(
      rso,
      funcional
    ) ||
    policialEstaNaEquipeRotativa(
      rso,
      funcional
    )
  );
};

/* =========================================================
   DESCOBRE RESPONSÁVEL PRINCIPAL DO RSO

   Novo modelo:
   procura Encarregado ativo.

   Modelo antigo:
   usa Chefe.
========================================================= */

const getResponsavelRSO = (rso) => {
  if (
    Array.isArray(rso?.equipe) &&
    rso.equipe.length > 0
  ) {
    const encarregado =
      rso.equipe.find((p) => {
        return (
          String(
            p?.cargo || ""
          ).toLowerCase() ===
            "encarregado" &&
          String(
            p?.status || "Ativo"
          ) === "Ativo"
        );
      }) ||
      rso.equipe.find(
        (p) =>
          String(
            p?.cargo || ""
          ).toLowerCase() ===
          "encarregado"
      );

    if (encarregado) {
      return {
        nome:
          encarregado.nome || "",

        patente:
          encarregado.patente || "",

        funcional:
          encarregado.funcional || ""
      };
    }
  }

  if (rso?.equipeFixa?.chefe) {
    return {
      nome:
        rso.equipeFixa.chefe.nome ||
        "",

      patente:
        rso.equipeFixa.chefe
          .patente || "",

      funcional:
        rso.equipeFixa.chefe
          .funcional || ""
    };
  }

  return null;
};

/* =========================================================
   POLICIAL POSSUI RSO ATIVO?
========================================================= */

exports.policialEmRSOAtivo = async (
  funcional
) => {
  const rsos = await RSO.find({
    status: "Ativo"
  }).lean();

  return rsos.some((rso) => {
    return policialEstaNoRSO(
      rso,
      funcional
    );
  });
};

/* =========================================================
   BUSCAR RSO ATIVO DO POLICIAL
========================================================= */

exports.buscarRSOAtivoDoPolicial =
  async (funcional) => {
    const rsos = await RSO.find({
      status: "Ativo"
    }).lean();

    const rsoEncontrado =
      rsos.find((rso) => {
        return policialEstaNoRSO(
          rso,
          funcional
        );
      });

    if (!rsoEncontrado) {
      return null;
    }

    let criadoPor = {
      id: null,
      nome: "Não identificado",
      patente: "",
      funcional: ""
    };

    if (rsoEncontrado.criadoPor) {
      const usuario =
        await User.findById(
          rsoEncontrado.criadoPor
        )
          .select(
            "_id nome patente funcional"
          )
          .lean();

      if (usuario) {
        criadoPor = {
          id:
            usuario._id,

          nome:
            usuario.nome ||
            "Não identificado",

          patente:
            usuario.patente || "",

          funcional:
            usuario.funcional || ""
        };
      }
    }

    const responsavel =
      getResponsavelRSO(
        rsoEncontrado
      );

    return {
      _id:
        rsoEncontrado._id,

      tipoPatrulhamento:
        rsoEncontrado
          .tipoPatrulhamento ||
        "VIATURA",

      viatura:
        rsoEncontrado.viatura ||
        "-",

      criadoPor,

      /*
       * Mantemos "chefe" no retorno
       * por compatibilidade com telas
       * antigas que ainda esperam esse
       * nome.
       *
       * Nos novos RSOs ele será o
       * Encarregado.
       */
      chefe:
        responsavel,

      responsavel:
        responsavel,

      createdAt:
        rsoEncontrado.createdAt ||
        null
    };
  };