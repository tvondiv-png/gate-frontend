import { useState } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export default function ChangePassword() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const navigate = useNavigate();
  const { logout } = useAuth();
  const toast = useToast();

  const salvar = async () => {
    if (!senhaAtual) {
      toast.warning("Informe a senha atual");
      return;
    }

    if (senha.length < 6) {
      toast.warning("A nova senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (senha !== confirmar) {
      toast.warning("As senhas não coincidem");
      return;
    }

    try {
      await api.put("/api/auth/change-password", { senhaAtual, senha });

      toast.success("Senha alterada. Faça login novamente.");
      logout();
      navigate("/entrar");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Erro ao alterar senha"
      );
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
