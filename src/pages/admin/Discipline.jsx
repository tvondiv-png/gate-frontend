import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-base.css";

export default function Discipline() {
  const [procedimentos, setProcedimentos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [ipmSelecionado, setIpmSelecionado] = useState(null);

  const [form, setForm] = useState({
    policialId: "",
    descricaoInicial: ""
  });

  const [comentario, setComentario] = useState("");
  const [convocacao, setConvocacao] = useState("");
  const [conclusao, setConclusao] = useState("");
  const [sancoes, setSancoes] = useState("");

  const load = async (manterSelecionado = false) => {
    try {
      const [casesRes, usersRes] = await Promise.all([
        api.get("/api/discipline"),
        api.get("/api/superadmin/users")
      ]);

      setProcedimentos(Array.isArray(casesRes.data) ? casesRes.data : []);
      setUsuarios(Array.isArray(usersRes.data) ? usersRes.data : []);

      if (manterSelecionado && ipmSelecionado) {
        const atualizado = casesRes.data.find(
          c => c._id === ipmSelecionado._id
        );
        if (atualizado) setIpmSelecionado(atualizado);
      }
    } catch (err) {
      console.error("Erro ao carregar disciplina:", err);
      setProcedimentos([]);
      setUsuarios([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const criarProcedimento = async () => {
    if (!form.policialId || !form.descricaoInicial) {
      alert("Selecione o policial e preencha a descrição");
      return;
    }

    await api.post("/api/discipline", {
      policialId: form.policialId,
      tipo: "Investigação",
      descricao: form.descricaoInicial
    });

    setForm({ policialId: "", descricaoInicial: "" });
    load();
  };

  const excluirCaso = async () => {
    if (!window.confirm("Deseja excluir este processo?")) return;
    await api.delete(`/api/discipline/${ipmSelecionado._id}`);
    setIpmSelecionado(null);
    load();
  };

  return (
    <div className="admin-page">
      <h1>Justiça & Disciplina</h1>

      {/* ===== NOVO PROCESSO ===== */}
      <div className="admin-section">
        <h3>Novo Processo</h3>

        <select
          value={form.policialId}
          onChange={e =>
            setForm({ ...form, policialId: e.target.value })
          }
        >
          <option value="">Selecione o policial</option>
          {usuarios.map(u => (
            <option key={u._id} value={u._id}>
              {u.funcional} - {u.nome} ({u.patente})
            </option>
          ))}
        </select>

        <textarea
          placeholder="Descrição inicial"
          value={form.descricaoInicial}
          onChange={e =>
            setForm({ ...form, descricaoInicial: e.target.value })
          }
        />

        <button className="admin-btn" onClick={criarProcedimento}>
          Criar Processo
        </button>
      </div>

      {/* ===== LISTA ===== */}
      <div className="admin-section">
        <h3>Processos Registrados</h3>

        <table>
          <thead>
            <tr>
              <th>Policial</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>

          <tbody>
            {procedimentos.map(p => (
              <tr
                key={p._id}
                className={
                  ipmSelecionado && ipmSelecionado._id === p._id
                    ? "selected-row"
                    : ""
                }
              >
                <td>
                  {p.policial
                    ? `${p.policial.funcional} - ${p.policial.nome}`
                    : "⚠️ Policial removido"}
                </td>

                <td>{p.status}</td>

                <td>
                  <button
                    className="admin-btn"
                    onClick={() => setIpmSelecionado(p)}
                  >
                    Gerenciar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ===== GERENCIAMENTO ===== */}
      {ipmSelecionado && (
        <div className="admin-section">
          <h3>Gerenciando Processo</h3>

          {/* COMENTÁRIOS */}
          <h4>Comentários</h4>
          {ipmSelecionado.comentarios?.map((c, i) => (
            <div key={i} className="admin-card">
              <small>{new Date(c.createdAt).toLocaleString()}</small>
              <p>{c.texto}</p>
            </div>
          ))}

          <textarea
            value={comentario}
            onChange={e => setComentario(e.target.value)}
          />

          <button
            className="admin-btn"
            onClick={async () => {
              await api.post(
                `/api/discipline/${ipmSelecionado._id}/comentario`,
                { texto: comentario }
              );
              setComentario("");
              load(true);
            }}
          >
            Adicionar Comentário
          </button>

          {/* CONVOCAÇÃO */}
          <h4>Convocações</h4>
          {ipmSelecionado.convocacoes?.map((c, i) => (
            <div key={i} className="admin-card">
              📣 {c.mensagem} —{" "}
              {new Date(c.createdAt).toLocaleString()}
            </div>
          ))}

          <textarea
            value={convocacao}
            onChange={e => setConvocacao(e.target.value)}
          />

          <button
            className="admin-btn"
            onClick={async () => {
              await api.post(
                `/api/discipline/${ipmSelecionado._id}/convocar`,
                { mensagem: convocacao }
              );
              setConvocacao("");
              load(true);
            }}
          >
            Enviar Convocação
          </button>

          {/* CONCLUSÃO */}
          <h4>Conclusão</h4>
          {ipmSelecionado.conclusao ? (
            <div className="admin-card">
              <p>{ipmSelecionado.conclusao.texto}</p>
              <p>{ipmSelecionado.conclusao.sancoes}</p>
            </div>
          ) : (
            <>
              <textarea
                placeholder="Conclusão"
                value={conclusao}
                onChange={e => setConclusao(e.target.value)}
              />
              <textarea
                placeholder="Sanções"
                value={sancoes}
                onChange={e => setSancoes(e.target.value)}
              />

              <button
                className="admin-btn"
                onClick={async () => {
                  await api.post(
                    `/api/discipline/${ipmSelecionado._id}/concluir`,
                    { conclusao, sancoes }
                  );
                  setConclusao("");
                  setSancoes("");
                  load(true);
                }}
              >
                Concluir Processo
              </button>
            </>
          )}

          <hr />

          <button
            className="admin-btn danger"
            onClick={excluirCaso}
          >
            Excluir Processo
          </button>
        </div>
      )}
    </div>
  );
}
