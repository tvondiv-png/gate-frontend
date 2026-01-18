import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/panel-sections.css";

export default function IndicationUser() {
  const [form, setForm] = useState({
    idPersonagem: "",
    nomePersonagem: "",
    idadeReal: "",
    cnh: "",
    discordId: ""
  });

  const [indications, setIndications] = useState([]);
  const [loading, setLoading] = useState(false);

  // carregar minhas indicações
  const loadIndications = async () => {
    const res = await api.get("/api/indications/minhas");
    setIndications(res.data);
  };

  useEffect(() => {
    loadIndications();
  }, []);

  // enviar formulário
  const submit = async () => {
    if (
      !form.idPersonagem ||
      !form.nomePersonagem ||
      !form.idadeReal ||
      !form.cnh ||
      !form.discordId
    ) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      await api.post("/indications", form);

      setForm({
        idPersonagem: "",
        nomePersonagem: "",
        idadeReal: "",
        cnh: "",
        discordId: ""
      });

      loadIndications();
      alert("Indicação enviada com sucesso");
    } catch (err) {
      alert("Erro ao enviar indicação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-section">
      <h2>Indicações</h2>

      {/* ===== FORMULÁRIO ===== */}
      <input
        className="panel-input"
        placeholder="ID do Personagem"
        value={form.idPersonagem}
        onChange={e =>
          setForm({ ...form, idPersonagem: e.target.value })
        }
      />

      <input
        className="panel-input"
        placeholder="Nome do Personagem"
        value={form.nomePersonagem}
        onChange={e =>
          setForm({ ...form, nomePersonagem: e.target.value })
        }
      />

      <input
        className="panel-input"
        type="number"
        placeholder="Idade Real"
        value={form.idadeReal}
        onChange={e =>
          setForm({ ...form, idadeReal: e.target.value })
        }
      />

      <input
        className="panel-input"
        placeholder="CNH (A/B/C/D/E)"
        value={form.cnh}
        onChange={e =>
          setForm({ ...form, cnh: e.target.value.toUpperCase() })
        }
      />

      <input
        className="panel-input"
        placeholder="ID do Discord"
        value={form.discordId}
        onChange={e =>
          setForm({ ...form, discordId: e.target.value })
        }
      />

      <button className="panel-btn" onClick={submit} disabled={loading}>
        {loading ? "Enviando..." : "Enviar Indicação"}
      </button>

      {/* ===== LISTA ===== */}
      <h2 style={{ marginTop: 40 }}>Minhas Indicações</h2>

      <div className="panel-card">
        <table width="100%" cellPadding="10">
          <thead>
            <tr>
              <th>Personagem</th>
              <th>Status</th>
              <th>Comentário</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {indications.length === 0 && (
              <tr>
                <td colSpan="4" align="center">
                  Nenhuma indicação enviada
                </td>
              </tr>
            )}

            {indications.map(ind => (
              <tr key={ind._id}>
                <td>{ind.nomePersonagem}</td>
                <td>{ind.status}</td>
                <td>
                  {ind.status === "Rejeitado"
                    ? ind.comentarioAdmin
                    : "-"}
                </td>
                <td>
                  {new Date(ind.createdAt).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
