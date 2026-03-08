import { useEffect, useState } from "react";
import api from "../../api/api";

export default function SignupRequests() {
  const [requests, setRequests] = useState([]);

  const load = async () => {
    const res = await api.get("/api/signup");
    setRequests(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const aprovar = async (id) => {
    if (!confirm("Aprovar solicitação?")) return;
    await api.put(`/api/signup/approve/${id}`);
    load();
  };

  const rejeitar = async (id) => {
    if (!confirm("Rejeitar solicitação?")) return;
    await api.put(`/api/signup/reject/${id}`);
    load();
  };

  const excluir = async (id) => {
    if (!confirm("Excluir definitivamente esta solicitação?")) return;
    await api.delete(`/api/signup/${id}`);
    load();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Solicitações de Cadastro</h1>

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Funcional</th>
            <th>Nome</th>
            <th>Email</th>
            <th>Status</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {requests.map(r => (
            <tr key={r._id}>
              <td>{r.funcional}</td>
              <td>{r.nome}</td>
              <td>{r.email}</td>
              <td>{r.status}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td>
                {r.status === "Pendente" && (
                  <>
                    <button onClick={() => aprovar(r._id)}>Aprovar</button>{" "}
                    <button onClick={() => rejeitar(r._id)}>Rejeitar</button>{" "}
                  </>
                )}

                <button
                  style={{ background: "darkred", color: "#fff" }}
                  onClick={() => excluir(r._id)}
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
