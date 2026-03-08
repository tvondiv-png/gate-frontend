import { useEffect, useState } from "react";
import api from "../../api/api";

export default function AbsencesAdmin() {
  const [list, setList] = useState([]);
  const [comentario, setComentario] = useState("");

  const load = async () => {
    const res = await api.get("/api/absences");
    setList(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const rejeitar = async (id) => {
    if (!comentario) {
      alert("Informe o comentário");
      return;
    }
    await api.post(`/api/absences/${id}/reject`, { comentario });
    setComentario("");
    load();
  };

  return (
    <div>
      <h2>Ausências Policiais</h2>

      <table border="1" width="100%">
        <thead>
          <tr>
            <th>Policial</th>
            <th>Período</th>
            <th>Dias</th>
            <th>Motivo</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {list.map(a => (
            <tr key={a._id}>
              <td>
                {a.policialSnapshot
                  ? `${a.policialSnapshot.funcional} - ${a.policialSnapshot.nome}`
                  : "—"}
              </td>
              <td>
                {new Date(a.dataInicio).toLocaleDateString()} até{" "}
                {new Date(a.dataFim).toLocaleDateString()}
              </td>
              <td>{a.dias}</td>
              <td>{a.motivo}</td>
              <td>{a.status}</td>
              <td>
                {a.status === "Pendente" && (
                  <>
                    <button onClick={() => api.post(`/api/absences/${a._id}/approve`).then(load)}>
                      Aprovar
                    </button>

                    <br />
                    <textarea
                      placeholder="Comentário para rejeição"
                      value={comentario}
                      onChange={e => setComentario(e.target.value)}
                    />
                    <button onClick={() => rejeitar(a._id)}>
                      Rejeitar
                    </button>
                  </>
                )}

                <hr />
                <button
                  style={{ color: "red" }}
                  onClick={() => {
                    if (window.confirm("Excluir esta ausência?")) {
                      api.delete(`/api/absences/${a._id}`).then(load);
                    }
                  }}
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
