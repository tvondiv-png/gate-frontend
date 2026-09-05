import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

export default function ComandoAltoComando() {
  const [items, setItems] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipoDestino, setTipoDestino] = useState("todos");
  const [funcao, setFuncao] = useState("");
  const [patente, setPatente] = useState("");
  const [funcionais, setFuncionais] = useState("");

  const carregar = async () => {
    try {
      const res = await api.get("/api/high-command-notices");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar comunicados do alto comando:", err);
      setItems([]);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const criar = async () => {
    try {
      await api.post("/api/high-command-notices", {
        titulo,
        mensagem,
        tipoDestino,
        funcao,
        patente,
        funcionais:
          tipoDestino === "funcionais"
            ? funcionais.split(",").map((x) => Number(x.trim())).filter(Boolean)
            : []
      });

      setTitulo("");
      setMensagem("");
      setTipoDestino("todos");
      setFuncao("");
      setPatente("");
      setFuncionais("");
      carregar();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao criar comunicado");
    }
  };

  const encerrar = async (id) => {
    try {
      await api.patch(`/api/high-command-notices/${id}/deactivate`);
      carregar();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao encerrar comunicado");
    }
  };

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Comando • Alto Comando</h1>
          <p>Comunicados prioritários exibidos no painel do usuário.</p>
        </div>
      </div>

      <section className="admin-module-section">
        <div className="admin-module-grid">
          <input
            className="admin-module-input"
            placeholder="Título"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={tipoDestino}
            onChange={(e) => setTipoDestino(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="funcao">Por função</option>
            <option value="patente">Por patente</option>
            <option value="funcionais">Por funcionais</option>
          </select>
        </div>

        {tipoDestino === "funcao" && (
          <div style={{ marginTop: 12 }}>
            <input
              className="admin-module-input"
              placeholder="Função"
              value={funcao}
              onChange={(e) => setFuncao(e.target.value)}
            />
          </div>
        )}

        {tipoDestino === "patente" && (
          <div style={{ marginTop: 12 }}>
            <input
              className="admin-module-input"
              placeholder="Patente"
              value={patente}
              onChange={(e) => setPatente(e.target.value)}
            />
          </div>
        )}

        {tipoDestino === "funcionais" && (
          <div style={{ marginTop: 12 }}>
            <input
              className="admin-module-input"
              placeholder="Funcionais separados por vírgula"
              value={funcionais}
              onChange={(e) => setFuncionais(e.target.value)}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <textarea
            className="admin-module-textarea"
            style={{ minHeight: 160 }}
            placeholder="Mensagem"
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <div className="admin-module-actions">
          <button className="admin-module-btn green" onClick={criar}>
            Criar comunicado
          </button>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Histórico</h2>
            <span>Total: {items.length}</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Destino</th>
                <th>Ativo</th>
                <th>Respostas</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center" }}>
                    Nenhum comunicado encontrado.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.titulo}</td>
                    <td>{item.tipoDestino}</td>
                    <td>{item.ativo ? "Sim" : "Não"}</td>
                    <td>{item.respostas?.length || 0}</td>
                    <td>{new Date(item.createdAt).toLocaleString("pt-BR")}</td>
                    <td>
                      {item.ativo ? (
                        <button
                          className="admin-module-btn danger"
                          onClick={() => encerrar(item._id)}
                        >
                          Encerrar
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}