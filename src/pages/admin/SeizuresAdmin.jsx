import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
export default function SeizuresAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await api.get("/api/apreensoes/admin");
    setItems(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const zerar = async () => {
    if (!(await confirm({ tone: "danger", message: "Deseja zerar TODAS as apreensões?" }))) return;

    setLoading(true);
    try {
      await api.post("/api/apreensoes/zerar");
      await load();
      toast.success("Apreensões zeradas com sucesso");
    } catch (err) {
      toast.error("Erro ao zerar apreensões");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const total = useMemo(
    () => items.reduce((acc, item) => acc + Number(item.quantidade || 0), 0),
    [items]
  );

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Apreensões</h1>
          <p>Painel consolidado de apreensões registradas no sistema.</p>
        </div>

        <div className="admin-module-actions" style={{ marginTop: 0 }}>
          <button className="admin-module-btn blue" onClick={load}>
            Recarregar
          </button>
          <button className="admin-module-btn danger" onClick={zerar} disabled={loading}>
            {loading ? "Zerando..." : "Zerar Apreensões"}
          </button>
        </div>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Tipos registrados</small>
          <strong>{items.length}</strong>
        </div>
        <div className="admin-module-summary-card">
          <small>Total consolidado</small>
          <strong>{total}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Lista de apreensões</h2>
            <span>Visualização geral por tipo.</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center" }}>
                    Nenhuma apreensão registrada
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id}>
                    <td>{item.tipo}</td>
                    <td>{item.quantidade}</td>
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