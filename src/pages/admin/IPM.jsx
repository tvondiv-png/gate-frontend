import { useEffect, useState } from "react";
import api from "../../api/api";

export default function IPM() {
  const [ipms, setIpms] = useState([]);
  const [users, setUsers] = useState([]);
  const [descricao, setDescricao] = useState("");
  const [policialId, setPolicialId] = useState("");

  const load = async () => {
    const i = await api.get("/api/ipm");
    const u = await api.get("/api/superadmin/users");
    setIpms(i.data);
    setUsers(u.data);
  };

  useEffect(() => {
    load();
  }, []);

  const criar = async () => {
    await api.post("/api/ipm", { policialId, descricao });
    setDescricao("");
    setPolicialId("");
    load();
  };

  const status = async (id, status) => {
    await api.put(`/api/ipm/${id}/status`, { status });
    load();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>IPM – Inquérito Policial Militar</h2>

      <h3>Abrir IPM</h3>
      <select value={policialId} onChange={e => setPolicialId(e.target.value)}>
        <option value="">Selecione o policial</option>
        {users.map(u => (
          <option key={u._id} value={u._id}>
            {u.nome} ({u.funcional})
          </option>
        ))}
      </select>

      <br /><br />
      <textarea
        placeholder="Descrição do IPM"
        value={descricao}
        onChange={e => setDescricao(e.target.value)}
      />

      <br /><br />
      <button onClick={criar}>Abrir IPM</button>

      <hr />

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>p.numero</th>
            <th>Policial</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {ipms.map(i => (
            <tr key={i._id}>
              <td>{i.numero}</td>
              <td>{i.policial.nome} ({i.policial.funcional})</td>
              <td>{i.status}</td>
              <td>
                <button onClick={() => status(i._id, "Em Análise")}>Em Análise</button>
                <button onClick={() => status(i._id, "Encerrado")}>Encerrar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
