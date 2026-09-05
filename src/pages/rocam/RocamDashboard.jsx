import {
  useOutletContext
} from "react-router-dom";

import "../../styles/rocam-dashboard.css";

const formatarData = (data) => {
  if (!data) return "-";

  const valor =
    new Date(data);

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

export default function RocamDashboard() {
  const {
    contexto
  } =
    useOutletContext();

  const profile =
    contexto?.profile;

  const hierarchy =
    contexto?.hierarchy;

  const papel =
    contexto?.papelRocam;

  const tituloPapel = {
    COMANDO_ROCAM:
      "Comando ROCAM",

    SUBCOMANDO_ROCAM:
      "Subcomando ROCAM",

    BRACAL_ROCAM:
      "Braçal ROCAM",

    ESTAGIARIO_ROCAM:
      "Estagiário ROCAM"
  }[papel];

  return (
    <div className="rocam-dashboard-page">

      {/* HERO */}

      <section className="rocam-dashboard-hero">

        <div>

          <span className="rocam-dashboard-kicker">
            ROCAM • 2º BPChq
          </span>

          <h1>
            {hierarchy?.nome
              ? `Bem-vindo, ${hierarchy.nome}`
              : "Painel ROCAM"}
          </h1>

          <p>
            Acompanhamento operacional,
            estágio, avaliações,
            patrulhamento e histórico ROCAM.
          </p>

        </div>

        <div className="rocam-dashboard-role">

          <small>
            SITUAÇÃO ROCAM
          </small>

          <strong>
            {tituloPapel ||
              (
                contexto?.podeGerenciar
                  ? "ROCAM"
                  : "ROCAM"
              )}
          </strong>

          <span>
            {profile?.situacaoRocam ||
              (
                contexto?.podeGerenciar
                  ? "ACESSO DE GESTÃO"
                  : "-"
              )}
          </span>

        </div>

      </section>

      {/* DADOS */}

      <section className="rocam-dashboard-summary">

        <div className="rocam-dashboard-summary-card">

          <small>
            Patente
          </small>

          <strong>
            {hierarchy?.patente ||
              "-"}
          </strong>

        </div>

        <div className="rocam-dashboard-summary-card">

          <small>
            Funcional
          </small>

          <strong>
            {hierarchy?.funcional ||
              "-"}
          </strong>

        </div>

        <div className="rocam-dashboard-summary-card">

          <small>
            Ingresso ROCAM
          </small>

          <strong>
            {formatarData(
              profile?.dataIngressoRocam
            )}
          </strong>

        </div>

        <div className="rocam-dashboard-summary-card destaque">

          <small>
            Vínculo
          </small>

          <strong>
            {tituloPapel ||
              "Supervisão"}
          </strong>

        </div>

      </section>

      {/* ESTAGIÁRIO */}

      {papel ===
        "ESTAGIARIO_ROCAM" && (

        <section className="rocam-dashboard-card">

          <div className="rocam-dashboard-card-title">

            <div>
              <small>
                ESTÁGIO ROCAM
              </small>

              <h2>
                Meu progresso
              </h2>
            </div>

          </div>

          <div className="rocam-dashboard-empty">
            Na próxima etapa,
            vamos conectar aqui as
            metas, horas ROCAM,
            avaliações e
            questionários do estágio.
          </div>

        </section>
      )}

      {/* BRAÇAL */}

      {papel ===
        "BRACAL_ROCAM" && (

        <section className="rocam-dashboard-card">

          <div className="rocam-dashboard-card-title">

            <div>
              <small>
                BRAÇAL ROCAM
              </small>

              <h2>
                Avaliações
              </h2>
            </div>

          </div>

          <div className="rocam-dashboard-empty">
            Aqui aparecerão os
            Estagiários ROCAM
            disponíveis para
            avaliação.
          </div>

        </section>
      )}

      {/* COMANDO */}

      {contexto?.podeGerenciar && (

        <section className="rocam-dashboard-card">

          <div className="rocam-dashboard-card-title">

            <div>
              <small>
                COMANDO ROCAM
              </small>

              <h2>
                Centro de Gestão
              </h2>
            </div>

          </div>

          <div className="rocam-dashboard-command-grid">

            <div>
              <small>
                Estagiários
              </small>

              <strong>
                Gestão do estágio
              </strong>
            </div>

            <div>
              <small>
                Braçais
              </small>

              <strong>
                Gestão do efetivo
              </strong>
            </div>

            <div>
              <small>
                Avaliações
              </small>

              <strong>
                Homologação
              </strong>
            </div>

            <div>
              <small>
                Metas
              </small>

              <strong>
                Controle ROCAM
              </strong>
            </div>

          </div>

        </section>
      )}

    </div>
  );
}