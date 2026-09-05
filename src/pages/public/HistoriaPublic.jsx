import { useEffect, useState } from "react";
import api from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import "../../styles/historia-public.css";

export default function HistoriaPublic() {
  const toast = useToast();
  const [historia, setHistoria] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/historia")
      .then((res) => setHistoria(res.data))
      .catch(() => {
        toast.error("Erro ao carregar a história");
        setHistoria(null);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const secoes = Array.isArray(historia?.secoes) ? historia.secoes : [];

  return (
    <div className="historia-page page-enter">
      <section className="historia-hero">
        <img
          src="/anchieta-logo.png"
          alt="2º BPChq Anchieta"
          className="historia-hero-logo"
        />
        <span className="historia-kicker">MEMÓRIA INSTITUCIONAL</span>
        <h1>{historia?.titulo || "História do 2º BPChq - Anchieta"}</h1>
        {historia?.resumo && <p className="historia-resumo">{historia.resumo}</p>}
      </section>

      {loading ? (
        <div className="historia-empty">
          <div className="historia-spinner" />
          <strong>Carregando...</strong>
        </div>
      ) : secoes.length === 0 ? (
        <div className="historia-empty">
          <strong>Conteúdo ainda não publicado.</strong>
        </div>
      ) : (
        <div className="historia-body">
          {secoes.length > 1 && (
            <nav className="historia-indice" aria-label="Índice">
              <span className="historia-indice-titulo">Índice</span>
              {secoes.map((s, i) => (
                <a key={i} href={`#sec-${i}`}>
                  {s.titulo}
                </a>
              ))}
            </nav>
          )}

          <div className="historia-secoes">
            {secoes.map((s, i) => (
              <article key={i} id={`sec-${i}`} className="historia-secao">
                <h2>
                  <span className="historia-secao-num">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {s.titulo}
                </h2>
                <p className="historia-secao-corpo">{s.corpo}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {historia?.updatedAt && (
        <footer className="historia-footer">
          Atualizado em{" "}
          {new Date(historia.updatedAt).toLocaleDateString("pt-BR")}
        </footer>
      )}
    </div>
  );
}
