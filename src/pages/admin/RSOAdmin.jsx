import { useEffect, useState } from "react";
import api from "../../api/api";

export default function RSOAdmin() {
  const [rsos, setRsos] = useState([]);

  const carregar = async () => {
    const res = await api.get("/api/admin/rso/pendentes");
    setRsos(res.data);
  };

  useEffect(() => {
    carregar();
  }, []);

  const aprovar = async (id) => {
    await api.post(`/admin/rso/aprovar/${id}`);
    carregar();
  };

  const rejeitar = async (id) => {
    const comentario = prompt("Motivo da rejeição:");
    if (!comentario) return;

    await api.post(`/admin/rso/rejeitar/${id}`, { comentario });
    carregar();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>RSOs Pendentes</h2>

      {rsos.length === 0 && <p>Nenhum RSO pendente.</p>}

      {rsos.map(rso => (
        <div
          key={rso._id}
          style={{ border: "1px solid #444", padding: 15, marginBottom: 20 }}
        >
          <strong>Viatura:</strong> {rso.viatura}<br />
          <strong>Criado em:</strong>{" "}
          {new Date(rso.createdAt).toLocaleString()}<br />

          <h4>Equipe</h4>

          {[rso.equipeFixa.chefe, rso.equipeFixa.auxiliar].map(p => (
            <div key={p.funcional}>
              {p.cargo} — {p.patente} {p.nome}
            </div>
          ))}

          <hr />

          <button onClick={() => aprovar(rso._id)}>✅ Aprovar</button>{" "}
          <button onClick={() => rejeitar(rso._id)}>❌ Rejeitar</button>
        </div>
      ))}
    </div>
  );
}
