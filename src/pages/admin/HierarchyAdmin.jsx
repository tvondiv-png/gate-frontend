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

const CATEGORIAS = [
  { value: "OFICIAIS_SUPERIORES", label: "Oficiais Superiores" },
  { value: "OFICIAIS_INTERMEDIARIOS", label: "Oficiais Intermediários" },
  { value: "OFICIAIS_SUBALTERNOS", label: "Oficiais Subalternos" },
  { value: "PRACAS_ESPECIAIS", label: "Praças Especiais" },
  { value: "PRACAS_GRADUADAS", label: "Praças Graduadas" },
  { value: "PRACAS", label: "Praças" },
  { value: "ESTAGIARIOS", label: "Estagiarios" }
];

// ============================
// COMPONENTE
// ============================
export default function HierarchyAdmin() {
  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    patente: "",
    funcao: "",
    status: "",
    categoriaHierarquia: "",
    dataEntrada: "",
    dataUltimaPromocao: "",
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
    setEditando(p._id);
    setForm({
      nome: p.nome || "",
      patente: p.patente || "",
      funcao: p.funcao || "",
      status: p.status || "",
      categoriaHierarquia: p.categoriaHierarquia || "",
      dataEntrada: p.dataEntrada ? p.dataEntrada.substring(0, 10) : "",
      dataUltimaPromocao: p.dataUltimaPromocao
        ? p.dataUltimaPromocao.substring(0, 10)
        : "",
      cursos: Array.isArray(p.cursos) ? p.cursos : [],
      medalhas: Array.isArray(p.medalhas) ? p.medalhas : []
    });
  };

  const toggleItem = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const salvar = async () => {
    await api.put(`/api/hierarchy/${editando}`, form);
    setEditando(null);
    load();
  };

  const excluir = async (id) => {
    if (!window.confirm("Excluir policial da hierarquia?")) return;
    await api.delete(`/api/hierarchy/${id}`);
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
            <th>Categoria</th>
            <th>Patente</th>
            <th>Função</th>
            <th>Status</th>
            <th>Entrada</th>
            <th>Última Promoção</th>
            <th>Cursos</th>
            <th>Medalhas</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {lista.map(p => (
            <tr key={p._id}>
              <td>{p.funcional}</td>

              <td>
                {editando === p._id ? (
                  <input
                    value={form.nome}
                    onChange={e =>
                      setForm({ ...form, nome: e.target.value })
                    }
                  />
                ) : (
                  p.nome
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <select
                    value={form.categoriaHierarquia}
                    onChange={e =>
                      setForm({
                        ...form,
                        categoriaHierarquia: e.target.value
                      })
                    }
                  >
                    {CATEGORIAS.map(c => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  p.categoriaHierarquia || "-"
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <select
                    value={form.patente}
                    onChange={e =>
                      setForm({ ...form, patente: e.target.value })
                    }
                  >
                    {PATENTES.map(pt => (
                      <option key={pt}>{pt}</option>
                    ))}
                  </select>
                ) : (
                  p.patente
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <select
                    value={form.funcao}
                    onChange={e =>
                      setForm({ ...form, funcao: e.target.value })
                    }
                  >
                    {FUNCOES.map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  p.funcao
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <select
                    value={form.status}
                    onChange={e =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option>Ativo</option>
                    <option>Ausente</option>
                    <option>Afastado</option>
                  </select>
                ) : (
                  p.status
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <input
                    type="date"
                    value={form.dataEntrada}
                    onChange={e =>
                      setForm({
                        ...form,
                        dataEntrada: e.target.value
                      })
                    }
                  />
                ) : (
                  p.dataEntrada
                    ? new Date(p.dataEntrada).toLocaleDateString("pt-BR")
                    : "-"
                )}
              </td>

              <td>
                {editando === p._id ? (
                  <input
                    type="date"
                    value={form.dataUltimaPromocao}
                    onChange={e =>
                      setForm({
                        ...form,
                        dataUltimaPromocao: e.target.value
                      })
                    }
                  />
                ) : (
                  p.dataUltimaPromocao
                    ? new Date(p.dataUltimaPromocao).toLocaleDateString("pt-BR")
                    : "-"
                )}
              </td>

              <td>{p.cursos?.length || 0}</td>
              <td>{p.medalhas?.length || 0}</td>

              <td>
                {editando === p._id ? (
                  <>
                    <strong>Cursos</strong>
                    {CURSOS.map(c => (
                      <label key={c} style={{ display: "block" }}>
                        <input
                          type="checkbox"
                          checked={form.cursos.includes(c)}
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
                          checked={form.medalhas.includes(m)}
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
