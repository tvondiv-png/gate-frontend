import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ChangePassword() {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const navigate = useNavigate();
  const { logout } = useAuth();

  const salvar = async () => {
    if (senha.length < 6) {
      alert("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (senha !== confirmar) {
      alert("As senhas não coincidem");
      return;
    }

    try {
      await api.put("/api/auth/change-password", { senha });

      alert("Senha alterada com sucesso. Faça login novamente.");
      logout();
      navigate("/entrar");
    } catch (err) {
      console.error("Erro ao alterar senha:", err);
      alert("Erro ao alterar senha");
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Alterar Senha</h2>
      <p>Por segurança, você precisa criar uma nova senha.</p>

      <input
        type="password"
        placeholder="Nova senha"
        value={senha}
        onChange={e => setSenha(e.target.value)}
      /><br /><br />

      <input
        type="password"
        placeholder="Confirmar senha"
        value={confirmar}
        onChange={e => setConfirmar(e.target.value)}
      /><br /><br />

      <button onClick={salvar}>Salvar nova senha</button>
    </div>
  );
}
