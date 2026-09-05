export default function HierarchyTable({ data = {} }) {
  const categorias = Object.entries(data);

  return (
    <>
      {categorias.map(([categoria, info]) => {
        if (!info?.membros?.length) return null;

        return (
          <div key={categoria} className="category-block">
            <div
              className="category-header"
              style={{ borderColor: info.cor || "rgba(201,162,77,0.20)" }}
            >
              <div>
                <span
                  className="category-badge"
                  style={{
                    background: `${info.cor || "#c9a24d"}18`,
                    borderColor: `${info.cor || "#c9a24d"}55`,
                    color: info.cor || "#c9a24d"
                  }}
                >
                  {categoria.replaceAll("_", " ")}
                </span>

                <h2>
                  {categoria.replaceAll("_", " ")} <small>({info.total || 0})</small>
                </h2>
              </div>
            </div>

            <div className="hierarchy-table-wrapper">
              <table className="hierarchy-table">
                <thead>
                  <tr>
                    <th>Funcional</th>
                    <th>Nome</th>
                    <th>Patente</th>
                    <th>Função</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {info.membros.map((p, index) => (
                    <tr
                      key={p._id || `${categoria}-${index}`}
                      className="table-row"
                      style={{ animationDelay: `${(index % 10) * 0.04}s` }}
                    >
                      <td>{p.funcional || "-"}</td>
                      <td>{p.nome || "-"}</td>
                      <td>{p.patente || "-"}</td>
                      <td>{p.funcao || "-"}</td>
                      <td>
                        <span
                          className={`status-pill ${
                            String(p.status || "").toLowerCase() === "ativo"
                              ? "ativo"
                              : "inativo"
                          }`}
                        >
                          {p.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}