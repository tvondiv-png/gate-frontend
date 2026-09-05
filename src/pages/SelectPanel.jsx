import {
  useEffect,
  useMemo,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../contexts/AuthContext";

import api from "../api/api";

import "../styles/select-panel.css";

export default function SelectPanel() {
  const {
    user
  } = useAuth();

  const navigate =
    useNavigate();

  /* =========================================================
     ROCAM
  ========================================================= */

  const [
    rocamContexto,
    setRocamContexto
  ] = useState(null);

  const [
    verificandoRocam,
    setVerificandoRocam
  ] = useState(true);

  useEffect(() => {
    let ativo = true;

    const verificarRocam =
      async () => {
        if (!user) {
          if (ativo) {
            setRocamContexto(null);
            setVerificandoRocam(false);
          }

          return;
        }

        try {
          setVerificandoRocam(true);

          const res =
            await api.get(
              "/api/rocam/contexto"
            );

          if (!ativo) {
            return;
          }

          setRocamContexto(
            res.data || null
          );
        } catch (err) {
          /*
            403 aqui NÃO precisa quebrar
            a Central de Acesso.

            Significa apenas que o usuário
            não possui acesso ROCAM.
          */
          if (ativo) {
            setRocamContexto(null);
          }

          if (
            err?.response?.status !==
            403
          ) {
            console.error(
              "Erro ao verificar acesso ROCAM:",
              err
            );
          }
        } finally {
          if (ativo) {
            setVerificandoRocam(false);
          }
        }
      };

    verificarRocam();

    return () => {
      ativo = false;
    };
  }, [user]);

  /* =========================================================
     PERMISSÕES
  ========================================================= */

  const permissoes =
    useMemo(() => {
      if (!user) {
        return {
          podeUsuario: false,
          podeAdmin: false,
          podeComando: false,
          podeRocam: false
        };
      }

      const podeAdmin =
        user.role === "admin" ||
        user.role === "superadmin";

      const podeComando =
        user.role ===
          "superadmin" ||
        user.funcao ===
          "Comando do Batalhão" ||
        user.funcao ===
          "Subcomando do Batalhão";

      /*
        A autorização ROCAM vem
        diretamente do backend.
      */
      const podeRocam =
        user.role === "superadmin" ||
          rocamContexto?.podeAcessar === true;

      return {
        /*
          Todo usuário autenticado
          possui seu painel individual.
        */
        podeUsuario: true,

        /*
          Admin / Superadmin.
        */
        podeAdmin,

        /*
          Comando / Subcomando /
          Superadmin.
        */
        podeComando,

        /*
          Comando Batalhão
          Comando ROCAM
          Subcomando ROCAM
          Braçal ROCAM
          Estagiário ROCAM
          Superadmin
        */
        podeRocam
      };
    }, [
      user,
      rocamContexto
    ]);

  /* =========================================================
     USUÁRIO COMUM

     Só manda direto para /usuario depois
     que a verificação ROCAM terminar.

     Isso é MUITO importante.

     Caso contrário um Estagiário ROCAM
     com role "user" seria redirecionado
     antes de descobrirmos seu acesso ROCAM.
  ========================================================= */

  useEffect(() => {
    if (
      !user ||
      verificandoRocam
    ) {
      return;
    }

    const somenteUsuario =
      permissoes.podeUsuario &&
      !permissoes.podeAdmin &&
      !permissoes.podeComando &&
      !permissoes.podeRocam;

    if (somenteUsuario) {
      navigate(
        "/usuario",
        {
          replace: true
        }
      );
    }
  }, [
    user,
    verificandoRocam,
    permissoes,
    navigate
  ]);

  /* =========================================================
     CARREGAMENTO
  ========================================================= */

  if (!user) {
    return null;
  }

  if (verificandoRocam) {
    return (
      <div className="select-panel-page">

        <div className="select-panel-bg" />

        <div
          className="
            select-panel-light
            select-panel-light-left
          "
        />

        <div
          className="
            select-panel-light
            select-panel-light-right
          "
        />

        <div className="select-panel-box">

          <header className="select-panel-header">

            <div className="select-panel-main-logo-wrap">
              <img
                src="/anchieta-logo.png"
                alt="2º BPChq Anchieta"
                className="select-panel-main-logo"
              />
            </div>

            <span className="select-panel-kicker">
              2º BPChq • ANCHIETA
            </span>

            <h1>
              Central de Acesso
            </h1>

            <p className="subtitle">
              Verificando ambientes
              autorizados...
            </p>

          </header>

        </div>

      </div>
    );
  }

  const somenteUsuario =
    permissoes.podeUsuario &&
    !permissoes.podeAdmin &&
    !permissoes.podeComando &&
    !permissoes.podeRocam;

  if (somenteUsuario) {
    return null;
  }

  /* =========================================================
     QUANTIDADE DE PAINÉIS
  ========================================================= */

  const totalPaineis = [
    permissoes.podeUsuario,
    permissoes.podeAdmin,
    permissoes.podeComando,
    permissoes.podeRocam
  ].filter(Boolean).length;

  /* =========================================================
     PAPEL ROCAM
  ========================================================= */

  const papelRocam = (() => {
    if (
      rocamContexto
        ?.superadmin
    ) {
      return "ROCAM";
    }

    if (
      rocamContexto
        ?.comandoBatalhao
    ) {
      return "SUPERVISÃO DO BATALHÃO";
    }

    switch (
      rocamContexto
        ?.papelRocam
    ) {
      case "COMANDO_ROCAM":
        return "COMANDO ROCAM";

      case "SUBCOMANDO_ROCAM":
        return "SUBCOMANDO ROCAM";

      case "BRACAL_ROCAM":
        return "BRAÇAL ROCAM";

      case "ESTAGIARIO_ROCAM":
        return "ESTAGIÁRIO ROCAM";

      default:
        return "ROCAM";
    }
  })();

  return (
    <div className="select-panel-page">

      <div className="select-panel-bg" />

      <div
        className="
          select-panel-light
          select-panel-light-left
        "
      />

      <div
        className="
          select-panel-light
          select-panel-light-right
        "
      />

      <div className="select-panel-box">

        {/* ===================================================
            CABEÇALHO
        =================================================== */}

        <header className="select-panel-header">

          <div className="select-panel-main-logo-wrap">

            <img
              src="/anchieta-logo.png"
              alt="2º BPChq Anchieta"
              className="select-panel-main-logo"
            />

          </div>

          <span className="select-panel-kicker">
            2º BPChq • ANCHIETA
          </span>

          <h1>
            Central de Acesso
          </h1>

          <p className="subtitle">
            Selecione o ambiente autorizado
            para sua função dentro do Sistema
            Operacional do 2º Batalhão de
            Polícia de Choque — Anchieta.
          </p>

          <div className="select-panel-user">

            <span>
              Usuário autenticado
            </span>

            <strong>
              {user.patente
                ? `${user.patente} `
                : ""}

              {user.nome || "-"}
            </strong>

            <small>
              {user.funcao ||
                user.role ||
                "-"}
            </small>

          </div>

        </header>

        {/* ===================================================
            PAINÉIS
        =================================================== */}

        <div
          className={
            `select-panel-cards panels-${totalPaineis}`
          }
        >

          {/* =================================================
              USUÁRIO
          ================================================= */}

          {permissoes.podeUsuario && (
            <article
              className="
                panel-access-card
                user
              "
              onClick={() =>
                navigate(
                  "/usuario"
                )
              }
            >

              <div className="panel-access-glow" />

              <div className="panel-card-top centered">

                <img
                  src="/anchieta-logo.png"
                  alt="2º BPChq Anchieta"
                  className="panel-card-logo large"
                />

              </div>

              <span
                className="
                  panel-access-badge
                  operacional
                "
              >
                OPERACIONAL
              </span>

              <h2>
                Painel do Policial
              </h2>

              <p>
                Ambiente individual para
                RSO, horas de patrulhamento,
                ações, notificações,
                solicitações, ausência e
                demais recursos operacionais.
              </p>

              <div className="panel-access-features">

                <span>
                  🚓 RSO
                </span>

                <span>
                  ⏱️ Horas
                </span>

                <span>
                  🎯 Ações
                </span>

              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();

                  navigate(
                    "/usuario"
                  );
                }}
              >
                Acessar Painel
              </button>

            </article>
          )}

          {/* =================================================
              ROCAM
          ================================================= */}

          {permissoes.podeRocam && (
            <article
              className="
                panel-access-card
                rocam
              "
              onClick={() =>
                navigate(
                  "/rocam"
                )
              }
            >

              <div className="panel-access-glow" />

              <div className="panel-card-top centered">

                <img
                  src="/rocam-logo.png"
                  alt="ROCAM"
                  className="
                    panel-card-logo
                    large
                  "
                />

              </div>

              <span
                className="
                  panel-access-badge
                  rocam
                "
              >
                {papelRocam}
              </span>

              <h2>
                Painel ROCAM
              </h2>

              <p>
                Ambiente exclusivo da ROCAM
                para acompanhamento de
                estágio, patrulhamento,
                avaliações, metas,
                hierarquia e atividades
                especializadas.
              </p>

              <div className="panel-access-features">

                <span>
                  🏍️ Patrulha
                </span>

                <span>
                  ✓ Avaliações
                </span>

                <span>
                  ◈ ROCAM
                </span>

              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();

                  navigate(
                    "/rocam"
                  );
                }}
              >
                Acessar ROCAM
              </button>

            </article>
          )}

          {/* =================================================
              ADMINISTRATIVO
          ================================================= */}

          {permissoes.podeAdmin && (
            <article
              className="
                panel-access-card
                admin
              "
              onClick={() =>
                navigate(
                  "/admin"
                )
              }
            >

              <div className="panel-access-glow" />

              <div className="panel-card-top centered">

                <img
                  src="/anchieta-logo.png"
                  alt="2º BPChq Anchieta"
                  className="
                    panel-card-logo
                    large
                  "
                />

              </div>

              <span
                className="
                  panel-access-badge
                  administrativo
                "
              >
                ADMINISTRAÇÃO
              </span>

              <h2>
                Painel Administrativo
              </h2>

              <p>
                Gestão de efetivo,
                hierarquia, RSO, horas,
                avaliações, cadastros,
                justiça, apreensões,
                registros e manutenção
                institucional.
              </p>

              <div className="panel-access-features">

                <span>
                  👥 Efetivo
                </span>

                <span>
                  📋 Gestão
                </span>

                <span>
                  ⚙️ Sistema
                </span>

              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();

                  navigate(
                    "/admin"
                  );
                }}
              >
                Acessar Administração
              </button>

            </article>
          )}

          {/* =================================================
              COMANDO
          ================================================= */}

          {permissoes.podeComando && (
            <article
              className="
                panel-access-card
                comando
              "
              onClick={() =>
                navigate(
                  "/comando"
                )
              }
            >

              <div className="panel-access-glow" />

              <div className="panel-card-top centered">

                <img
                  src="/anchieta-logo.png"
                  alt="2º BPChq Anchieta"
                  className="
                    panel-card-logo
                    large
                  "
                />

              </div>

              <span
                className="
                  panel-access-badge
                  comando
                "
              >
                COMANDO DO BATALHÃO
              </span>

              <h2>
                Centro de Comando
              </h2>

              <p>
                Ambiente estratégico
                reservado ao Comando e
                Subcomando para
                acompanhamento do efetivo,
                patrulhamento, disciplina,
                desempenho e decisões
                institucionais.
              </p>

              <div className="panel-access-features">

                <span>
                  📊 Estratégia
                </span>

                <span>
                  🛡️ Efetivo
                </span>

                <span>
                  📈 Desempenho
                </span>

              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();

                  navigate(
                    "/comando"
                  );
                }}
              >
                Acessar Comando
              </button>

            </article>
          )}

        </div>

        {/* ===================================================
            RODAPÉ
        =================================================== */}

        <footer className="select-panel-footer">

          <strong>
            2º BPChq — Anchieta
          </strong>

          <span>
            Sistema Operacional •
            Acesso Controlado
          </span>

        </footer>

      </div>

    </div>
  );
}