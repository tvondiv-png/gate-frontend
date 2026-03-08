import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-base.css";

export default function RegulationsAdmin() {
  const [regs, setRegs] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    conteudo: "",
    publicado: false
  });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const res = await api.get("/api/regulations/admin");
    setRegs(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (editing) {
      await api.put(`/api/regulations/${editing}`, form);
    } else {
      await api.post("/api/regulations", form);
    }

    setForm({
      titulo: "",
      descricao: "",
      conteudo: "",
      publicado: false
    });
    setEditing(null);
    load();
  };

  const edit = (r) => {
    setEditing(r._id);
    setForm({
      titulo: r.titulo,
      descricao: r.descricao || "",
      conteudo: r.conteudo || "",
      publicado: r.publicado
    });
  };

  const remove = async (id) => {
    if (!window.confirm("Excluir regulamento?")) return;
    await api.delete(`/api/regulations/${id}`);
    load();
  };

  return (
    <div className="admin-page">
      <h1>Gerenciar Regulamentos</h1>

      {/* ===== FORM ===== */}
      <div className="admin-section">
        <h3>{editing ? "Editar Regulamento" : "Novo Regulamento"}</h3>

        <input
          placeholder="Título"
          value={form.titulo}
          onChange={e => setForm({ ...form, titulo: e.target.value })}
        />

        <input
          placeholder="Descrição"
          value={form.descricao}
          onChange={e => setForm({ ...form, descricao: e.target.value })}
        />

        <textarea
          placeholder="Conteúdo (opcional)"
          value={form.conteudo}
          onChange={e => setForm({ ...form, conteudo: e.target.value })}
          rows={6}
        />

        <label>
          <input
            type="checkbox"
            checked={form.publicado}
            onChange={e =>
              setForm({ ...form, publicado: e.target.checked })
            }
          />{" "}
          Publicado
        </label>

        <br /><br />

        <button className="admin-btn" onClick={submit}>
          {editing ? "Salvar Alterações" : "Criar Regulamento"}
        </button>

        {editing && (
          <button
            className="admin-btn"
            style={{ marginLeft: 10 }}
            onClick={() => {
              setEditing(null);
              setForm({
                titulo: "",
                descricao: "",
                conteudo: "",
                publicado: false
              });
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      {/* ===== LISTAGEM ===== */}
      <div className="admin-section">
        <h2>Regulamentos Cadastrados</h2>

        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Publicado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {regs.map(r => (
              <tr key={r._id}>
                <td>{r.titulo}</td>
                <td>{r.publicado ? "Sim" : "Não"}</td>
                <td>
                  <button className="admin-btn" onClick={() => edit(r)}>
                    Editar
                  </button>
                  <button
                    className="admin-btn danger"
                    onClick={() => remove(r._id)}
                    style={{ marginLeft: 10 }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
