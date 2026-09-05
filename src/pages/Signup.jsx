import { useState } from "react";
import api from "../api/api";
import { useToast } from "../contexts/ToastContext";
import "../styles/signup-premium.css";

export default function Signup() {
  const toast = useToast();

  const [nome, setNome] = useState("");
  const [funcional, setFuncional] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (
      !nome.trim() ||
      !funcional ||
      !email.trim()
    ) {
      toast.warning("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/signup", {
        nome: nome.trim(),
        funcional: Number(funcional),
        email: email.trim()
      });

      setEnviado(true);
      toast.success("Solicitação enviada com sucesso");

      setNome("");
      setFuncional("");
      setEmail("");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Erro ao enviar solicitação"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-page-bg" />

      <div className="signup-wrapper">

        {/* ===================================================
            FORMULÁRIO
        =================================================== */}

        <div className="signup-card">

          <div className="signup-top">

            <div className="signup-logo-wrap">
              <img
                src="/anchieta-logo.png"
                alt="2º BPChq Anchieta"
                className="signup-logo"
              />
            </div>

            <span className="signup-kicker">
              SOLICITAÇÃO INSTITUCIONAL
            </span>

            <h1>
              Solicitação de Cadastro
            </h1>

            <p>
              Preencha seus dados para enviar
              uma solicitação de acesso ao
              sistema institucional do 2º BPChq
              Anchieta.
            </p>

          </div>

          {enviado && (
            <div className="signup-success-box">

              <strong>
                Solicitação enviada com sucesso.
              </strong>

              <span>
                Sua solicitação foi registrada e
                ficará disponível para análise
                administrativa.
              </span>

            </div>
          )}

          <form onSubmit={submit}>

            <div className="signup-grid">

              <div className="signup-field full">

                <label>
                  Nome completo
                </label>

                <input
                  value={nome}
                  onChange={(e) =>
                    setNome(
                      e.target.value
                    )
                  }
                  placeholder="Digite seu nome completo"
                  autoComplete="name"
                  required
                />

              </div>

              <div className="signup-field">

                <label>
                  Funcional
                </label>

                <input
                  type="number"
                  value={funcional}
                  onChange={(e) =>
                    setFuncional(
                      e.target.value
                    )
                  }
                  placeholder="Digite sua funcional"
                  inputMode="numeric"
                  required
                />

              </div>

              <div className="signup-field">

                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="Digite seu email"
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="signup-btn"
              disabled={loading}
            >
              {loading
                ? "Enviando..."
                : "Enviar Solicitação"}
            </button>

          </form>

        </div>

        {/* ===================================================
            INFORMAÇÕES
        =================================================== */}

        <aside className="signup-side-card">

          <span className="signup-side-badge">
            ACESSO AO SISTEMA
          </span>

          <h2>
            Como funciona a solicitação
          </h2>

          <p className="signup-side-description">
            O cadastro no sistema depende de
            validação administrativa antes da
            liberação do acesso.
          </p>

          <div className="signup-steps">

            <div className="signup-step">

              <strong>
                1
              </strong>

              <span>
                Informe corretamente seu nome,
                funcional e email.
              </span>

            </div>

            <div className="signup-step">

              <strong>
                2
              </strong>

              <span>
                A solicitação será encaminhada
                para análise administrativa.
              </span>

            </div>

            <div className="signup-step">

              <strong>
                3
              </strong>

              <span>
                Após aprovação, seu cadastro será
                liberado para acesso ao sistema.
              </span>

            </div>

          </div>

          <div className="signup-side-footer">

            <small>
              2º BATALHÃO DE POLÍCIA DE CHOQUE
            </small>

            <strong>
              ANCHIETA
            </strong>

          </div>

        </aside>

      </div>
    </div>
  );
}