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

/**
 * 🔥 Usa totalMinutos se vier do backend (RSO aprovado)
 * 🔥 Senão soma manualmente (RSO ativo / rejeitado)
 */
const somarTempoRSO = (rso) => {
  if (rso.totalMinutos && rso.totalMinutos > 0) {
    return rso.totalMinutos;
  }

  let total = 0;

  if (rso.equipeFixa?.chefe?.tempoMinutos)
    total += rso.equipeFixa.chefe.tempoMinutos;

  if (rso.equipeFixa?.auxiliar?.tempoMinutos)
    total += rso.equipeFixa.auxiliar.tempoMinutos;

  Object.values(rso.equipeRotativa || {}).flat().forEach(p => {
    if (p.tempoMinutos) total += p.tempoMinutos;
  });

  return total;
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
  const [novoCargo, setNovoCargo] = useState("motorista");
  const [erroAdicionarPolicial, setErroAdicionarPolicial] = useState("");

  /* ===== APREENSÕES ===== */
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

    await api.post("/api/rso", {
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
  };

  const adicionarApreensao = async (id) => {
    if (!tipo || !quantidade) return;
    await api.post(`/api/rso/${id}/apreensao`, {
      tipo,
      quantidade: Number(quantidade)
    });
    setTipo("");
    setQuantidade("");
    carregar();
  };

  const encerrarPolicial = async (id, cargo, index) => {
    await api.put(`/api/rso/${id}/encerrar-policial/${cargo}/${index}`);
    carregar();
  };

  const encerrarRSO = async (id) => {
    await api.put(`/api/rso/${id}/encerrar`);
    carregar();
  };

  const excluirRSO = async (id) => {
    if (!window.confirm("Deseja excluir este RSO?")) return;
    await api.delete(`/api/rso/${id}`);
    carregar();
  };

  const reenviarRSO = async (id) => {
    await api.put(`/api/rso/${id}/reenviar`);
    carregar();
  };

  const salvarObservacoes = async (id, texto, status) => {
    if (status === "Ativo") {
      await api.put(`/api/rso/${id}/observacoes`, { observacoes: texto });
    }
    if (status === "Rejeitado") {
      await api.put(`/api/rso/${id}/editar`, { observacoes: texto });
    }
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

        {[["Chefe", chefe, setChefe],
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

      {/* ===== MEUS RSOs ===== */}
      <h3 style={{ marginTop: 40 }}>Meus RSOs</h3>

      {rsos.map(rso => {
        const totalMin = somarTempoRSO(rso);

        return (
          <div key={rso._id} className="panel-card">
            <strong>{rso.viatura}</strong> — {rso.status}

            {rso.status === "Rejeitado" && rso.comentarioADM && (
              <div className="panel-alert danger">
                <strong>Motivo da rejeição (ADM):</strong>
                <p>{rso.comentarioADM}</p>
              </div>
            )}

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

              {Object.entries(rso.equipeRotativa || {})
  .filter(([_, lista]) => Array.isArray(lista) && lista.length > 0)
  .map(([cargo, lista]) =>

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

            {/* ===== ADICIONAR POLICIAL ===== */}
            {rso.status === "Ativo" && (
              <>
                <h4>Adicionar Policial</h4>

                <select
                  className="panel-input"
                  value={novoFuncional}
                  onChange={e => setNovoFuncional(e.target.value)}
                >
                  <option value="">Selecione o policial</option>
                  {hierarquia.map(p => (
                    <option key={p.funcional} value={p.funcional}>
                      {p.patente} - {p.nome} ({p.funcional})
                    </option>
                  ))}
                </select>

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
                  onClick={async () => {
                    if (!novoFuncional || !novoCargo) return;

                    try {
                      setErroAdicionarPolicial("");

                      await api.post(`/api/rso/${rso._id}/adicionar-policial`, {
                        funcional: Number(novoFuncional),
                        cargo: novoCargo
                      });

                      setNovoFuncional("");
                      setNovoCargo("motorista");
                      carregar();
                    } catch (err) {
                      setErroAdicionarPolicial(
                        err.response?.data?.message ||
                        "Policial já está em outro RSO"
                      );
                    }
                  }}
                >
                  Adicionar Policial
                </button>

                {erroAdicionarPolicial && (
                  <div className="panel-alert danger" style={{ marginTop: 10 }}>
                    {erroAdicionarPolicial}
                  </div>
                )}
              </>
            )}

            <h4>Observações</h4>
            {(rso.status === "Ativo" || rso.status === "Rejeitado") ? (
              <textarea
                className="panel-input"
                defaultValue={rso.observacoes || ""}
                onBlur={e => salvarObservacoes(rso._id, e.target.value, rso.status)}
              />
            ) : (
              <p>{rso.observacoes || "-"}</p>
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

            {/* ===== REGISTRAR APREENSÃO (RSO ATIVO) ===== */}
{rso.status === "Ativo" && (
  <>
    <h4>Registrar Apreensão</h4>

    <select
      className="panel-input"
      value={tipo}
      onChange={e => setTipo(e.target.value)}
    >
      <option value="">Tipo de apreensão</option>
      <option value="Armas">Armas</option>
      <option value="Munições">Munições</option>
      <option value="Entorpecentes">Entorpecentes</option>
      <option value="Valores">Valores</option>
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


            <h4>Tempo total de patrulhamento</h4>
            <strong>{formatarMinutos(totalMin)}</strong>

            <div style={{ marginTop: 20 }}>
              {rso.status === "Ativo" && (
                <button className="panel-btn" onClick={() => encerrarRSO(rso._id)}>
                  Encerrar RSO
                </button>
              )}

              {(rso.status === "Aprovado" || rso.status === "Rejeitado") && (
                <button className="panel-btn danger" onClick={() => excluirRSO(rso._id)}>
                  Excluir RSO
                </button>
              )}

              {rso.status === "Rejeitado" && (
                <button className="panel-btn" onClick={() => reenviarRSO(rso._id)}>
                  Reenviar RSO
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
