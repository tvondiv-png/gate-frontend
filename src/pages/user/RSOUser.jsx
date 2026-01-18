import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/panel-sections.css";

/* ================= UTIL ================= */
const formatarMinutos = (min) => {
  if (!min || min <= 0) return "-";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

const formatarHora = (data) => {
  if (!data) return "-";
  return new Date(data).toLocaleTimeString("pt-BR");
};

/* ================= COMPONENTE ================= */
export default function RSOUser() {
  const [rsos, setRsos] = useState([]);
  const [hierarquia, setHierarquia] = useState([]);

  /* ===== ABERTURA ===== */
  const [viatura, setViatura] = useState("");
  const [chefe, setChefe] = useState("");
  const [auxiliar, setAuxiliar] = useState("");
  const [motorista, setMotorista] = useState("");
  const [quarto, setQuarto] = useState("");
  const [quinto, setQuinto] = useState("");

  /* ===== ADICIONAR POLICIAL ===== */
  const [novoFuncional, setNovoFuncional] = useState("");
  const [novoCargo, setNovoCargo] = useState("quarto");

  /* ===== APREENSÃO ===== */
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("");

  /* ================= LOAD ================= */
  const carregar = async () => {
    const [rsoRes, hierRes] = await Promise.all([
      api.get("/api/rso/me"),
      api.get("/api/hierarchy/public")
    ]);

    setRsos(rsoRes.data);

    const lista = Object.values(hierRes.data)
      .flatMap(c => c.membros || [])
      .filter(p => p.status === "Ativo");

    setHierarquia(lista);
  };

  useEffect(() => {
    carregar();
  }, []);

  /* ================= AÇÕES ================= */
  const abrirRSO = async () => {
    if (!viatura || !chefe || !auxiliar || !motorista) {
      alert("Preencha Viatura, Chefe, Auxiliar e Motorista");
      return;
    }

    const equipeRotativa = {
      motorista: [{ funcional: Number(motorista) }]
    };

    if (quarto) equipeRotativa.quarto = [{ funcional: Number(quarto) }];
    if (quinto) equipeRotativa.quinto = [{ funcional: Number(quinto) }];

    try {
      await api.post("/rso", {
        viatura,
        equipeFixa: {
          chefe: { funcional: Number(chefe) },
          auxiliar: { funcional: Number(auxiliar) }
        },
        equipeRotativa
      });

      setViatura("");
      setChefe("");
      setAuxiliar("");
      setMotorista("");
      setQuarto("");
      setQuinto("");

      carregar();
    } catch (err) {
      console.error(err.response?.data || err);
      alert("Erro ao abrir RSO");
    }
  };

  const adicionarPolicial = async (id) => {
    if (!novoFuncional) return;

    await api.post(`/rso/${id}/adicionar-policial`, {
      funcional: Number(novoFuncional),
      cargo: novoCargo
    });

    setNovoFuncional("");
    carregar();
  };

  const adicionarApreensao = async (id) => {
    if (!tipo || !quantidade) return;

    await api.post(`/rso/${id}/apreensao`, {
      tipo,
      quantidade: Number(quantidade)
    });

    setTipo("");
    setQuantidade("");
    carregar();
  };

  const salvarObservacoes = async (id, valor, status) => {
    if (status === "Ativo") {
      await api.put(`/rso/${id}/observacoes`, { observacoes: valor });
    }
    if (status === "Rejeitado") {
      await api.put(`/rso/${id}/editar`, { observacoes: valor });
    }
    carregar();
  };

  const encerrarPolicial = async (id, cargo, index) => {
    await api.put(`/rso/${id}/encerrar-policial/${cargo}/${index}`);
    carregar();
  };

  const encerrarRSO = async (id) => {
    await api.put(`/rso/${id}/encerrar`);
    carregar();
  };

  const excluirRSO = async (id) => {
    if (!window.confirm("Deseja excluir este RSO aprovado do histórico?")) return;
    await api.delete(`/rso/${id}`);
    carregar();
  };

  /* ================= RENDER ================= */
  return (
    <div className="panel-section">
      <h2>Registro de Serviço Operacional (RSO)</h2>

      {/* ===== ABERTURA ===== */}
      <div className="panel-card">
        <h3>Abrir RSO</h3>

        <input
          className="panel-input"
          placeholder="Viatura"
          value={viatura}
          onChange={e => setViatura(e.target.value)}
        />

        {[
          ["Chefe", chefe, setChefe],
          ["Auxiliar", auxiliar, setAuxiliar],
          ["Motorista", motorista, setMotorista],
          ["4º Homem (opcional)", quarto, setQuarto],
          ["5º Homem (opcional)", quinto, setQuinto]
        ].map(([label, value, setter]) => (
          <select
            key={label}
            className="panel-input"
            value={value}
            onChange={e => setter(e.target.value)}
          >
            <option value="">{label}</option>
            {hierarquia.map(p => (
              <option key={p.funcional} value={p.funcional}>
                {p.patente} - {p.nome} ({p.funcional})
              </option>
            ))}
          </select>
        ))}

        <button className="panel-btn" onClick={abrirRSO}>
          Abrir RSO
        </button>
      </div>

      {/* ===== HISTÓRICO ===== */}
      <h3 style={{ marginTop: 40 }}>Meus RSOs</h3>

      {rsos.map(rso => (
        <div key={rso._id} className="panel-card">
          <strong>{rso.viatura}</strong> — {rso.status}

          <h4>Observações</h4>
          {(rso.status === "Ativo" || rso.status === "Rejeitado") ? (
            <textarea
              className="panel-input"
              defaultValue={rso.observacoes || ""}
              onBlur={e =>
                salvarObservacoes(rso._id, e.target.value, rso.status)
              }
            />
          ) : (
            <p>{rso.observacoes || "-"}</p>
          )}

          {rso.status === "Aprovado" && (
            <button
              className="panel-btn danger"
              onClick={() => excluirRSO(rso._id)}
            >
              Excluir RSO
            </button>
          )}

          {/* ===== APREENSÕES ===== */}
          {rso.status === "Ativo" && (
            <>
              <h4>Apreensões</h4>

              <select
                className="panel-input"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
              >
                <option value="">Tipo</option>
                <option>Armas</option>
                <option>Munições</option>
                <option>Entorpecentes</option>
                <option>Valores</option>
                <option>Ilícitos</option>
              </select>

              <input
                className="panel-input"
                type="number"
                placeholder="Quantidade"
                value={quantidade}
                onChange={e => setQuantidade(e.target.value)}
              />

              <button
                className="panel-btn"
                onClick={() => adicionarApreensao(rso._id)}
              >
                Adicionar Apreensão
              </button>
            </>
          )}

          {rso.apreensoes?.length > 0 && (
            <>
              <h4>Apreensões Registradas</h4>
              <ul>
                {rso.apreensoes.map((a, i) => (
                  <li key={i}>{a.tipo} — {a.quantidade}</li>
                ))}
              </ul>
            </>
          )}

          {/* ===== ADICIONAR POLICIAL ===== */}
          {rso.status === "Ativo" && (
            <>
              <h4>Adicionar Policial</h4>

              <input
                className="panel-input"
                placeholder="Funcional"
                value={novoFuncional}
                onChange={e => setNovoFuncional(e.target.value)}
              />

              <select
                className="panel-input"
                value={novoCargo}
                onChange={e => setNovoCargo(e.target.value)}
              >
                <option value="motorista">Motorista</option>
                <option value="quarto">4º Homem</option>
                <option value="quinto">5º Homem</option>
              </select>

              <button
                className="panel-btn"
                onClick={() => adicionarPolicial(rso._id)}
              >
                Adicionar Policial
              </button>
            </>
          )}

          {/* ===== EQUIPE ===== */}
          <h4>Equipe</h4>
          <div className="panel-grid">
            {[rso.equipeFixa.chefe, rso.equipeFixa.auxiliar].map((p, i) => (
              <div key={i} className="panel-card mini">
                <strong>{p.cargo}</strong>
                <div>{p.nome} ({p.funcional})</div>
                <small>{formatarHora(p.horaEntrada)} → {formatarHora(p.horaSaida)}</small>
                <div>{formatarMinutos(p.tempoMinutos)}</div>
              </div>
            ))}

            {Object.entries(rso.equipeRotativa).map(([cargo, lista]) =>
              lista.map((p, index) => (
                <div key={`${cargo}-${index}`} className="panel-card mini">
                  <strong>{p.cargo}</strong>
                  <div>{p.nome} ({p.funcional})</div>
                  <small>{formatarHora(p.horaEntrada)} → {formatarHora(p.horaSaida)}</small>
                  <div>{formatarMinutos(p.tempoMinutos)}</div>

                  {rso.status === "Ativo" && p.status === "Ativo" && (
                    <button
                      className="panel-btn danger small"
                      onClick={() => encerrarPolicial(rso._id, cargo, index)}
                    >
                      Encerrar
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {rso.status === "Ativo" && (
            <button
              className="panel-btn"
              onClick={() => encerrarRSO(rso._id)}
            >
              Encerrar RSO
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
