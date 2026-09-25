import { useEffect, useState } from "react";
import api from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import "./assistente-ia.css";

export default function AssistenteIA() {
  const toast = useToast();

  const [disponivel, setDisponivel] = useState(null);
  const [aba, setAba] = useState("regulamento");

  const [pergunta, setPergunta] = useState("");
  const [historico, setHistorico] = useState([]);
  const [perguntando, setPerguntando] = useState(false);

  const [relato, setRelato] = useState("");
  const [resultadoBopm, setResultadoBopm] = useState(null);
  const [revisando, setRevisando] = useState(false);

  useEffect(() => {
    api
      .get("/api/assistente/status")
      .then((res) => setDisponivel(!!res.data?.disponivel))
      .catch(() => setDisponivel(false));
  }, []);

  const perguntar = async () => {
    if (!pergunta.trim()) {
      toast.warning("Digite uma pergunta");
      return;
    }
    const minhaPergunta = pergunta.trim();
    try {
      setPerguntando(true);
      const res = await api.post("/api/assistente/regulamento", {
        pergunta: minhaPergunta
      });
      setHistorico((h) => [
        ...h,
        { pergunta: minhaPergunta, resposta: res.data.resposta }
      ]);
      setPergunta("");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao consultar o assistente");
    } finally {
      setPerguntando(false);
    }
  };

  const revisar = async () => {
    if (!relato.trim()) {
      toast.warning("Cole o rascunho do relato");
      return;
    }
    try {
      setRevisando(true);
      setResultadoBopm(null);
      const res = await api.post("/api/assistente/bopm", { relato: relato.trim() });
      setResultadoBopm(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erro ao revisar o relato");
    } finally {
      setRevisando(false);
    }
  };

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Copiado para a área de transferência");
    } catch {
      toast.warning("Não foi possível copiar automaticamente");
    }
  };

  if (disponivel === false) {
    return (
      <div className="ia-page">
        <div className="ia-indisponivel">
          <strong>Assistente de IA ainda não configurado.</strong>
          <p>Peça ao Comando para ativar essa funcionalidade.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ia-page">
      <div className="ia-tabs">
        <button
          className={`ia-tab ${aba === "regulamento" ? "active" : ""}`}
          onClick={() => setAba("regulamento")}
        >
          📘 Perguntar sobre o regulamento
        </button>
        <button
          className={`ia-tab ${aba === "bopm" ? "active" : ""}`}
          onClick={() => setAba("bopm")}
        >
          📝 Revisar relato do BOPM
        </button>
      </div>

      {aba === "regulamento" && (
        <div className="ia-card">
          <p className="ia-hint">
            Pergunte em linguagem natural. A resposta é baseada só no texto dos
            regulamentos publicados — se não estiver lá, o assistente vai dizer.
          </p>

          <div className="ia-historico">
            {historico.length === 0 && (
              <span className="ia-vazio">Nenhuma pergunta ainda.</span>
            )}
            {historico.map((h, i) => (
              <div key={i} className="ia-turno">
                <div className="ia-pergunta">🧑 {h.pergunta}</div>
                <div className="ia-resposta">🤖 {h.resposta}</div>
              </div>
            ))}
          </div>

          <div className="ia-input-row">
            <textarea
              className="ia-textarea"
              placeholder="Ex.: posso usar óculos escuros fardado?"
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  perguntar();
                }
              }}
            />
            <button
              className="ia-btn"
              onClick={perguntar}
              disabled={perguntando}
            >
              {perguntando ? "..." : "Perguntar"}
            </button>
          </div>
        </div>
      )}

      {aba === "bopm" && (
        <div className="ia-card">
          <p className="ia-hint">
            Cole o rascunho do relato. O assistente revisa a redação conforme as
            regras do regulamento (sem gírias, com todos os campos exigidos) —
            os fatos continuam sendo os que você descreveu.
          </p>

          <textarea
            className="ia-textarea grande"
            placeholder="Cole aqui o rascunho do relato da ocorrência..."
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            rows={8}
          />

          <div className="ia-input-row">
            <button className="ia-btn" onClick={revisar} disabled={revisando}>
              {revisando ? "Revisando..." : "Revisar relato"}
            </button>
          </div>

          {resultadoBopm && (
            <div className="ia-resultado">
              <div className="ia-resultado-head">
                <strong>Relato revisado</strong>
                <button
                  className="ia-btn-copiar"
                  onClick={() => copiar(resultadoBopm.relatoRevisado)}
                >
                  Copiar
                </button>
              </div>
              <div className="ia-relato-revisado">
                {resultadoBopm.relatoRevisado}
              </div>

              {resultadoBopm.observacoes?.length > 0 && (
                <div className="ia-observacoes">
                  <strong>Observações</strong>
                  <ul>
                    {resultadoBopm.observacoes.map((o, i) => (
                      <li key={i}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
