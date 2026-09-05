import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedComandoRoute({ children }) {
  const { user, loading } = useAuth();

  /* =========================================
     AGUARDANDO AUTENTICAÇÃO
  ========================================= */

  if (loading) {
    return null;
  }

  /* =========================================
     NÃO LOGADO
  ========================================= */

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /* =========================================
     SUPERADMIN

     Superadmin sempre possui acesso.
  ========================================= */

  const isSuperAdmin =
    user.role === "superadmin";

  /* =========================================
     COMANDO DO BATALHÃO

     A autorização vem da FUNÇÃO registrada
     na hierarquia.

     ADMIN comum NÃO entra.
     ROLE "comando" sozinho NÃO entra.
  ========================================= */

  const isComandoBatalhao =
    user.funcao ===
    "Comando do Batalhão";

  const isSubcomandoBatalhao =
    user.funcao ===
    "Subcomando do Batalhão";

  /* =========================================
     AUTORIZAÇÃO FINAL
  ========================================= */

  const podeAcessarComando =
    isSuperAdmin ||
    isComandoBatalhao ||
    isSubcomandoBatalhao;

  /* =========================================
     SEM PERMISSÃO
  ========================================= */

  if (!podeAcessarComando) {
    return (
      <Navigate
        to="/select-panel"
        replace
      />
    );
  }

  /* =========================================
     AUTORIZADO
  ========================================= */

  return children;
}