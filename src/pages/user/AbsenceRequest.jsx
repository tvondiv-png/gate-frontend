import { useState } from "react";
import api from "../../api/api";
import "./user-module-premium.css";

export default function AbsenceRequest() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [motivo, setMotivo] = useState("");

  const submit = async () => {
    if (!dataInicio || !dataFim || !motivo) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      await api.post("/api/absences", { dataInicio, dataFim, motivo });
      alert("Solicitação enviada");
      setDataInicio("");
      setDataFim("");
      setMotivo("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Erro ao enviar solicitação");
    }
  };

  return (
    <div className="user-module-page">
      <div className="user-module-topbar">
        <div>
          <h2>Solicitação de Ausência</h2>
          <p>Formalize sua ausência com período e justificativa.</p>
        </div>
      </div>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Nova solicitação</h3>
            <span>Preencha o período da ausência e a motivação.</span>
          </div>
        </div>

        <div className="user-module-grid">
          <input
            type="date"
            className="user-module-input"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <input
            type="date"
            className="user-module-input"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <textarea
            className="user-module-textarea"
            placeholder="Motivo da ausência"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>

        <div className="user-module-actions">
          <button className="user-module-btn" onClick={submit}>
            Enviar solicitação
          </button>
        </div>
      </section>
    </div>
  );
}