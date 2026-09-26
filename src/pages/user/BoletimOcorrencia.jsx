import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import api from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import { fetchPenalCode } from "../../services/penalCodeService";
import {
  criarBoletim,
  fetchBoletimById,
  fetchMeusBoletins
} from "../../services/boletimOcorrenciaService";
import "./boletim-ocorrencia.css";

const TIPO_ABORDAGEM = [
  { value: "ABORDAGEM_PADRAO", label: "Abordagem de rotina" },
  { value: "FUNDADA_SUSPEITA", label: "Fundada suspeita" },
  { value: "FLAGRANTE", label: "Flagrante delito" },
  { value: "DENUNCIA", label: "Denúncia" }
];

const RESULTADO_ABORDAGEM = [
  { value: "PRESO", label: "Preso e conduzido à custódia" },
  { value: "LIBERADO", label: "Liberado no local" },
  { value: "CONDUZIDO_DELEGACIA", label: "Conduzido à delegacia" },
  { value: "ENCAMINHADO_HOSPITAL", label: "Encaminhado ao hospital" }
];

const PROCEDIMENTOS = [
  { value: "BUSCA_PESSOAL", label: "Busca pessoal" },
  { value: "BUSCA_VEICULAR", label: "Busca veicular" },
  { value: "USO_FORCA", label: "Uso de força para contenção" },
  { value: "APOIO_VTR", label: "Apoio de viatura de reforço" }
];

const TIPOS_ILICITO = ["Armas", "Munições", "Entorpecentes", "Ilicitos", "Valores"];

const LOCAL_VAZIO = { rua: "", bairro: "", cidade: "Anchieta", referencia: "" };

const ABORDAGEM_VAZIA = {
  tipo: "ABORDAGEM_PADRAO",
  ordemDadaPor: "",
  procedimentos: [],
  resultado: "LIBERADO"
};

const SUSPEITO_VAZIO = {
  nome: "Não identificado",
  vestimenta: "",
  corPele: "",
  cabelo: "",
  barba: "",
  altura: "",
  porteFisico: ""
};

const VEICULO_VAZIO = { possui: false, marca: "", modelo: "", cor: "", placa: "" };

function formatarData(data) {
  if (!data) return "-";
  const v = new Date(data);
  return Number.isNaN(v.getTime()) ? "-" : v.toLocaleString("pt-BR");
}

/* =========================================================
   EXPORTAR PDF (client-side, jsPDF — sem custo)
========================================================= */

function exportarPDF(boletim) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const maxWidth = 180;
  const lineHeight = 6;
  let y = 20;

  const linhas = String(boletim.textoCompleto || "").split("\n");

  linhas.forEach((linha) => {
    const ehTitulo =
      linha.trim().length > 2 &&
      linha.trim() === linha.trim().toUpperCase() &&
      /[A-ZÀ-Ú]/.test(linha);

    const wrapped = doc.splitTextToSize(linha || " ", maxWidth);

    wrapped.forEach((w) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", ehTitulo ? "bold" : "normal");
      doc.setFontSize(ehTitulo ? 11 : 10);
      doc.text(w, margin, y);
      y += lineHeight;
    });

    if (linha.trim() === "") {
      y += 1;
    }
  });

  doc.save(`bopm-${boletim._id || "novo"}.pdf`);
}

