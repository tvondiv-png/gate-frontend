import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ChangePassword() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const navigate = useNavigate();
  const { logout } = useAuth();

  const salvar = async () => {
    if (!senhaAtual) {
      alert("Informe a senha atual");
      return;
    }

    if (senha.length < 6) {
      alert("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (senha !== confirmar) {
      alert("As senhas não coincidem");
      return;
    }

    try {
      await api.put("/api/auth/change-password", { senhaAtual, senha });

      alert("Senha alterada com sucesso. Faça login novamente.");
      logout();
      navigate("/entrar");
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Erro ao alterar senha";
      alert(msg);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Alterar Senha</h2>
      <p>Por segurança, você precisa criar uma nova senha.</p>

      <input
        type="password"
        placeholder="Senha atual"
        value={senhaAtual}
        onChange={e => setSenhaAtual(e.target.value)}
      /><br /><br />

      <input
        type="password"
        placeholder="Nova senha"
        value={senha}
        onChange={e => setSenha(e.target.value)}
      /><br /><br />

      <input
        type="password"
        placeholder="Confirmar nova senha"
        value={confirmar}
        onChange={e => setConfirmar(e.target.value)}
      /><br /><br />

      <button onClick={salvar}>Salvar nova senha</button>
    </div>
  );
}
