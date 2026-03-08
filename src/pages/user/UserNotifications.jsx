import { useEffect, useState } from "react";
import {
  listarMinhasNotificacoes,
  marcarNotificacaoComoLida
} from "../../services/notificationUserService";

export default function UserNotifications() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregar = async () => {
    try {
      const data = await listarMinhasNotificacoes();
      setNotificacoes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const marcarComoLida = async (id) => {
    await marcarNotificacaoComoLida(id);
    carregar();
  };

  if (loading) return <p>Carregando notificações...</p>;

  return (
    <div>
      <h2>🔔 Minhas Notificações</h2>

      {notificacoes.length === 0 && (
        <p>Nenhuma notificação no momento.</p>
      )}

      {notificacoes.map((n) => (
        <div
          key={n._id}
          onClick={() => !n.read && marcarComoLida(n._id)}
          style={{
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "6px",
            cursor: "pointer",
            background: n.read ? "#1e1e1e" : "#2c3e50",
            border: n.read ? "1px solid #333" : "1px solid #f1c40f"
          }}
        >
          <strong>{n.titulo}</strong>
          <p>{n.mensagem}</p>
          <small>{new Date(n.createdAt).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
