import { useEffect, useState } from "react";
import api from "../../api/api";
import "./hierarchy-public.css";
import { INSIGNIAS } from "../../utils/insignias";

const ORDEM_CATEGORIAS = [
  "OFICIAIS_SUPERIORES",
  "OFICIAIS_INTERMEDIARIOS",
  "OFICIAIS_SUBALTERNOS",
  "PRACAS_ESPECIAIS",
  "PRACAS_GRADUADAS",
  "PRACAS",
  "ESTAGIARIOS"
];

export default function HierarchyPublic() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/api/hierarchy/public")
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        alert("Erro ao carregar hierarquia");
      });
  }, []);

  if (!data) {
    return <p style={{ padding: 40 }}>Carregando hierarquia...</p>;
  }

  const totalGeral = ORDEM_CATEGORIAS.reduce(
    (acc, key) => acc + (data[key]?.total || 0),
    0
  );

  return (
    <div className="hierarchy-page">

      {/* ===== RESUMO ===== */}
      <section className="hierarchy-summary">
        <div className="summary-card total">
          <span className="numero">{totalGeral}</span>
          <span className="label">EFETIVO TOTAL</span>
        </div>

        {ORDEM_CATEGORIAS.map(key => {
          const c = data[key];
          if (!c || c.total === 0) return null;

          return (
            <div
              key={key}
              className="summary-card"
              style={{ borderColor: c.cor }}
            >
              <span className="numero">{c.total}</span>
              <span className="label">{c.categoria}</span>
            </div>
          );
        })}
      </section>

      {/* ===== LISTAGEM ===== */}
      <section className="hierarchy-content">
        <h1>Hierarquia GATE</h1>

        {ORDEM_CATEGORIAS.map(key => {
          const c = data[key];
          if (!c || c.total === 0) return null;

          return (
            <div key={key} className="category-block">
              <h2 style={{ borderColor: c.cor }}>
                {c.categoria} ({c.total})
              </h2>

              <table>
                <thead>
                  <tr>
                    <th>Funcional</th>
                    <th>Nome</th>
                    <th>Patente</th>
                    <th>Função</th>
                    <th>Entrada</th>
                    <th>Última Promoção</th>
                    <th>Cursos</th>
                    <th>Medalhas</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {c.membros.map((m, i) => {
                    const cursos = m.cursos ?? [];
                    const medalhas = m.medalhas ?? [];

                    return (
                      <tr key={i}>
                        <td>{m.funcional}</td>
                        <td>{m.nome}</td>

                        {/* PATENTE */}
                        <td className="patente-cell">
                          {INSIGNIAS[m.patente] && (
                            <img
                              src={INSIGNIAS[m.patente]}
                              alt={m.patente}
                              className="insignia"
                            />
                          )}
                          <span>{m.patente}</span>
                        </td>

                        <td>{m.funcao || "-"}</td>

                        {/* ENTRADA */}
                        <td>
                          {m.dataEntrada
                            ? new Date(m.dataEntrada).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>

                        {/* ÚLTIMA PROMOÇÃO */}
                        <td>
                          {m.ultimaPromocao
                            ? new Date(m.ultimaPromocao).toLocaleDateString("pt-BR")
                            : "-"}
                        </td>

                        {/* CURSOS */}
                        <td>
                          {cursos.length > 0 ? (
                            <div className="hover-info">
                              <span>{cursos.length}</span>
                              <div className="tooltip">
                                {cursos.map((c, i) => (
                                  <div key={i}>• {c}</div>
                                ))}
                              </div>
                            </div>
                          ) : "0"}
                        </td>

                        {/* MEDALHAS */}
                        <td>
                          {medalhas.length > 0 ? (
                            <div className="hover-info">
                              <span>{medalhas.length}</span>
                              <div className="tooltip">
                                {medalhas.map((md, i) => (
                                  <div key={i}>🏅 {md}</div>
                                ))}
                              </div>
                            </div>
                          ) : "0"}
                        </td>

                        <td>{m.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>
    </div>
  );
}
