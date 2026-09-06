import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useConfirm } from "../../contexts/ToastContext";
const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

const ROLE_LABELS = {
  user: "Usuário",
  admin: "Administrador",
  superadmin: "Superadministrador"
};

const roleBadge = (role) => {
  if (role === "superadmin") return "danger";
  if (role === "admin") return "info";
  return "success";
};

const temAcessoComando = (user) => {
  return (
    user?.role === "superadmin" ||
    user?.funcao === "Comando do Batalhão" ||
    user?.funcao === "Subcomando do Batalhão"
  );
};

export default function UserManagement() {
  const confirm = useConfirm();
  const [users, setUsers] = useState([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [processando, setProcessando] = useState(null);

  /* =========================================================
     CARREGAR USUÁRIOS
  ========================================================= */

  const loadUsers = async () => {
    try {
      setLoading(true);
      setErro("");

      const res = await api.get(
        "/api/superadmin/users"
      );

      setUsers(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar usuários:",
        err
      );

      setUsers([]);

      setErro(
        err?.response?.data?.message ||
          "Não foi possível carregar os usuários."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  /* =========================================================
     ORDENAR / FILTRAR
  ========================================================= */

  const usersOrdenados = useMemo(() => {
    const termo = busca
      .trim()
      .toLowerCase();

    const filtrados = users.filter((u) => {
      if (!termo) return true;

      const texto = [
        u.funcional,
        u.nome,
        u.patente,
        u.funcao,
        u.role,
        u.status
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });

    return [...filtrados].sort((a, b) => {
      const ordemA =
        ORDEM_PATENTES[a.patente] || 999;

      const ordemB =
        ORDEM_PATENTES[b.patente] || 999;

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      return String(
        a.nome || ""
      ).localeCompare(
        String(b.nome || ""),
        "pt-BR"
      );
    });
  }, [users, busca]);

  /* =========================================================
     ALTERAR ROLE
  ========================================================= */

  const updateRole = async (
    id,
    role,
    nome
  ) => {
    const label =
      ROLE_LABELS[role] || role;

    const confirmar = await confirm({ tone: "danger", message: `Deseja alterar o acesso de "${nome}" para ${label}?` });

    if (!confirmar) return;

    try {
      setProcessando(id);
      setErro("");

      await api.put(
        `/api/superadmin/users/${id}/role`,
        { role }
      );

      await loadUsers();
    } catch (err) {
      console.error(
        "Erro ao alterar permissão:",
        err
      );

      setErro(
        err?.response?.data?.message ||
          "Erro ao alterar permissão do usuário."
      );
    } finally {
      setProcessando(null);
    }
  };

  /* =========================================================
     EXCLUIR
  ========================================================= */

  const removeUser = async (
    id,
    nome
  ) => {
    const confirmar = await confirm({ tone: "danger", message: `Deseja realmente excluir o usuário "${nome}"?\n\nEsta ação deve ser utilizada somente quando o cadastro precisar ser removido do sistema.` });

    if (!confirmar) return;

    try {
      setProcessando(id);
      setErro("");

      await api.delete(
        `/api/superadmin/users/${id}`
      );

      await loadUsers();
    } catch (err) {
      console.error(
        "Erro ao excluir usuário:",
        err
      );

      setErro(
        err?.response?.data?.message ||
          "Erro ao excluir usuário."
      );
    } finally {
      setProcessando(null);
    }
  };

  /* =========================================================
     RESUMO
  ========================================================= */

  const resumo = useMemo(() => {
    return {
      total: users.length,

      usuarios:
        users.filter(
          (u) => u.role === "user"
        ).length,

      admins:
        users.filter(
          (u) => u.role === "admin"
        ).length,

      superadmins:
        users.filter(
          (u) =>
            u.role === "superadmin"
        ).length,

      comando:
        users.filter(
          (u) =>
            temAcessoComando(u)
        ).length
    };
  }, [users]);

  return (
    <div className="admin-module-page">

      {/* =====================================================
          CABEÇALHO
      ===================================================== */}

      <div className="admin-module-topbar">

        <div>
          <h1>
            Gestão de Usuários
          </h1>

          <p>
            Gerencie os níveis de acesso dos
            usuários cadastrados no sistema do
            2º BPChq Anchieta.
          </p>
        </div>

        <button
          type="button"
          className="admin-module-btn blue"
          onClick={loadUsers}
          disabled={loading}
        >
          {loading
            ? "Carregando..."
            : "↻ Recarregar"}
        </button>

      </div>

      {/* =====================================================
          ERRO
      ===================================================== */}

      {erro && (
        <div
          className="admin-module-alert danger"
          style={{
            marginBottom: 16
          }}
        >
          {erro}
        </div>
      )}

      {/* =====================================================
          RESUMO
      ===================================================== */}

      <section className="admin-module-summary-grid">

        <div className="admin-module-summary-card">
          <small>
            Total de usuários
          </small>

          <strong>
            {resumo.total}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>
            Usuários
          </small>

          <strong>
            {resumo.usuarios}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>
            Administradores
          </small>

          <strong>
            {resumo.admins}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>
            Superadministradores
          </small>

          <strong>
            {resumo.superadmins}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>
            Acesso ao Comando
          </small>

          <strong>
            {resumo.comando}
          </strong>
        </div>

      </section>

      {/* =====================================================
          LISTAGEM
      ===================================================== */}

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              Usuários cadastrados
            </h2>

            <span>
              Ordenação hierárquica por
              patente e nome.
            </span>
          </div>

        </div>

        {/* ===================================================
            BUSCA
        =================================================== */}

        <div
          style={{
            marginBottom: 16
          }}
        >
          <input
            type="text"
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
            placeholder="Buscar por nome, funcional, patente, função ou nível de acesso..."
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border:
                "1px solid rgba(255,255,255,0.10)",
              background:
                "rgba(2, 6, 23, 0.72)",
              color: "#fff",
              outline: "none"
            }}
          />
        </div>

        <div className="admin-module-table-wrap">

          <table className="admin-module-table">

            <thead>
              <tr>
                <th>
                  Funcional
                </th>

                <th>
                  Policial
                </th>

                <th>
                  Patente
                </th>

                <th>
                  Função
                </th>

                <th>
                  Nível de acesso
                </th>

                <th>
                  Comando
                </th>

                <th>
                  Status
                </th>

                <th>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>

              {usersOrdenados.map(
                (u) => {
                  const comando =
                    temAcessoComando(u);

                  const bloqueado =
                    processando === u._id;

                  return (
                    <tr key={u._id}>

                      <td>
                        {u.funcional ||
                          "-"}
                      </td>

                      <td>
                        <strong>
                          {u.nome ||
                            "-"}
                        </strong>
                      </td>

                      <td>
                        {u.patente ||
                          "-"}
                      </td>

                      <td>
                        {u.funcao ||
                          "Operacional"}
                      </td>

                      <td>
                        <span
                          className={`admin-module-badge ${roleBadge(
                            u.role
                          )}`}
                        >
                          {ROLE_LABELS[
                            u.role
                          ] ||
                            u.role ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        {comando ? (
                          <span className="admin-module-badge warning">
                            Autorizado
                          </span>
                        ) : (
                          <span
                            style={{
                              color:
                                "rgba(255,255,255,0.45)"
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      <td>
                        <span
                          className={`admin-module-badge ${
                            u.status ===
                            "Ativo"
                              ? "success"
                              : "warning"
                          }`}
                        >
                          {u.status ||
                            "-"}
                        </span>
                      </td>

                      <td>
                        <div
                          className="admin-module-actions"
                          style={{
                            marginTop: 0
                          }}
                        >

                          {u.role !==
                            "user" && (
                            <button
                              type="button"
                              className="admin-module-btn"
                              disabled={
                                bloqueado
                              }
                              onClick={() =>
                                updateRole(
                                  u._id,
                                  "user",
                                  u.nome
                                )
                              }
                            >
                              Tornar Usuário
                            </button>
                          )}

                          {u.role !==
                            "admin" && (
                            <button
                              type="button"
                              className="admin-module-btn blue"
                              disabled={
                                bloqueado
                              }
                              onClick={() =>
                                updateRole(
                                  u._id,
                                  "admin",
                                  u.nome
                                )
                              }
                            >
                              Tornar ADM
                            </button>
                          )}

                          {u.role !==
                            "superadmin" && (
                            <button
                              type="button"
                              className="admin-module-btn green"
                              disabled={
                                bloqueado
                              }
                              onClick={() =>
                                updateRole(
                                  u._id,
                                  "superadmin",
                                  u.nome
                                )
                              }
                            >
                              Tornar SuperADM
                            </button>
                          )}

                          <button
                            type="button"
                            className="admin-module-btn danger"
                            disabled={
                              bloqueado
                            }
                            onClick={() =>
                              removeUser(
                                u._id,
                                u.nome
                              )
                            }
                          >
                            {bloqueado
                              ? "Aguarde..."
                              : "Excluir"}
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                }
              )}

              {!loading &&
                usersOrdenados.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan="8"
                      style={{
                        textAlign:
                          "center",
                        padding: 24
                      }}
                    >
                      Nenhum usuário
                      encontrado.
                    </td>
                  </tr>
                )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =====================================================
          OBSERVAÇÃO DE SEGURANÇA
      ===================================================== */}

      <section className="admin-module-section">

        <div className="admin-module-section-title">
          <div>
            <h2>
              Controle de acesso
            </h2>

            <span>
              Regras atuais do sistema.
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 10,
            color:
              "rgba(255,255,255,0.72)",
            lineHeight: 1.6
          }}
        >
          <div>
            <strong>
              Usuário:
            </strong>{" "}
            acesso ao Painel do Policial.
          </div>

          <div>
            <strong>
              Administrador:
            </strong>{" "}
            acesso ao Painel Administrativo.
          </div>

          <div>
            <strong>
              Superadministrador:
            </strong>{" "}
            acesso administrativo total e ao
            Centro de Comando.
          </div>

          <div>
            <strong>
              Comando do Batalhão /
              Subcomando:
            </strong>{" "}
            o acesso ao Centro de Comando é
            definido pela função cadastrada na
            Hierarquia.
          </div>
        </div>

      </section>

    </div>
  );
}