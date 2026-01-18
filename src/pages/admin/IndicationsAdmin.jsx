import { useEffect, useState } from "react";
import api from "../../api/api";

export default function IndicationsAdmin() {
  const [indications, setIndications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);

  const loadIndications = async () => {
    const res = await api.get("/api/admin/indications");
    setIndications(res.data);
  };

  useEffect(() => {
    loadIndications();
  }, []);

  const approve = async (id) => {
    if (!window.confirm("Deseja aprovar esta indicação?")) return;

    setLoading(true);
    try {
      await api.post(`/admin/indications/${id}/aprovar`);
      setSelected(null);
      loadIndications();
    } catch (err) {
      alert("Erro ao aprovar indicação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reject = async (id) => {
    if (!comentario) {
      alert("Informe o motivo da rejeição");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/admin/indications/${id}/rejeitar`, {
        comentario
      });
      setComentario("");
      setSelected(null);
      loadIndications();
    } catch (err) {
      alert("Erro ao rejeitar indicação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Indicações</h1>

      {/* LISTA */}
      <table border="1" cellPadding="8" width="100%">
        <thead>
          <tr>
            <th>Personagem</th>
            <th>Enviado por</th>
            <th>Status</th>
            <th>Data</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {indications.length === 0 && (
            <tr>
              <td colSpan="5" align="center">
                Nenhuma indicação encontrada
              </td>
            </tr>
          )}

          {indications.map(ind => (
            <tr key={ind._id}>
              <td>{ind.nomePersonagem}</td>
              <td>
                {ind.criadoPor?.nome} ({ind.criadoPor?.email})
              </td>
              <td>{ind.status}</td>
              <td>
                {new Date(ind.createdAt).toLocaleDateString("pt-BR")}
              </td>
              <td>
                <button onClick={() => setSelected(ind)}>
                  Ver
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* DETALHE */}
      {selected && (
        <div
          style={{
            background: "#fff",
            padding: 20,
            marginTop: 30,
            borderRadius: 6
          }}
        >
          <h3>Detalhes da Indicação</h3>

          <p><strong>ID Personagem:</strong> {selected.idPersonagem}</p>
          <p><strong>Nome Personagem:</strong> {selected.nomePersonagem}</p>
          <p><strong>Idade Real:</strong> {selected.idadeReal}</p>
          <p><strong>CNH:</strong> {selected.cnh}</p>
          <p><strong>ID Discord:</strong> {selected.discordId}</p>

          <p>
            <strong>Enviado por:</strong>{" "}
            {selected.criadoPor?.nome} ({selected.criadoPor?.email})
          </p>

          <p><strong>Status:</strong> {selected.status}</p>

          {selected.status === "Pendente" && (
            <>
              <hr />

              <button
                onClick={() => approve(selected._id)}
                disabled={loading}
              >
                Aprovar
              </button>{" "}

              <button
                onClick={() => reject(selected._id)}
                disabled={loading}
                style={{ background: "darkred", color: "#fff" }}
              >
                Rejeitar
              </button>

              <br /><br />

              <textarea
                placeholder="Motivo da rejeição (obrigatório)"
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                style={{ width: "100%", minHeight: 80 }}
              />
            </>
          )}

          {selected.status === "Rejeitado" && (
            <p>
              <strong>Motivo da rejeição:</strong>{" "}
              {selected.comentarioAdmin}
            </p>
          )}

          <br />

          <button onClick={() => setSelected(null)}>
            Fechar
          </button>
        </div>
      )}
    </div>
  );
}
