import { useEffect, useState } from "react";
import api from "../../api/api";

// ============================
// CONSTANTES
// ============================
const PATENTES = [
  "Coronel PM",
  "Tenente-Coronel PM",
  "Major PM",
  "Capitão PM",
  "1º Tenente PM",
  "2º Tenente PM",
  "Aspirante a Oficial PM",
  "Subtenente PM",
  "1º Sargento PM",
  "2º Sargento PM",
  "3º Sargento PM",
  "Cabo PM",
  "Soldado 1ª Classe PM",
  "Soldado 2ª Classe PM"
];

const FUNCOES = [
  "Comando do Batalhão",
  "Subcomando do Batalhão",
  "Coordenador Geral",
  "Coordenador Operacional",
  "Coordenador Administrativo",
  "Recursos Humanos",
  "Setor Justiça e Disciplina",
  "Comunicação Social",
  "Operacional"
];

const CURSOS = [
  "Curso Tático",
  "SAT-B",
  "Escola ESSgt",
  "Academia Barro Branco",
  "Tiro Básico",
  "Tiro Avançado",
  "POP",
  "Curso de Abordagem"
];

const MEDALHAS = [
  "Láurea do Mérito Pessoal – 5º Grau",
  "Láurea do Mérito Pessoal – 4º Grau",
  "Láurea do Mérito Pessoal – 3º Grau",
  "Láurea do Mérito Pessoal – 2º Grau",
  "Láurea do Mérito Pessoal – 1º Grau"
];

// ============================
// COMPONENTE
// ============================
export default function HierarchyAdmin() {
  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({
    patente: "",
    funcao: "",
    status: "",
    cursos: [],
    medalhas: []
  });

  const load = async () => {
    try {
      const res = await api.get("/api/hierarchy");
      setLista(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar hierarquia:", err);
      setLista([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const editar = (p) => {
    if (!p) return;

    setEditando(p._id);
    setForm({
      patente: p.patente || "",
      funcao: p.funcao || "",
      status: p.status || "",
      cursos: Array.isArray(p.cursos) ? p.cursos : [],
      medalhas: Array.isArray(p.medalhas) ? p.medalhas : []
    });
  };

  const toggleItem = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field]?.includes(value)
        ? prev[field].filter(v => v !== value)
        : [...(prev[field] || []), value]
    }));
  };

  const salvar = async () => {
    await api.put(`/hierarchy/${editando}`, form);
    setEditando(null);
    load();
  };

  const excluir = async (id) => {
    if (!window.confirm("Excluir policial da hierarquia?")) return;
    await api.delete(`/hierarchy/${id}`);
    load();
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Hierarquia – Administração</h1>

      <table width="100%" border="1" cellPadding="8">
        <thead>
          <tr>
            <th>Funcional</th>
            <th>Nome</th>
            <th>Patente</th>
            <th>Função</th>
            <th>Status</th>
            <th>Cursos</th>
            <th>Medalhas</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {Array.isArray(lista) && lista.map(p => (
            <tr key={p._id}>
              <td>{p?.funcional ?? "-"}</td>
              <td>{p?.nome ?? "-"}</td>

              <td>
                {editando === p._id ? (
                  <select
                    value={form.patente || ""}
                    onChange={e =>
                      setForm({ ...form, patente: e.target.value })
                    }
                  >
                    {PATENTES.map(pt => (
                      <option key={pt}>{pt}</option>
                    ))}
                  </select>
                ) : (
                  p?.patente ?? "-"
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <select
                    value={form.funcao || ""}
                    onChange={e =>
                      setForm({ ...form, funcao: e.target.value })
                    }
                  >
                    {FUNCOES.map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  p?.funcao ?? "-"
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <select
                    value={form.status || ""}
                    onChange={e =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option>Ativo</option>
                    <option>Ausente</option>
                    <option>Afastado</option>
                  </select>
                ) : (
                  p?.status ?? "-"
                )}
              </td>

              <td title={p?.cursos?.join(", ")}>
                {p?.cursos?.length || 0}
              </td>

              <td title={p?.medalhas?.join(", ")}>
                {p?.medalhas?.length || 0}
              </td>

              <td>
                {editando === p._id ? (
                  <>
                    <strong>Cursos</strong>
                    {CURSOS.map(c => (
                      <label key={c} style={{ display: "block" }}>
                        <input
                          type="checkbox"
                          checked={form.cursos?.includes(c) || false}
                          onChange={() => toggleItem("cursos", c)}
                        />
                        {c}
                      </label>
                    ))}

                    <strong>Medalhas</strong>
                    {MEDALHAS.map(m => (
                      <label key={m} style={{ display: "block" }}>
                        <input
                          type="checkbox"
                          checked={form.medalhas?.includes(m) || false}
                          onChange={() => toggleItem("medalhas", m)}
                        />
                        {m}
                      </label>
                    ))}

                    <button onClick={salvar}>Salvar</button>
                    <button onClick={() => setEditando(null)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => editar(p)}>Editar</button>
                    <button onClick={() => excluir(p._id)}>Excluir</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
