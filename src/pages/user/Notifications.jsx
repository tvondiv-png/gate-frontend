import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/panel-sections.css";

export default function Notifications() {
  const [list, setList] = useState([]);

  useEffect(() => {
    api.get("/api/notifications").then(res => setList(res.data));
  }, []);

  return (
    <div className="panel-section">
      <h2>Notificações</h2>

      <div className="panel-grid">
        {list.length === 0 && (
          <div className="panel-card">
            Nenhuma notificação no momento
          </div>
        )}

        {list.map(n => (
          <div key={n._id} className="panel-card">
            <p>{n.mensagem}</p>
            <small>
              {new Date(n.createdAt).toLocaleString("pt-BR")}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}
