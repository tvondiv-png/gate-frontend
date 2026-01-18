import { useEffect, useState } from "react";
import api from "../../api/api";

export default function SignupRequests() {
  const [requests, setRequests] = useState([]);
  const [comentario, setComentario] = useState("");

  const load = async () => {
    const res = await api.get("/api/signup");
    setRequests(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const aprovar = async (id) => {
    if (!confirm("Aprovar solicitação de cadastro?")) return;
    await api.put(`/signup/approve/${id}`);
    load();
  };

  const rejeitar = async (id) => {
    if (!comentario) {
      alert("Informe o motivo da rejeição.");
      return;
    }

    await api.put(`/signup/reject/${id}`, { comentario });
    setComentario("");
    load();
  };

  const excluir = async (id) => {
    if (!confirm("Excluir solicitação?")) return;
    await api.delete(`/signup/${id}`);
    load();
  };

  return (
    <div>
      <h1>Solicitações de Cadastro</h1>

      {requests.length === 0 && (
        <p>Nenhuma solicitação pendente.</p>
      )}

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
          {requests.map((r) => (
            <tr key={r._id}>
              <td>{r.funcional}</td>
              <td>{r.nome}</td>
              <td>{r.email}</td>
              <td>{r.status}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => aprovar(r._id)}>
                  Aprovar
                </button>{" "}

                <button onClick={() => rejeitar(r._id)}>
                  Rejeitar
                </button>{" "}

                <button onClick={() => excluir(r._id)}>
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <br />

      <textarea
        placeholder="Comentário para rejeição"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        rows={3}
        style={{ width: "100%" }}
      />
    </div>
  );
}
