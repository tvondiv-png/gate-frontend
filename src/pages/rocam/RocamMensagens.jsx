import {
  useEffect,
  useState
} from "react";

import api from "../../api/api";

import "../../styles/rocam-mensagens.css";

export default function RocamMensagens() {
  const [
    contatos,
    setContatos
  ] = useState([]);

  const [
    recebidas,
    setRecebidas
  ] = useState([]);

  const [
    enviadas,
    setEnviadas
  ] = useState([]);

  const [
    aba,
    setAba
  ] = useState("recebidas");

  const [
    form,
    setForm
  ] = useState({
    destinatario: "",
    assunto: "",
    mensagem: ""
  });

  const [
    enviando,
    setEnviando
  ] = useState(false);

  const carregar =
    async () => {
      const [
        contatosRes,
        recebidasRes,
        enviadasRes
      ] =
        await Promise.all([
          api.get(
            "/api/rocam/mensagens/contatos"
          ),

          api.get(
            "/api/rocam/mensagens/recebidas"
          ),

          api.get(
            "/api/rocam/mensagens/enviadas"
          )
        ]);

      setContatos(
        contatosRes.data || []
      );

      setRecebidas(
        recebidasRes.data || []
      );

      setEnviadas(
        enviadasRes.data || []
      );
    };

  useEffect(() => {
    carregar();
  }, []);

  const enviar =
    async (e) => {
      e.preventDefault();

      try {
        setEnviando(true);

        await api.post(
          "/api/rocam/mensagens",
          form
        );

        setForm({
          destinatario: "",
          assunto: "",
          mensagem: ""
        });

        await carregar();

        setAba("enviadas");
      } finally {
        setEnviando(false);
      }
    };

  const lista =
    aba === "recebidas"
      ? recebidas
      : enviadas;

  return (
    <div className="rocam-messages-page">

      <section className="rocam-messages-hero">

        <div>
          <span>
            COMUNICAÇÃO ROCAM
          </span>

          <h1>
            Mensagens
          </h1>

          <p>
            Comunicação interna entre
            integrantes e Comando ROCAM.
          </p>
        </div>

      </section>

      <section className="rocam-messages-compose">

        <h2>
          Nova mensagem
        </h2>

        <form
          onSubmit={enviar}
        >

          <select
            value={
              form.destinatario
            }
            onChange={(e) =>
              setForm({
                ...form,
                destinatario:
                  e.target.value
              })
            }
            required
          >
            <option value="">
              Selecione o destinatário
            </option>

            {contatos.map(
              (item) => (
                <option
                  key={item.user}
                  value={item.user}
                >
                  {item.patente}{" "}
                  {item.nome} —{" "}
                  {item.papelRocam}
                </option>
              )
            )}
          </select>

          <input
            value={
              form.assunto
            }
            onChange={(e) =>
              setForm({
                ...form,
                assunto:
                  e.target.value
              })
            }
            placeholder="Assunto"
            required
          />

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
            placeholder="Digite sua mensagem..."
            required
          />

          <button
            type="submit"
            disabled={enviando}
          >
            {enviando
              ? "Enviando..."
              : "Enviar mensagem"}
          </button>

        </form>

      </section>

      <section className="rocam-messages-box">

        <div className="rocam-messages-tabs">

          <button
            className={
              aba === "recebidas"
                ? "active"
                : ""
            }
            onClick={() =>
              setAba(
                "recebidas"
              )
            }
          >
            Recebidas
          </button>

          <button
            className={
              aba === "enviadas"
                ? "active"
                : ""
            }
            onClick={() =>
              setAba(
                "enviadas"
              )
            }
          >
            Enviadas
          </button>

        </div>

        <div className="rocam-messages-list">

          {lista.map(
            (item) => (
              <article
                key={item._id}
              >

                <small>
                  {aba ===
                  "recebidas"
                    ? item.remetente
                        ?.nome
                    : item.destinatario
                        ?.nome}
                </small>

                <h3>
                  {item.assunto}
                </h3>

                <p>
                  {item.mensagem}
                </p>

              </article>
            )
          )}

        </div>

      </section>

    </div>
  );
}