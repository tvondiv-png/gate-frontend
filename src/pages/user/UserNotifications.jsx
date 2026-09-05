import { useEffect, useMemo, useState } from "react";
import {
  listarMinhasNotificacoes,
  marcarNotificacaoComoLida
} from "../../services/notificationUserService";
import "./user-module-premium.css";

const badgeClass = (n) => {
  if (!n.lida) return "warning";
  if (n.tipo === "DISCIPLINA") return "danger";
  if (n.tipo === "RSO") return "info";
  return "success";
};

export default function UserNotifications() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      const data = await listarMinhasNotificacoes();
      setNotificacoes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const total = notificacoes.length;
    const naoLidas = notificacoes.filter((x) => !x.lida).length;
    const lidas = notificacoes.filter((x) => x.lida).length;
    return { total, naoLidas, lidas };
  }, [notificacoes]);

  const marcarComoLida = async (id) => {
    await marcarNotificacaoComoLida(id);
    carregar();
  };

  if (loading) {
    return (
      <div className="user-module-page">
        <div className="user-module-empty">Carregando notificações...</div>
      </div>
    );
  }

  return (
    <div className="user-module-page">
      <div className="user-module-topbar">
        <div>
          <h2>Notificações</h2>
          <p>Central de avisos administrativos e operacionais.</p>
        </div>
      </div>

      <section className="user-module-summary-grid">
        <div className="user-module-summary-card">
          <small>Total</small>
          <strong>{resumo.total}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Não lidas</small>
          <strong>{resumo.naoLidas}</strong>
        </div>
        <div className="user-module-summary-card">
          <small>Lidas</small>
          <strong>{resumo.lidas}</strong>
        </div>
      </section>

      <section className="user-module-section">
        <div className="user-module-section-title">
          <div>
            <h3>Minhas notificações</h3>
            <span>Toque em uma não lida para marcar como lida.</span>
          </div>
        </div>

        {notificacoes.length === 0 ? (
          <div className="user-module-empty">Nenhuma notificação no momento.</div>
        ) : (
          <div className="user-module-list">
            {notificacoes.map((n) => (
              <div
                key={n._id}
                className="user-module-card"
                onClick={() => !n.lida && marcarComoLida(n._id)}
                style={{ cursor: !n.lida ? "pointer" : "default" }}
              >
                <div className="user-module-card-top">
                  <strong>{n.titulo || "Notificação"}</strong>
                  <span className={`user-module-badge ${badgeClass(n)}`}>
                    {!n.lida ? "Nova" : "Lida"}
                  </span>
                </div>

                <p style={{ margin: "0 0 10px 0", color: "rgba(255,255,255,0.84)" }}>
                  {n.mensagem}
                </p>

                <div className="user-module-grid">
                  <div className="user-module-kv">
                    <small>Tipo</small>
                    <div>{n.tipo || "-"}</div>
                  </div>
                  <div className="user-module-kv">
                    <small>Data</small>
                    <div>{new Date(n.createdAt).toLocaleString("pt-BR")}</div>
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