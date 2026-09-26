import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import { useToast, useConfirm } from "../../contexts/ToastContext";
import { fetchPenalCode } from "../../services/penalCodeService";
import {
  criarBoletim,
  excluirBoletim,
  fetchBoletimById,
  fetchMeusBoletins,
  previewBoletim
} from "../../services/boletimOcorrenciaService";
import { exportarBoletimPDF } from "../../lib/exportarBoletimPDF";
import { RUAS_ANCHIETA } from "../../data/ruasAnchieta";
import { ARMAS_BOPM } from "../../data/armasBOPM";
import "./boletim-ocorrencia.css";

const CIDADE_FIXA = "Brasil Capital";

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
  { value: "HOSPITAL_PRESO", label: "Encaminhado ao hospital e preso" },
  { value: "HOSPITAL_LIBERADO", label: "Encaminhado ao hospital e liberado" },
  { value: "OBITO_IML", label: "Alvejado — óbito no local, conduzido ao IML" }
];

const PROCEDIMENTOS = [
  { value: "BUSCA_PESSOAL", label: "Busca pessoal" },
  { value: "BUSCA_VEICULAR", label: "Busca veicular" },
  { value: "USO_FORCA", label: "Uso de força para contenção" },
  { value: "APOIO_VTR", label: "Apoio de viatura de reforço" }
];

const TIPOS_ILICITO = ["Entorpecentes", "Armas", "Munições", "Ilicitos", "Valores"];

const SUBTIPOS_ENTORPECENTE = ["Maconha", "Ecstasy (Bala)", "Cocaína (Pó)", "Outro"];
const SUBTIPOS_ILICITO_DIVERSO = ["Capuz", "Algema", "Lockpick", "Bomba caseira", "Outro"];

const LOCAL_VAZIO = { rua: "", bairro: "" };

const ABORDAGEM_VAZIA = {
  tipo: "ABORDAGEM_PADRAO",
  ordemDadaPor: "",
  procedimentos: [],
  resultado: "LIBERADO"
};

const SUSPEITO_VAZIO = {
  nome: "Não identificado",
  rg: "",
  vestimenta: "",
  corPele: "",
  cabelo: ""
};

const VEICULO_VAZIO = { possui: false, marca: "", modelo: "", cor: "", placa: "" };

function formatarData(data) {
  if (!data) return "-";
  const v = new Date(data);
  return Number.isNaN(v.getTime()) ? "-" : v.toLocaleString("pt-BR");
}

/* =========================================================
   CAMPO DE RUA COM AUTOCOMPLETE (auto-preenche o bairro)
========================================================= */

