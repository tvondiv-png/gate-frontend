import {
  useEffect,
  useState
} from "react";

import api from "../../api/api";

import "../../styles/rocam-dashboard.css";

const formatarData = (data) => {
  if (!data) return "-";

  return new Date(
    data
  ).toLocaleDateString(
    "pt-BR"
  );
};

const Grupo = ({
  titulo,
  items = [],
  tipo
}) => {
  return (
    <section className="rocam-hierarchy-group">

      <div className="rocam-hierarchy-group-title">

        <div>

          <small>
            HIERARQUIA ROCAM
          </small>

          <h2>
            {titulo}
          </h2>

        </div>

        <span>
          {items.length}
        </span>

      </div>

      {items.length === 0 ? (
        <div className="rocam-dashboard-empty">
          Nenhum policial neste
          grupo.
        </div>
      ) : (
        <div className="rocam-hierarchy-grid">

          {items.map(
            (item) => (

              <article
                key={item._id}
                className="rocam-hierarchy-person"
              >

                <div className="rocam-hierarchy-person-top">

                  <div>

                    <small>
                      {item.patente ||
                        "-"}
                    </small>

                    <strong>
                      {item.nome}
                    </strong>

                  </div>

                  <span>
                    {
                      item.situacaoRocam
                    }
                  </span>

                </div>

                <div className="rocam-hierarchy-person-meta">

                  <span>
                    Funcional:{" "}
                    {item.funcional}
                  </span>

                  <span>
                    Ingresso:{" "}
                    {formatarData(
                      item.dataIngressoRocam
                    )}
                  </span>

                  {tipo ===
                    "estagiario" &&
                    item.stage && (
                      <span>
                        Progresso:{" "}
                        {Number(
                          item.stage
                            ?.progresso
                            ?.percentualGeral ||
                            0
                        ).toFixed(
                          0
                        )}
                        %
                      </span>
                    )}

                </div>

              </article>
            )
          )}

        </div>
      )}

    </section>
  );
};

export default function RocamHierarquia() {
  const [dados, setDados] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    api
      .get(
        "/api/rocam/hierarquia"
      )
      .then((res) =>
        setDados(res.data)
      )
      .catch((err) =>
        console.error(
          "Erro Hierarquia ROCAM:",
          err
        )
      )
      .finally(() =>
        setLoading(false)
      );
  }, []);

  if (loading) {
    return (
      <div className="rocam-dashboard-empty">
        Carregando Hierarquia
        ROCAM...
      </div>
    );
  }

  return (
    <div className="rocam-dashboard-page">

      <section className="rocam-dashboard-hero">

        <div>

          <span className="rocam-dashboard-kicker">
            ORGANIZAÇÃO ROCAM
          </span>

          <h1>
            Hierarquia ROCAM
          </h1>

          <p>
            Organização atual do
            efetivo ROCAM, separada
            da Hierarquia Geral do
            Batalhão.
          </p>

        </div>

        <div className="rocam-dashboard-role">

          <small>
            EFETIVO ROCAM
          </small>

          <strong>
            {dados?.total || 0}
          </strong>

          <span>
            vínculos ativos
          </span>

        </div>

      </section>

      <Grupo
        titulo="Comando ROCAM"
        items={
          dados?.comando || []
        }
      />

      <Grupo
        titulo="Subcomando ROCAM"
        items={
          dados?.subcomando || []
        }
      />

      <Grupo
        titulo="Braçais ROCAM"
        items={
          dados?.bracais || []
        }
      />

      <Grupo
        titulo="Estagiários ROCAM"
        tipo="estagiario"
        items={
          dados?.estagiarios || []
        }
      />

    </div>
  );
}