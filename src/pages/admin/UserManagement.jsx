import { useEffect, useState } from "react";
import api from "../../api/api";

export default function UserManagement() {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    const res = await api.get("/api/superadmin/users");
    setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const updateRole = async (id, role) => {
    await api.put(`/superadmin/users/${id}/role`, { role });
    loadUsers();
  };

  const removeUser = async (id) => {
    if (!window.confirm("Deseja excluir este usuário?")) return;
    await api.delete(`/superadmin/users/${id}`);
    loadUsers();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Gestão de Usuários (SuperAdmin)</h2>

      <table width="100%" cellPadding="8" border="1">
        <thead>
          <tr>
            <th>Funcional</th>
            <th>Nome</th>
            <th>Patente</th>
            <th>Role</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {users.map(u => (
            <tr key={u._id}>
              <td>{u.funcional}</td>
              <td>{u.nome}</td>
              <td>{u.patente}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                {u.role !== "user" && (
                  <button onClick={() => updateRole(u._id, "user")}>
                    Rebaixar p/ User
                  </button>
                )}

                {u.role !== "admin" && (
                  <button onClick={() => updateRole(u._id, "admin")}>
                    Tornar Admin
                  </button>
                )}

                {u.role !== "superadmin" && (
                  <button onClick={() => updateRole(u._id, "superadmin")}>
                    Tornar SuperAdmin
                  </button>
                )}

                <button
                  style={{ color: "red" }}
                  onClick={() => removeUser(u._id)}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
