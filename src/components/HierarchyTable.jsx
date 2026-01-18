export default function HierarchyTable({ data }) {
  const cores = {
    OFICIAIS_SUPERIORES: "#f8fafc",
    OFICIAIS_SUBALTERNOS: "#22c55e",
    OFICIAIS_INTERMEDIARIOS: "#eab308",
    PRACAS_ESPECIAIS: "#3b82f6",
    PRACAS_GRADUADAS: "#ef4444",
    PRACAS: "#9ca3af",
    ESTAGIARIOS: "#d1d5db"
  };

  return (
    <>
      {Object.entries(data).map(([categoria, info]) => (
        <div key={categoria} style={{ marginBottom: "40px" }}>
          <h2 style={{ color: info.cor }}>
            {categoria.replaceAll("_", " ")} ({info.total})
          </h2>

          <table width="100%" cellPadding="10">
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
              {info.membros.map(p => (
                <tr key={p._id} style={{ background: cores[p.categoria] }}>
                  <td>{p.funcional}</td>
                  <td>{p.nome}</td>
                  <td>{p.patente}</td>
                  <td>{p.funcao}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  );
}
