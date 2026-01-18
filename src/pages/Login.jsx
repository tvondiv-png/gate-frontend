import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./login.css";

export default function Login() {
  const [loginValue, setLoginValue] = useState("");
  const [senha, setSenha] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    try {
      const user = await login(loginValue, senha);

      // 🔐 PRIMEIRO LOGIN
      if (user.senhaPadrao) {
        navigate("/alterar-senha");
        return;
      }

      // 🎯 fluxo normal
      navigate("/select-panel");
    } catch (err) {
      alert("Login inválido");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h1>ACESSO AO SISTEMA</h1>
        <span className="login-sub">
          4º BPCHQ — GATE
        </span>

        <div className="login-field">
          <label>Email ou Funcional</label>
          <input
            value={loginValue}
            onChange={e => setLoginValue(e.target.value)}
          />
        </div>

        <div className="login-field">
          <label>Senha</label>
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
          />
        </div>

        <button className="login-btn" onClick={submit}>
          Entrar no Sistema
        </button>

      </div>
    </div>
  );
}
