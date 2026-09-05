import {
  useEffect,
  useState
} from "react";

import {
  useOutletContext
} from "react-router-dom";

import api from "../../api/api";

import "../../styles/rocam-avisos.css";

export default function RocamAvisos() {
  const {
    contexto
  } =
    useOutletContext();

  const [
    avisos,
    setAvisos
  ] = useState([]);

  const [
    form,
    setForm
  ] = useState({
    titulo: "",
    mensagem: "",
    prioridade:
      "NORMAL",
    publico: [
      "TODOS"
    ]
  });

  const carregar =
    async () => {
      const res =
        await api.get(
          "/api/rocam/avisos"
        );

      setAvisos(
        res.data || []
      );
    };

  useEffect(() => {
    carregar();
  }, []);

  const publicar =
    async (e) => {
      e.preventDefault();

      await api.post(
        "/api/rocam/comando/avisos",
        form
      );

      setForm({
        titulo: "",
        mensagem: "",
        prioridade:
          "NORMAL",
        publico: [
          "TODOS"
        ]
      });

      await carregar();
    };

  return (
    <div className="rocam-notices-page">

      <section className="rocam-notices-hero">

        <span>
          COMUNICAÇÃO ROCAM
        </span>

        <h1>
          Avisos
        </h1>

        <p>
          Comunicados internos da ROCAM.
        </p>

      </section>

      {contexto?.podeGerenciar && (
        <section className="rocam-notices-compose">

          <h2>
            Publicar aviso
          </h2>

          <form
            onSubmit={publicar}
          >

            <input
              value={
                form.titulo
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  titulo:
                    e.target.value
                })
              }
              placeholder="Título"
              required
            />

            <select
              value={
                form.prioridade
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  prioridade:
                    e.target.value
                })
              }
            >
              <option value="NORMAL">
                Normal
              </option>

              <option value="IMPORTANTE">
                Importante
              </option>

              <option value="URGENTE">
                Urgente
              </option>
            </select>

            <textarea
              rows="5"
              value={
                form.mensagem
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  mensagem:
                    e.target.value
                })
              }
              placeholder="Mensagem..."
              required
            />

            <button>
              Publicar aviso
            </button>

          </form>

        </section>
      )}

      <section className="rocam-notices-list">

        {avisos.map(
          (item) => (
            <article
              key={item._id}
              className={
                item.prioridade
                  ?.toLowerCase()
              }
            >

              <span>
                {item.prioridade}
              </span>

              <h2>
                {item.titulo}
              </h2>

              <p>
                {item.mensagem}
              </p>

            </article>
          )
        )}

      </section>

    </div>
  );
}