export default function BoletimOcorrencia() {
  const toast = useToast();

  const [aba, setAba] = useState("novo");

  const [meusRSOs, setMeusRSOs] = useState([]);
  const [rsoSelecionado, setRsoSelecionado] = useState("");

  const [viatura, setViatura] = useState("");
  const [equipe, setEquipe] = useState([]);

  const [artigos, setArtigos] = useState([]);
  const [buscaArtigo, setBuscaArtigo] = useState("");
  const [artigosSelecionados, setArtigosSelecionados] = useState([]);

  const [local, setLocal] = useState(LOCAL_VAZIO);
  const [abordagem, setAbordagem] = useState(ABORDAGEM_VAZIA);
  const [suspeito, setSuspeito] = useState(SUSPEITO_VAZIO);
  const [veiculoSuspeito, setVeiculoSuspeito] = useState(VEICULO_VAZIO);
  const [ilicitos, setIlicitos] = useState([]);

  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [detalheHistorico, setDetalheHistorico] = useState(null);

  /* =======================================================
     CARREGAR RSOs E ARTIGOS DO CÓDIGO PENAL
  ======================================================= */

  useEffect(() => {
    api
      .get("/api/rso/me")
      .then((res) => setMeusRSOs(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});

    fetchPenalCode({ limit: 500 })
      .then((lista) => setArtigos(lista))
      .catch(() => {});
  }, []);

  const carregarHistorico = () => {
    setCarregandoHistorico(true);
    fetchMeusBoletins()
      .then((lista) => setHistorico(lista))
      .catch(() => toast.error("Erro ao carregar histórico de boletins"))
      .finally(() => setCarregandoHistorico(false));
  };

  useEffect(() => {
    if (aba === "historico") {
      carregarHistorico();
    }
  }, [aba]);

  /* =======================================================
     PRÉ-PREENCHER A PARTIR DE UM RSO
  ======================================================= */

  const aplicarRSO = (rsoId) => {
    setRsoSelecionado(rsoId);

    if (!rsoId) return;

    const rso = meusRSOs.find((r) => r._id === rsoId);
    if (!rso) return;

    setViatura(rso.viatura || "");

    if (Array.isArray(rso.equipe) && rso.equipe.length > 0) {
      setEquipe(
        rso.equipe.map((i) => ({
          nome: i.nome || "",
          patente: i.patente || "",
          funcao: i.cargo || ""
        }))
      );

      const encarregado = rso.equipe.find((i) => i.cargo === "Encarregado");
      if (encarregado) {
        setAbordagem((prev) => ({
          ...prev,
          ordemDadaPor: `${encarregado.patente || ""} ${encarregado.nome || ""}`.trim()
        }));
      }
    }

    if (Array.isArray(rso.apreensoes) && rso.apreensoes.length > 0) {
      setIlicitos(
        rso.apreensoes.map((a) => ({
          tipo: a.tipo,
          quantidade:
            a.tipo === "Valores"
              ? Number(a.quantidade || 0).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2
                })
              : String(a.quantidade || ""),
          descricao: ""
        }))
      );
    }

    toast.success("Dados da viatura, equipe e apreensões pré-preenchidos.");
  };

  /* =======================================================
     EQUIPE
  ======================================================= */

  const adicionarIntegrante = () => {
    setEquipe((prev) => [...prev, { nome: "", patente: "", funcao: "" }]);
  };

  const atualizarIntegrante = (index, campo, valor) => {
    setEquipe((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const removerIntegrante = (index) => {
    setEquipe((prev) => prev.filter((_, i) => i !== index));
  };

  /* =======================================================
     ARTIGOS (NATUREZA DOS FATOS)
  ======================================================= */

  const artigosFiltrados = useMemo(() => {
    const termo = buscaArtigo.trim().toLowerCase();
    if (!termo) return artigos.slice(0, 15);

    return artigos
      .filter(
        (a) =>
          String(a.artigo).toLowerCase().includes(termo) ||
          String(a.titulo).toLowerCase().includes(termo) ||
          String(a.codigo || "").toLowerCase().includes(termo)
      )
      .slice(0, 15);
  }, [artigos, buscaArtigo]);

  const adicionarArtigo = (artigo) => {
    if (artigosSelecionados.some((a) => a.artigo === artigo.artigo)) return;

    setArtigosSelecionados((prev) => [
      ...prev,
      { codigo: artigo.codigo, artigo: artigo.artigo, titulo: artigo.titulo }
    ]);
  };

  const removerArtigo = (artigo) => {
    setArtigosSelecionados((prev) => prev.filter((a) => a.artigo !== artigo));
  };

  /* =======================================================
     ILÍCITOS
  ======================================================= */

  const adicionarIlicito = () => {
    setIlicitos((prev) => [...prev, { tipo: "Entorpecentes", quantidade: "", descricao: "" }]);
  };

  const atualizarIlicito = (index, campo, valor) => {
    setIlicitos((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [campo]: valor } : item))
    );
  };

  const removerIlicito = (index) => {
    setIlicitos((prev) => prev.filter((_, i) => i !== index));
  };

  /* =======================================================
     PROCEDIMENTOS (CHECKBOX)
  ======================================================= */

  const toggleProcedimento = (valor) => {
    setAbordagem((prev) => {
      const ativo = prev.procedimentos.includes(valor);
      return {
        ...prev,
        procedimentos: ativo
          ? prev.procedimentos.filter((p) => p !== valor)
          : [...prev.procedimentos, valor]
      };
    });
  };

  /* =======================================================
     GERAR BOLETIM
  ======================================================= */

  const gerarBoletim = async () => {
    if (!viatura.trim()) {
      toast.error("Informe a viatura");
      return;
    }

    if (artigosSelecionados.length === 0) {
      toast.error("Selecione ao menos um artigo na natureza dos fatos");
      return;
    }

    if (!local.rua.trim() || !local.bairro.trim()) {
      toast.error("Informe rua e bairro do local");
      return;
    }

    if (!abordagem.ordemDadaPor.trim()) {
      toast.error("Informe quem deu a ordem de abordagem");
      return;
    }

    try {
      setGerando(true);

      const res = await criarBoletim({
        rso: rsoSelecionado || null,
        viatura: viatura.trim(),
        equipe: equipe.filter((i) => i.nome.trim()),
        naturezaFatos: artigosSelecionados,
        local,
        abordagem,
        suspeito,
        veiculoSuspeito,
        ilicitos: ilicitos.filter((i) => i.quantidade.trim())
      });

      setResultado(res.boletim);
      toast.success("Boletim gerado com sucesso");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao gerar boletim");
    } finally {
      setGerando(false);
    }
  };

  const novoBoletim = () => {
    setResultado(null);
    setRsoSelecionado("");
    setViatura("");
    setEquipe([]);
    setArtigosSelecionados([]);
    setLocal(LOCAL_VAZIO);
    setAbordagem(ABORDAGEM_VAZIA);
    setSuspeito(SUSPEITO_VAZIO);
    setVeiculoSuspeito(VEICULO_VAZIO);
    setIlicitos([]);
  };

  const copiarTexto = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Texto copiado para a área de transferência");
    } catch {
      toast.error("Não foi possível copiar o texto");
    }
  };

  const abrirDetalheHistorico = (id) => {
    fetchBoletimById(id)
      .then((data) => setDetalheHistorico(data))
      .catch(() => toast.error("Erro ao carregar boletim"));
  };

  /* =======================================================
     TELA
  ======================================================= */

  return (
    <div className="bopm-page">
      <div className="bopm-hero">
        <span className="bopm-kicker">2º BPChq • BOLETIM DE OCORRÊNCIA</span>
        <h1>Gerador de BOPM</h1>
        <p>
          Preencha só as informações básicas — o sistema monta o boletim
          completo seguindo a estrutura do Art. 17.2 do Regulamento Interno.
        </p>
      </div>

      <div className="bopm-tabs">
        <button
          type="button"
          className={aba === "novo" ? "active" : ""}
          onClick={() => setAba("novo")}
        >
          Novo boletim
        </button>
        <button
          type="button"
          className={aba === "historico" ? "active" : ""}
          onClick={() => setAba("historico")}
        >
          Meus boletins
        </button>
      </div>

      {aba === "novo" && !resultado && (
        <>
          <section className="bopm-card">
            <h2>1. Viatura e equipe</h2>

            <div className="bopm-field">
              <label>Preencher a partir de um RSO seu (opcional)</label>
              <select value={rsoSelecionado} onChange={(e) => aplicarRSO(e.target.value)}>
                <option value="">Começar do zero</option>
                {meusRSOs.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.viatura} • {formatarData(r.createdAt)} • {r.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="bopm-field">
              <label>Viatura *</label>
              <input
                value={viatura}
                onChange={(e) => setViatura(e.target.value)}
                placeholder="Ex: ROCAM 321 - 9232"
              />
            </div>

            <div className="bopm-repeater">
              <label>Equipe</label>

              {equipe.map((item, index) => (
                <div key={index} className="bopm-repeater-row">
                  <input
                    placeholder="Patente"
                    value={item.patente}
                    onChange={(e) => atualizarIntegrante(index, "patente", e.target.value)}
                  />
                  <input
                    placeholder="Nome"
                    value={item.nome}
                    onChange={(e) => atualizarIntegrante(index, "nome", e.target.value)}
                  />
                  <input
                    placeholder="Função"
                    value={item.funcao}
                    onChange={(e) => atualizarIntegrante(index, "funcao", e.target.value)}
                  />
                  <button type="button" className="bopm-remove" onClick={() => removerIntegrante(index)}>
                    ×
                  </button>
                </div>
              ))}

              <button type="button" className="bopm-add" onClick={adicionarIntegrante}>
                + Adicionar policial
              </button>
            </div>
          </section>

          <section className="bopm-card">
            <h2>2. Natureza dos fatos</h2>

            <div className="bopm-field">
              <label>Buscar artigo do Código Penal</label>
              <input
                value={buscaArtigo}
                onChange={(e) => setBuscaArtigo(e.target.value)}
                placeholder="Digite o artigo, título ou código..."
              />
            </div>

            {artigosFiltrados.length > 0 && (
              <div className="bopm-artigo-lista">
                {artigosFiltrados.map((a) => (
                  <button
                    type="button"
                    key={a._id}
                    className="bopm-artigo-item"
                    onClick={() => adicionarArtigo(a)}
                  >
                    Art. {a.artigo} — {a.titulo}
                  </button>
                ))}
              </div>
            )}

            {artigosSelecionados.length > 0 && (
              <div className="bopm-chips">
                {artigosSelecionados.map((a) => (
                  <span key={a.artigo} className="bopm-chip">
                    Art. {a.artigo} — {a.titulo}
                    <button type="button" onClick={() => removerArtigo(a.artigo)}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="bopm-card">
            <h2>3. Local</h2>

            <div className="bopm-grid-2">
              <div className="bopm-field">
                <label>Rua *</label>
                <input
                  value={local.rua}
                  onChange={(e) => setLocal({ ...local, rua: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Bairro *</label>
                <input
                  value={local.bairro}
                  onChange={(e) => setLocal({ ...local, bairro: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Cidade</label>
                <input
                  value={local.cidade}
                  onChange={(e) => setLocal({ ...local, cidade: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Ponto de referência</label>
                <input
                  value={local.referencia}
                  onChange={(e) => setLocal({ ...local, referencia: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="bopm-card">
            <h2>4. Abordagem</h2>

            <div className="bopm-grid-2">
              <div className="bopm-field">
                <label>Tipo de abordagem *</label>
                <select
                  value={abordagem.tipo}
                  onChange={(e) => setAbordagem({ ...abordagem, tipo: e.target.value })}
                >
                  {TIPO_ABORDAGEM.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bopm-field">
                <label>Quem deu a ordem de abordagem *</label>
                <input
                  value={abordagem.ordemDadaPor}
                  onChange={(e) => setAbordagem({ ...abordagem, ordemDadaPor: e.target.value })}
                  placeholder="Patente e nome"
                />
              </div>
            </div>

            <div className="bopm-checkbox-row">
              {PROCEDIMENTOS.map((p) => (
                <label key={p.value} className="bopm-checkbox">
                  <input
                    type="checkbox"
                    checked={abordagem.procedimentos.includes(p.value)}
                    onChange={() => toggleProcedimento(p.value)}
                  />
                  {p.label}
                </label>
              ))}
            </div>

            <div className="bopm-field">
              <label>Resultado *</label>
              <select
                value={abordagem.resultado}
                onChange={(e) => setAbordagem({ ...abordagem, resultado: e.target.value })}
              >
                {RESULTADO_ABORDAGEM.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="bopm-card">
            <h2>5. Ponto do suspeito</h2>

            <div className="bopm-grid-2">
              <div className="bopm-field">
                <label>Nome (ou "Não identificado")</label>
                <input
                  value={suspeito.nome}
                  onChange={(e) => setSuspeito({ ...suspeito, nome: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Vestimenta</label>
                <input
                  value={suspeito.vestimenta}
                  onChange={(e) => setSuspeito({ ...suspeito, vestimenta: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Cor de pele</label>
                <input
                  value={suspeito.corPele}
                  onChange={(e) => setSuspeito({ ...suspeito, corPele: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Cabelo</label>
                <input
                  value={suspeito.cabelo}
                  onChange={(e) => setSuspeito({ ...suspeito, cabelo: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Barba</label>
                <input
                  value={suspeito.barba}
                  onChange={(e) => setSuspeito({ ...suspeito, barba: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Altura</label>
                <input
                  value={suspeito.altura}
                  onChange={(e) => setSuspeito({ ...suspeito, altura: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>Porte físico</label>
                <input
                  value={suspeito.porteFisico}
                  onChange={(e) => setSuspeito({ ...suspeito, porteFisico: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="bopm-card">
            <h2>6. Veículo do suspeito</h2>

            <label className="bopm-checkbox">
              <input
                type="checkbox"
                checked={veiculoSuspeito.possui}
                onChange={(e) =>
                  setVeiculoSuspeito({ ...veiculoSuspeito, possui: e.target.checked })
                }
              />
              O suspeito possuía veículo
            </label>

            {veiculoSuspeito.possui && (
              <div className="bopm-grid-2">
                <div className="bopm-field">
                  <label>Marca</label>
                  <input
                    value={veiculoSuspeito.marca}
                    onChange={(e) =>
                      setVeiculoSuspeito({ ...veiculoSuspeito, marca: e.target.value })
                    }
                  />
                </div>
                <div className="bopm-field">
                  <label>Modelo</label>
                  <input
                    value={veiculoSuspeito.modelo}
                    onChange={(e) =>
                      setVeiculoSuspeito({ ...veiculoSuspeito, modelo: e.target.value })
                    }
                  />
                </div>
                <div className="bopm-field">
                  <label>Cor</label>
                  <input
                    value={veiculoSuspeito.cor}
                    onChange={(e) =>
                      setVeiculoSuspeito({ ...veiculoSuspeito, cor: e.target.value })
                    }
                  />
                </div>
                <div className="bopm-field">
                  <label>Placa</label>
                  <input
                    value={veiculoSuspeito.placa}
                    onChange={(e) =>
                      setVeiculoSuspeito({ ...veiculoSuspeito, placa: e.target.value })
                    }
                  />
                </div>
              </div>
            )}
          </section>

          <section className="bopm-card">
            <h2>7. Ilícitos encontrados</h2>

            {ilicitos.map((item, index) => (
              <div key={index} className="bopm-repeater-row">
                <select
                  value={item.tipo}
                  onChange={(e) => atualizarIlicito(index, "tipo", e.target.value)}
                >
                  {TIPOS_ILICITO.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  placeholder={item.tipo === "Valores" ? "Ex: 4.407,00" : "Quantidade"}
                  value={item.quantidade}
                  onChange={(e) => atualizarIlicito(index, "quantidade", e.target.value)}
                />
                <input
                  placeholder="Descrição (opcional)"
                  value={item.descricao}
                  onChange={(e) => atualizarIlicito(index, "descricao", e.target.value)}
                />
                <button type="button" className="bopm-remove" onClick={() => removerIlicito(index)}>
                  ×
                </button>
              </div>
            ))}

            <button type="button" className="bopm-add" onClick={adicionarIlicito}>
              + Adicionar item ilícito
            </button>
          </section>

          <div className="bopm-actions">
            <button type="button" className="bopm-btn-primary" disabled={gerando} onClick={gerarBoletim}>
              {gerando ? "Gerando..." : "Gerar boletim"}
            </button>
          </div>
        </>
      )}

      {aba === "novo" && resultado && (
        <section className="bopm-card bopm-resultado">
          <h2>Boletim gerado</h2>
          <pre className="bopm-texto">{resultado.textoCompleto}</pre>

          <div className="bopm-actions">
            <button type="button" className="bopm-btn-primary" onClick={() => exportarPDF(resultado)}>
              Baixar PDF
            </button>
            <button
              type="button"
              className="bopm-btn-secondary"
              onClick={() => copiarTexto(resultado.textoCompleto)}
            >
              Copiar texto
            </button>
            <button type="button" className="bopm-btn-secondary" onClick={novoBoletim}>
              Gerar novo boletim
            </button>
          </div>
        </section>
      )}

      {aba === "historico" && (
        <section className="bopm-card">
          <h2>Meus boletins</h2>

          {carregandoHistorico && <p className="bopm-muted">Carregando...</p>}

          {!carregandoHistorico && historico.length === 0 && (
            <p className="bopm-muted">Nenhum boletim gerado ainda.</p>
          )}

          <div className="bopm-historico-lista">
            {historico.map((item) => (
              <button
                key={item._id}
                type="button"
                className="bopm-historico-item"
                onClick={() => abrirDetalheHistorico(item._id)}
              >
                <strong>{item.viatura}</strong>
                <span>
                  {item.local?.rua}, {item.local?.bairro}
                </span>
                <small>{formatarData(item.createdAt)}</small>
              </button>
            ))}
          </div>

          {detalheHistorico && (
            <div className="bopm-resultado" style={{ marginTop: 16 }}>
              <pre className="bopm-texto">{detalheHistorico.textoCompleto}</pre>

              <div className="bopm-actions">
                <button
                  type="button"
                  className="bopm-btn-primary"
                  onClick={() => exportarPDF(detalheHistorico)}
                >
                  Baixar PDF
                </button>
                <button
                  type="button"
                  className="bopm-btn-secondary"
                  onClick={() => copiarTexto(detalheHistorico.textoCompleto)}
                >
                  Copiar texto
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
