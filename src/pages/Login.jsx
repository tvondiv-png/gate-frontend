import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import "./login.css";

export default function Login() {
  const [loginValue, setLoginValue] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const submit = async (e) => {
    e?.preventDefault();

    if (!loginValue || !senha) {
      toast.warning("Preencha login e senha");
      return;
    }

    try {
      setLoading(true);

      const user = await login(
        loginValue,
        senha
      );

      if (user?.senhaPadrao) {
        navigate("/alterar-senha");
        return;
      }

      navigate("/select-panel");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Login ou senha inválidos"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-bg-grid" />

      <div className="login-glow login-glow-one" />
      <div className="login-glow login-glow-two" />

      <main className="login-shell">

        {/* ===================================================
            IDENTIDADE
        =================================================== */}

        <section className="login-institution">

          <div className="login-institution-content">

            <img
              src="/anchieta-logo.png"
              alt="2º BPChq Anchieta"
              className="login-main-logo"
            />

            <span className="login-institution-kicker">
              POLÍCIA MILITAR
            </span>

            <h1>
              2º BPChq
            </h1>

            <strong>
              Anchieta
            </strong>

            <p>
              Sistema institucional de gestão,
              controle operacional e
              acompanhamento administrativo.
            </p>

          </div>

          <div className="login-institution-footer">

            <span>
              Acesso restrito
            </span>

            <small>
              Ambiente operacional institucional
            </small>

          </div>

        </section>

        {/* ===================================================
            LOGIN
        =================================================== */}

        <section className="login-card">

          <div className="login-card-header">

            <div className="login-mobile-logo-wrap">
              <img
                src="/anchieta-logo.png"
                alt="2º BPChq Anchieta"
                className="login-mobile-logo"
              />
            </div>

            <span className="login-kicker">
              ACESSO AO SISTEMA
            </span>

            <h2>
              Identificação
            </h2>

            <p>
              Informe suas credenciais para
              continuar.
            </p>

          </div>

          <form
            onSubmit={submit}
            className="login-form"
          >

            <div className="login-field">

              <label>
                Email ou funcional
              </label>

              <div className="login-input-wrap">

                <span className="login-input-icon">
                  👤
                </span>

                <input
                  value={loginValue}
                  onChange={(e) =>
                    setLoginValue(
                      e.target.value
                    )
                  }
                  placeholder="Digite seu email ou funcional"
                  autoComplete="username"
                />

              </div>

            </div>

            <div className="login-field">

              <label>
                Senha
              </label>

              <div className="login-input-wrap">

                <span className="login-input-icon">
                  🔒
                </span>

                <input
                  type="password"
                  value={senha}
                  onChange={(e) =>
                    setSenha(
                      e.target.value
                    )
                  }
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />

              </div>

            </div>

            <button
              className="login-btn"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Autenticando..."
                : "Entrar no sistema"}
            </button>

          </form>

          <div className="login-footer-text">

            <span className="login-security-dot" />

            Ambiente protegido para uso
            operacional e administrativo do
            2º BPChq Anchieta.

          </div>

        </section>

      </main>

    </div>
  );
}