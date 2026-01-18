import { useEffect, useState } from "react";
import api from "../../api/api";

export default function SeizuresAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/api/apreensoes/admin");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const zerar = async () => {
    if (!window.confirm("Deseja zerar TODAS as apreensões?")) return;

    setLoading(true);
    try {
      await api.post("/apreensoes/zerar");
      await load();
      alert("Apreensões zeradas com sucesso");
    } catch (err) {
      alert("Erro ao zerar apreensões");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Apreensões</h1>

      <button
        onClick={zerar}
        disabled={loading}
        style={{
          background: "darkred",
          color: "#fff",
          padding: "6px 12px",
          marginBottom: 20
        }}
      >
        {loading ? "Zerando..." : "Zerar Apreensões"}
      </button>

      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan="2" align="center">
                Nenhuma apreensão registrada
              </td>
            </tr>
          )}

          {items.map(item => (
            <tr key={item._id}>
              <td>{item.tipo}</td>
              <td>{item.quantidade}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
