import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/regulations.css";
import "../../styles/animations.css";

export default function RegulationsPublic() {
  const [regs, setRegs] = useState([]);

  useEffect(() => {
    api.get("/api/regulations/public")
      .then(res => setRegs(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="regulations-page page-enter system-scan">
      <h1>Regulamentos Oficiais</h1>

      {regs.length === 0 && (
        <p className="empty">Nenhum regulamento publicado.</p>
      )}

      {regs.map((reg, i) => (
        <article
          key={reg._id}
          className={`regulation-doc fade-up fade-delay-${(i % 4) + 1}`}
        >
          <header className="doc-header">
            <h2>{reg.titulo}</h2>
          </header>

          {reg.descricao && (
            <p className="desc">{reg.descricao}</p>
          )}

          {reg.conteudo && (
            <pre className="conteudo">{reg.conteudo}</pre>
          )}

          {reg.arquivoPdf && (
            <a
              href={reg.arquivoPdf}
              target="_blank"
              rel="noopener noreferrer"
              className="pdf-link"
            >
              📄 Abrir Documento Oficial
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