function CampoLocal({ titulo, local, onChange }) {
  const [sugestoes, setSugestoes] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const buscarRuas = (termo) => {
    const t = termo.trim().toLowerCase();
    if (!t) {
      setSugestoes([]);
      return;
    }

    setSugestoes(
      RUAS_ANCHIETA.filter((r) => r.rua.toLowerCase().includes(t)).slice(0, 8)
    );
  };

  const selecionarRua = (item) => {
    onChange({ rua: item.rua, bairro: item.bairro === "—" ? "" : item.bairro });
    setMostrarSugestoes(false);
  };

  return (
    <div className="bopm-grid-2">
      <div className="bopm-field bopm-autocomplete">
        <label>{titulo} — Rua *</label>
        <input
          value={local.rua}
          onChange={(e) => {
            onChange({ ...local, rua: e.target.value });
            buscarRuas(e.target.value);
            setMostrarSugestoes(true);
          }}
          onFocus={() => setMostrarSugestoes(sugestoes.length > 0)}
          onBlur={() => setTimeout(() => setMostrarSugestoes(false), 150)}
          placeholder="Digite a rua..."
          autoComplete="off"
        />

        {mostrarSugestoes && sugestoes.length > 0 && (
          <div className="bopm-autocomplete-lista">
            {sugestoes.map((item) => (
              <button
                type="button"
                key={item.rua}
                onMouseDown={() => selecionarRua(item)}
              >
                {item.rua}
                {item.bairro !== "—" && (
                  <span className="bopm-autocomplete-bairro"> — {item.bairro}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bopm-field">
        <label>{titulo} — Bairro *</label>
        <input
          value={local.bairro}
          onChange={(e) => onChange({ ...local, bairro: e.target.value })}
          placeholder="Preenchido pela rua, ou digite manualmente"
        />
      </div>
    </div>
  );
}

export default function BoletimOcorrencia() {
  const toast = useToast();
  const confirm = useConfirm();

  const [aba, setAba] = useState("novo");

  const [meusRSOs, setMeusRSOs] = useState([]);
  const [rsoSelecionado, setRsoSelecionado] = useState("");

  const [viatura, setViatura] = useState("");
  const [equipe, setEquipe] = useState([]);

  const [artigos, setArtigos] = useState([]);
  const [buscaArtigo, setBuscaArtigo] = useState("");
  const [artigosSelecionados, setArtigosSelecionados] = useState([]);

  const [localAbordagem, setLocalAbordagem] = useState(LOCAL_VAZIO);
  const [houvePerseguicao, setHouvePerseguicao] = useState(false);
  const [localFinalizacao, setLocalFinalizacao] = useState(LOCAL_VAZIO);

  const [abordagem, setAbordagem] = useState(ABORDAGEM_VAZIA);
  const [suspeito, setSuspeito] = useState(SUSPEITO_VAZIO);
  const [veiculoSuspeito, setVeiculoSuspeito] = useState(VEICULO_VAZIO);
  const [ilicitos, setIlicitos] = useState([]);

  const [gerandoPreview, setGerandoPreview] = useState(false);
  const [preview, setPreview] = useState(null);
  const [salvando, setSalvando] = useState(false);
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
          subtipo: "",
          serial: "",
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
    setIlicitos((prev) => [
      ...prev,
      { tipo: "Entorpecentes", subtipo: "Maconha", serial: "", quantidade: "", descricao: "" }
    ]);
  };

  const atualizarIlicito = (index, campo, valor) => {
    setIlicitos((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const atualizado = { ...item, [campo]: valor };

        // ao trocar o tipo, reseta o subtipo pro padrão daquele tipo
        if (campo === "tipo") {
          atualizado.subtipo =
            valor === "Entorpecentes"
              ? "Maconha"
              : valor === "Ilicitos"
              ? "Capuz"
              : valor === "Armas"
              ? ARMAS_BOPM[0]
              : "";
          atualizado.serial = "";
        }

        return atualizado;
      })
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
     MONTAR PAYLOAD
  ======================================================= */

  const montarPayload = () => ({
    rso: rsoSelecionado || null,
    viatura: viatura.trim(),
    equipe: equipe.filter((i) => i.nome.trim()),
    naturezaFatos: artigosSelecionados,
    localAbordagem,
    localFinalizacao: houvePerseguicao ? localFinalizacao : null,
    abordagem,
    suspeito,
    veiculoSuspeito,
    ilicitos: ilicitos.filter((i) => i.quantidade.trim() || i.descricao.trim())
  });

  const validarFormulario = () => {
    if (!viatura.trim()) {
      toast.error("Informe a viatura");
      return false;
    }

    if (artigosSelecionados.length === 0) {
      toast.error("Selecione ao menos um artigo na natureza dos fatos");
      return false;
    }

    if (!localAbordagem.rua.trim() || !localAbordagem.bairro.trim()) {
      toast.error("Informe rua e bairro do local da abordagem");
      return false;
    }

    if (!abordagem.ordemDadaPor.trim()) {
      toast.error("Informe quem deu a ordem de abordagem");
      return false;
    }

    return true;
  };

  /* =======================================================
     PRÉ-VISUALIZAR
  ======================================================= */

  const gerarPreview = async () => {
    if (!validarFormulario()) return;

    try {
      setGerandoPreview(true);
      const res = await previewBoletim(montarPayload());
      setPreview(res);
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao pré-visualizar boletim");
    } finally {
      setGerandoPreview(false);
    }
  };

  const voltarParaAjustar = () => {
    setPreview(null);
  };

  /* =======================================================
     CONFIRMAR E SALVAR
  ======================================================= */

  const confirmarESalvar = async () => {
    try {
      setSalvando(true);
      const res = await criarBoletim(montarPayload());
      setResultado(res.boletim);
      setPreview(null);
      toast.success("Boletim gerado com sucesso");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao gerar boletim");
    } finally {
      setSalvando(false);
    }
  };

  const novoBoletim = () => {
    setResultado(null);
    setPreview(null);
    setRsoSelecionado("");
    setViatura("");
    setEquipe([]);
    setArtigosSelecionados([]);
    setLocalAbordagem(LOCAL_VAZIO);
    setHouvePerseguicao(false);
    setLocalFinalizacao(LOCAL_VAZIO);
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

  const excluirDoHistorico = async (id) => {
    const ok = await confirm({
      tone: "danger",
      message: "Excluir este boletim? Essa ação não pode ser desfeita."
    });

    if (!ok) return;

    try {
      await excluirBoletim(id);
      setHistorico((prev) => prev.filter((item) => item._id !== id));

      if (detalheHistorico?._id === id) {
        setDetalheHistorico(null);
      }

      toast.success("Boletim excluído com sucesso");
    } catch (err) {
      toast.error(err.response?.data?.message || "Erro ao excluir boletim");
    }
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

      {aba === "novo" && !preview && !resultado && (
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
                    {a.artigo} — {a.titulo}
                  </button>
                ))}
              </div>
            )}

            {artigosSelecionados.length > 0 && (
              <div className="bopm-chips">
                {artigosSelecionados.map((a) => (
                  <span key={a.artigo} className="bopm-chip">
                    {a.artigo} — {a.titulo}
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

            <CampoLocal
              titulo="Local da abordagem"
              local={localAbordagem}
              onChange={setLocalAbordagem}
            />

            <label className="bopm-checkbox">
              <input
                type="checkbox"
                checked={houvePerseguicao}
                onChange={(e) => setHouvePerseguicao(e.target.checked)}
              />
              Houve perseguição / fuga — a ocorrência terminou em local diferente
            </label>

            {houvePerseguicao && (
              <CampoLocal
                titulo="Local de finalização da ocorrência"
                local={localFinalizacao}
                onChange={setLocalFinalizacao}
              />
            )}

            <p className="bopm-muted">Cidade: {CIDADE_FIXA} (fixo)</p>
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
            <h2>5. Dados do suspeito</h2>

            <div className="bopm-grid-2">
              <div className="bopm-field">
                <label>Nome (ou "Não identificado")</label>
                <input
                  value={suspeito.nome}
                  onChange={(e) => setSuspeito({ ...suspeito, nome: e.target.value })}
                />
              </div>
              <div className="bopm-field">
                <label>RG</label>
                <input
                  value={suspeito.rg}
                  onChange={(e) => setSuspeito({ ...suspeito, rg: e.target.value })}
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
              <div key={index} className="bopm-ilicito-row">
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

                {item.tipo === "Entorpecentes" && (
                  <select
                    value={item.subtipo}
                    onChange={(e) => atualizarIlicito(index, "subtipo", e.target.value)}
                  >
                    {SUBTIPOS_ENTORPECENTE.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}

                {item.tipo === "Ilicitos" && (
                  <select
                    value={item.subtipo}
                    onChange={(e) => atualizarIlicito(index, "subtipo", e.target.value)}
                  >
                    {SUBTIPOS_ILICITO_DIVERSO.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                )}

                {item.tipo === "Armas" && (
                  <>
                    <select
                      value={item.subtipo}
                      onChange={(e) => atualizarIlicito(index, "subtipo", e.target.value)}
                    >
                      {ARMAS_BOPM.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <input
                      placeholder="Nº de série"
                      value={item.serial}
                      onChange={(e) => atualizarIlicito(index, "serial", e.target.value)}
                    />
                  </>
                )}

                {item.tipo === "Munições" && (
                  <input
                    placeholder="Arma correspondente (ex: AK 103)"
                    value={item.subtipo}
                    onChange={(e) => atualizarIlicito(index, "subtipo", e.target.value)}
                  />
                )}

                <input
                  placeholder={
                    item.tipo === "Valores"
                      ? "Ex: 4.407,00"
                      : (item.tipo === "Entorpecentes" && item.subtipo === "Outro") ||
                        (item.tipo === "Ilicitos" && item.subtipo === "Outro")
                      ? "Descreva o item"
                      : "Quantidade"
                  }
                  value={item.quantidade}
                  onChange={(e) => atualizarIlicito(index, "quantidade", e.target.value)}
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
            <button
              type="button"
              className="bopm-btn-primary"
              disabled={gerandoPreview}
              onClick={gerarPreview}
            >
              {gerandoPreview ? "Gerando..." : "Pré-visualizar boletim"}
            </button>
          </div>
        </>
      )}

      {aba === "novo" && preview && !resultado && (
        <section className="bopm-card bopm-resultado">
          <h2>Pré-visualização</h2>
          <p className="bopm-muted">
            Confira o texto abaixo. Se algo estiver errado, volte e ajuste os campos.
          </p>
          <pre className="bopm-texto">{preview.textoCompleto}</pre>

          <div className="bopm-actions">
            <button
              type="button"
              className="bopm-btn-primary"
              disabled={salvando}
              onClick={confirmarESalvar}
            >
              {salvando ? "Salvando..." : "Confirmar e salvar boletim"}
            </button>
            <button type="button" className="bopm-btn-secondary" onClick={voltarParaAjustar}>
              Voltar e ajustar
            </button>
          </div>
        </section>
      )}

      {aba === "novo" && resultado && (
        <section className="bopm-card bopm-resultado">
          <h2>Boletim gerado</h2>
          <pre className="bopm-texto">{resultado.textoCompleto}</pre>

          <div className="bopm-actions">
            <button type="button" className="bopm-btn-primary" onClick={() => exportarBoletimPDF(resultado)}>
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
              <div key={item._id} className="bopm-historico-row">
                <button
                  type="button"
                  className="bopm-historico-item"
                  onClick={() => abrirDetalheHistorico(item._id)}
                >
                  <strong>{item.viatura}</strong>
                  <span>
                    {item.localAbordagem?.rua}, {item.localAbordagem?.bairro}
                  </span>
                  <small>{formatarData(item.createdAt)}</small>
                </button>

                <button
                  type="button"
                  className="bopm-historico-excluir"
                  title="Excluir boletim"
                  onClick={() => excluirDoHistorico(item._id)}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>

          {detalheHistorico && (
            <div className="bopm-resultado" style={{ marginTop: 16 }}>
              <pre className="bopm-texto">{detalheHistorico.textoCompleto}</pre>

              <div className="bopm-actions">
                <button
                  type="button"
                  className="bopm-btn-primary"
                  onClick={() => exportarBoletimPDF(detalheHistorico)}
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
