import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../contexts/ToastContext";
import {
  fetchBoletimById,
  fetchTodosBoletins
} from "../../services/boletimOcorrenciaService";
import { exportarBoletimPDF } from "../../lib/exportarBoletimPDF";
import "./boletins-gerais.css";

function formatarData(data) {
  if (!data) return "-";
  const v = new Date(data);
  return Number.isNaN(v.getTime()) ? "-" : v.toLocaleString("pt-BR");
}

export default function BoletinsGerais() {
  const toast = useToast();

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");

  const [detalhe, setDetalhe] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  useEffect(() => {
    fetchTodosBoletins()
      .then((data) => setLista(data))
      .catch(() => toast.error("Erro ao carregar boletins"))
      .finally(() => setLoading(false));
  }, [toast]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return lista;

    return lista.filter((item) => {
      const texto = [
        item.viatura,
        item.local?.rua,
        item.local?.bairro,
        item.nomeCriador,
        item.patenteCriador,
        item.funcionalCriador
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return texto.includes(termo);
    });
  }, [lista, busca]);

  const abrirDetalhe = (id) => {
    setCarregandoDetalhe(true);
    fetchBoletimById(id)
      .then((data) => setDetalhe(data))
      .catch(() => toast.error("Erro ao carregar boletim"))
      .finally(() => setCarregandoDetalhe(false));
  };

  return (
    <div className="bg-page">
      <div className="bg-hero">
        <span className="bg-kicker">2º BPChq • VISÃO GERAL</span>
        <h1>Boletins de Ocorrência</h1>
        <p>Todos os BOPMs gerados pelo efetivo, de qualquer policial.</p>
      </div>

      <section className="bg-card">
        <div className="bg-toolbar">
          <input
            placeholder="Buscar por viatura, local, autor ou funcional..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <span className="bg-total">{filtrados.length} boletim(ns)</span>
        </div>

        {loading && <p className="bg-muted">Carregando...</p>}

        {!loading && filtrados.length === 0 && (
          <p className="bg-muted">Nenhum boletim encontrado.</p>
        )}

        <div className="bg-table-wrap">
          <table className="bg-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Viatura</th>
                <th>Local</th>
                <th>Autor</th>
                <th>Resultado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((item) => (
                <tr key={item._id}>
                  <td>{formatarData(item.createdAt)}</td>
                  <td>{item.viatura}</td>
                  <td>
                    {item.local?.rua}, {item.local?.bairro}
                  </td>
                  <td>
                    {item.patenteCriador} {item.nomeCriador}
                    {item.funcionalCriador ? ` (${item.funcionalCriador})` : ""}
                  </td>
                  <td>{item.abordagem?.resultado || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="bg-btn-ver"
                      onClick={() => abrirDetalhe(item._id)}
                    >
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {carregandoDetalhe && <p className="bg-muted">Carregando boletim...</p>}

      {detalhe && (
        <section className="bg-card">
          <h2>Detalhe do boletim</h2>
          <pre className="bg-texto">{detalhe.textoCompleto}</pre>

          <div className="bg-actions">
            <button
              type="button"
              className="bg-btn-primary"
              onClick={() => exportarBoletimPDF(detalhe)}
            >
              Baixar PDF
            </button>
            <button type="button" className="bg-btn-secondary" onClick={() => setDetalhe(null)}>
              Fechar
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
