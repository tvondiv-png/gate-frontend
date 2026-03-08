import { useState } from "react";
import api from "../../api/api";
import "../../styles/panel-sections.css";

export default function AbsenceRequest() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [motivo, setMotivo] = useState("");

  const submit = async () => {
    if (!dataInicio || !dataFim || !motivo) {
      alert("Preencha todos os campos");
      return;
    }

    await api.post("/api/absences", { dataInicio, dataFim, motivo });
    alert("Solicitação enviada");
    setDataInicio("");
    setDataFim("");
    setMotivo("");
  };

  return (
    <div className="panel-section">
      <h2>Solicitação de Ausência</h2>

      <input
        type="date"
        className="panel-input"
        value={dataInicio}
        onChange={e => setDataInicio(e.target.value)}
      />

      <input
        type="date"
        className="panel-input"
        value={dataFim}
        onChange={e => setDataFim(e.target.value)}
      />

      <textarea
        className="panel-textarea"
        placeholder="Motivo da ausência"
        value={motivo}
        onChange={e => setMotivo(e.target.value)}
      />

      <button className="panel-btn" onClick={submit}>
        Enviar Solicitação
      </button>
    </div>
  );
}
