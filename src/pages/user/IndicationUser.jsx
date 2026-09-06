import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "./user-module-premium.css";

import { useToast } from "../../contexts/ToastContext";
const badgeClass = (status) => {
  if (status === "Aprovado") return "success";
  if (status === "Rejeitado") return "danger";
  if (status === "Pendente") return "warning";
  return "info";
};

export default function IndicationUser() {
  const toast = useToast();
  const [form, setForm] = useState({
    idPersonagem: "",
    nomePersonagem: "",
    idadeReal: "",
    cnh: "",
    discordId: ""
  });

  const [indications, setIndications] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadIndications = async () => {
    const res = await api.get("/api/indications/minhas");
    setIndications(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    loadIndications();
  }, []);

  const resumo = useMemo(() => {
    const total = indications.length;
    const pendentes = indications.filter((x) => x.status === "Pendente").length;
    const aprovadas = indications.filter((x) => x.status === "Aprovado").length;
    const rejeitadas = indications.filter((x) => x.status === "Rejeitado").length;
    return { total, pendentes, aprovadas, rejeitadas };
  }, [indications]);

  const submit = async () => {
    if (
      !form.idPersonagem ||
      !form.nomePersonagem ||
      !form.idadeReal ||
      !form.cnh ||
      !form.discordId
    ) {
      toast.warning("Preencha todos os campos");
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/indications", form);

      setForm({
        idPersonagem: "",
        nomePersonagem: "",
        idadeReal: "",
        cnh: "",
        discordId: ""
      });

      await loadIndications();
      toast.success("Indicação enviada com sucesso");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao enviar indicação");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-module-page">
      <div className="user-module-topbar">
        <div>
          <h2>Indicações</h2>
          <p>Cadastre novas indicações e acompanhe o andamento de cada solicitação.</p>
        </div>
      </div>

      <section className="user-module-summary-grid">
        <div className="user-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Pendentes</small>
          <strong>{resumo.pendentes}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Aprovadas</small>
          <strong>{resumo.aprovadas}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Rejeitadas</small>
          <strong>{resumo.rejeitadas}</strong>
        </div>
      </section>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Nova indicação</h3>
            <span>Preencha os dados do candidato indicado.</span>
          </div>
        </div>

        <div className="user-module-grid">
          <input
            className="user-module-input"
            placeholder="ID do Personagem"
            value={form.idPersonagem}
            onChange={(e) => setForm({ ...form, idPersonagem: e.target.value })}
          />

          <input
            className="user-module-input"
            placeholder="Nome do Personagem"
            value={form.nomePersonagem}
            onChange={(e) => setForm({ ...form, nomePersonagem: e.target.value })}
          />

          <input
            className="user-module-input"
            type="number"
            placeholder="Idade Real"
            value={form.idadeReal}
            onChange={(e) => setForm({ ...form, idadeReal: e.target.value })}
          />

          <input
            className="user-module-input"
            placeholder="CNH (A/B/C/D/E)"
            value={form.cnh}
            onChange={(e) => setForm({ ...form, cnh: e.target.value.toUpperCase() })}
          />

          <input
            className="user-module-input"
            placeholder="ID do Discord"
            value={form.discordId}
            onChange={(e) => setForm({ ...form, discordId: e.target.value })}
          />
        </div>

        <div className="user-module-actions">
          <button className="user-module-btn" onClick={submit} disabled={loading}>
            {loading ? "Enviando..." : "Enviar indicação"}
          </button>
        </div>
      </section>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Minhas indicações</h3>
            <span>Histórico das indicações enviadas pelo seu perfil.</span>
          </div>
        </div>

        {indications.length === 0 ? (
          <div className="user-module-empty">Nenhuma indicação enviada.</div>
        ) : (
          <div className="user-module-list">
            {indications.map((ind) => (
              <div key={ind._id} className="user-module-card">
                <div className="user-module-card-top">
                  <strong>{ind.nomePersonagem}</strong>
                  <span className={`user-module-badge ${badgeClass(ind.status)}`}>
                    {ind.status}
                  </span>
                </div>

                <div className="user-module-grid">
                  <div className="user-module-kv">
                    <small>ID Personagem</small>
                    <div>{ind.idPersonagem}</div>
                  </div>

                  <div className="user-module-kv">
                    <small>Data</small>
                    <div>{new Date(ind.createdAt).toLocaleDateString("pt-BR")}</div>
                  </div>

                  <div className="user-module-kv">
                    <small>Comentário</small>
                    <div>{ind.status === "Rejeitado" ? ind.comentarioAdmin || "-" : "-"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}