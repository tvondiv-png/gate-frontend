import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const ORDEM_PATENTES = {
  "Coronel PM": 1,
  "Tenente-Coronel PM": 2,
  "Major PM": 3,
  "Capitão PM": 4,
  "1º Tenente PM": 5,
  "2º Tenente PM": 6,
  "Aspirante a Oficial PM": 7,
  "Subtenente PM": 8,
  "1º Sargento PM": 9,
  "2º Sargento PM": 10,
  "3º Sargento PM": 11,
  "Cabo PM": 12,
  "Soldado 1ª Classe PM": 13,
  "Soldado 2ª Classe PM": 14
};

const TIPOS = ["ADV 1", "ADV 2", "ADV 3"];

const ordenarPorPatente = (lista) => {
  return [...lista].sort((a, b) => {
    const ordemA = ORDEM_PATENTES[a.patente] || 999;
    const ordemB = ORDEM_PATENTES[b.patente] || 999;

    if (ordemA !== ordemB) return ordemA - ordemB;
    return String(a.nome || "").localeCompare(String(b.nome || ""), "pt-BR");
  });
};

const badgeClass = (tipo) => {
  if (tipo === "ADV 3") return "danger";
  if (tipo === "ADV 2") return "warning";
  return "info";
};

const getNivelAdv = (tipo) => {
  if (tipo === "ADV 3") return 3;
  if (tipo === "ADV 2") return 2;
  if (tipo === "ADV 1") return 1;
  return 0;
};

const getProximaAdv = (advAtual) => {
  if (!advAtual) return "ADV 1";
  if (advAtual === "ADV 1") return "ADV 2";
  if (advAtual === "ADV 2") return "ADV 3";
  return "ADV 3";
};

const getAdvertenciasAcumuladas = (tipo) => {
  if (tipo === "ADV 3") return ["ADV 1", "ADV 2", "ADV 3"];
  if (tipo === "ADV 2") return ["ADV 1", "ADV 2"];
  if (tipo === "ADV 1") return ["ADV 1"];
  return [];
};

export default function AdvertenciaAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [policiais, setPoliciais] = useState([]);
  const [advertencias, setAdvertencias] = useState([]);
  const [loading, setLoading] = useState(false);

  const [funcionaisSelecionadas, setFuncionaisSelecionadas] = useState([]);
  const [advertenciasSelecionadas, setAdvertenciasSelecionadas] = useState([]);

  const [tipo, setTipo] = useState("ADV 1");
  const [semanaReferencia, setSemanaReferencia] = useState("");

  const [filtroBusca, setFiltroBusca] = useState("");
  const [filtroAdvAtual, setFiltroAdvAtual] = useState("TODOS");

  const carregarPoliciais = async () => {
    try {
      const res = await api.get("/api/hierarchy/public");

      const lista = Object.values(res.data || {})
        .flatMap((c) => c.membros || [])
        .filter((p) => p.status === "Ativo");

      setPoliciais(ordenarPorPatente(lista));
    } catch (err) {
      console.error("Erro ao carregar policiais:", err);
      toast.error("Erro ao carregar lista de policiais.");
      setPoliciais([]);
    }
  };

  const carregarAdvertencias = async () => {
    try {
      const res = await api.get("/api/advertencias");
      setAdvertencias(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erro ao carregar advertências:", err);
      toast.error(err.response?.data?.message || "Erro ao carregar advertências.");
      setAdvertencias([]);
    }
  };

  const carregar = async () => {
    await Promise.all([carregarPoliciais(), carregarAdvertencias()]);
  };

  useEffect(() => {
    carregar();
  }, []);

  const advPorFuncional = useMemo(() => {
    const mapa = new Map();

    advertencias.forEach((a) => {
      const funcional = Number(a.funcional);
      const atual = mapa.get(funcional);

      if (!atual || getNivelAdv(a.tipo) > getNivelAdv(atual.tipo)) {
        mapa.set(funcional, a);
      }
    });

    return mapa;
  }, [advertencias]);

  const policiaisComAdv = useMemo(() => {
    return policiais.map((p) => {
      const advAtual = advPorFuncional.get(Number(p.funcional));

      return {
        ...p,
        advAtual: advAtual?.tipo || "",
        proximaAdv: getProximaAdv(advAtual?.tipo || "")
      };
    });
  }, [policiais, advPorFuncional]);

  const policiaisFiltrados = useMemo(() => {
    const busca = filtroBusca.trim().toLowerCase();

    return policiaisComAdv.filter((p) => {
      const texto = `${p.funcional} ${p.nome} ${p.patente}`.toLowerCase();

      const okBusca = busca ? texto.includes(busca) : true;

      const okAdv =
        filtroAdvAtual === "TODOS"
          ? true
          : filtroAdvAtual === "SEM_ADV"
          ? !p.advAtual
          : p.advAtual === filtroAdvAtual;

      return okBusca && okAdv;
    });
  }, [policiaisComAdv, filtroBusca, filtroAdvAtual]);

  const advertenciasFiltradas = useMemo(() => {
    if (filtroAdvAtual === "TODOS") return advertencias;

    if (filtroAdvAtual === "SEM_ADV") return [];

    return advertencias.filter((a) => a.tipo === filtroAdvAtual);
  }, [advertencias, filtroAdvAtual]);

  const togglePolicial = (funcional) => {
    setFuncionaisSelecionadas((prev) =>
      prev.includes(funcional)
        ? prev.filter((f) => f !== funcional)
        : [...prev, funcional]
    );
  };

  const toggleAdvertencia = (id) => {
    setAdvertenciasSelecionadas((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const selecionarTodosPoliciais = () => {
    const todos = policiais.map((p) => Number(p.funcional));
    setFuncionaisSelecionadas(todos);
  };

  const selecionarFiltrados = () => {
    const filtrados = policiaisFiltrados.map((p) => Number(p.funcional));
    setFuncionaisSelecionadas(filtrados);
  };

  const limparSelecaoPoliciais = () => {
    setFuncionaisSelecionadas([]);
  };

  const prepararProximaAdvDosFiltrados = () => {
    if (!policiaisFiltrados.length) {
      toast.warning("Nenhum policial encontrado no filtro.");
      return;
    }

    const selecionaveis = policiaisFiltrados.filter((p) => p.advAtual !== "ADV 3");

    if (!selecionaveis.length) {
      toast.warning("Todos os policiais filtrados já estão em ADV 3.");
      return;
    }

    const primeiraProxima = selecionaveis[0].proximaAdv;
    const todosMesmaProxima = selecionaveis.every(
      (p) => p.proximaAdv === primeiraProxima
    );

    if (!todosMesmaProxima) {
      toast.warning(
        "Os policiais filtrados possuem próximas ADV diferentes. Filtre por Sem ADV, ADV 1 ou ADV 2 antes de aplicar em lote."
      );
      return;
    }

    setTipo(primeiraProxima);
    setFuncionaisSelecionadas(selecionaveis.map((p) => Number(p.funcional)));
  };

  const selecionarAdvertenciasFiltradas = () => {
    const ids = advertenciasFiltradas.map((a) => a._id);
    setAdvertenciasSelecionadas(ids);
  };

  const selecionarTodasAdvertencias = () => {
    const todos = advertencias.map((a) => a._id);
    setAdvertenciasSelecionadas(todos);
  };

  const limparSelecaoAdvertencias = () => {
    setAdvertenciasSelecionadas([]);
  };

  const salvarAdvertencia = async () => {
    if (!funcionaisSelecionadas.length || !semanaReferencia) {
      toast.warning("Selecione ao menos um policial e a semana.");
      return;
    }

    try {
      setLoading(true);

      await api.post("/api/advertencias", {
        funcionais: funcionaisSelecionadas,
        tipo,
        semanaReferencia
      });

      toast.success("Advertência(s) aplicada(s) com sucesso!");
      setFuncionaisSelecionadas([]);
      setTipo("ADV 1");
      setSemanaReferencia("");
      await carregarAdvertencias();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao aplicar advertência.");
    } finally {
      setLoading(false);
    }
  };

  const excluirAdvertencia = async (id) => {
    if (!(await confirm({ tone: "danger", message: "Deseja excluir esta advertência?" }))) return;

    try {
      await api.delete(`/api/advertencias/${id}`);
      await carregarAdvertencias();
      setAdvertenciasSelecionadas((prev) => prev.filter((item) => item !== id));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao excluir advertência.");
    }
  };

  const excluirAdvertenciasSelecionadas = async () => {
    if (!advertenciasSelecionadas.length) {
      toast.warning("Selecione ao menos uma advertência.");
      return;
    }

    if (!(await confirm({ tone: "danger", message: "Deseja excluir as advertências selecionadas?" }))) return;

    try {
      await api.post("/api/advertencias/delete-many", {
        ids: advertenciasSelecionadas
      });

      toast.success("Advertência(s) removida(s) com sucesso!");
      setAdvertenciasSelecionadas([]);
      await carregarAdvertencias();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Erro ao excluir advertências.");
    }
  };

  const resumo = useMemo(() => {
    return {
      total: advertencias.length,
      semAdv: policiaisComAdv.filter((p) => !p.advAtual).length,
      adv1: policiaisComAdv.filter((p) => p.advAtual === "ADV 1").length,
      adv2: policiaisComAdv.filter((p) => p.advAtual === "ADV 2").length,
      adv3: policiaisComAdv.filter((p) => p.advAtual === "ADV 3").length
    };
  }, [advertencias, policiaisComAdv]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Advertências</h1>
          <p>Aplique, filtre e remova advertências disciplinares em lote.</p>
        </div>

        <button className="admin-module-btn blue" onClick={carregar}>
          Recarregar
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Registros</small>
          <strong>{resumo.total}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Sem ADV</small>
          <strong>{resumo.semAdv}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Com ADV 1</small>
          <strong>{resumo.adv1}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Com ADV 2</small>
          <strong>{resumo.adv2}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Com ADV 3</small>
          <strong>{resumo.adv3}</strong>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Aplicação de advertência</h2>
            <span>
              Use o filtro para selecionar quem não tem ADV, quem tem ADV 1, ADV 2 ou ADV 3.
            </span>
          </div>
        </div>

        <div className="admin-module-grid">
          <select
            className="admin-module-select"
            value={filtroAdvAtual}
            onChange={(e) => {
              setFiltroAdvAtual(e.target.value);
              setFuncionaisSelecionadas([]);
              setAdvertenciasSelecionadas([]);
            }}
          >
            <option value="TODOS">Mostrar todos</option>
            <option value="SEM_ADV">Somente quem não tem ADV</option>
            <option value="ADV 1">Somente quem tem ADV 1</option>
            <option value="ADV 2">Somente quem tem ADV 2</option>
            <option value="ADV 3">Somente quem tem ADV 3</option>
          </select>

          <input
            className="admin-module-input"
            placeholder="Buscar por nome, patente ou funcional"
            value={filtroBusca}
            onChange={(e) => setFiltroBusca(e.target.value)}
          />

          <select
            className="admin-module-select"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            {TIPOS.map((item) => (
              <option key={item} value={item}>
                Aplicar {item}
              </option>
            ))}
          </select>

          <input
            className="admin-module-input"
            placeholder="Semana referência"
            value={semanaReferencia}
            onChange={(e) => setSemanaReferencia(e.target.value)}
          />
        </div>

        <div className="admin-module-actions">
          <button className="admin-module-btn blue" onClick={selecionarFiltrados}>
            Selecionar somente filtrados
          </button>

          <button className="admin-module-btn warning" onClick={prepararProximaAdvDosFiltrados}>
            Preparar próxima ADV dos filtrados
          </button>

          <button className="admin-module-btn" onClick={selecionarTodosPoliciais}>
            Selecionar todos
          </button>

          <button className="admin-module-btn blue" onClick={limparSelecaoPoliciais}>
            Limpar seleção
          </button>

          <button className="admin-module-btn green" onClick={salvarAdvertencia} disabled={loading}>
            {loading ? "Salvando..." : "Aplicar advertência(s)"}
          </button>
        </div>

        <div style={{ marginTop: 12, opacity: 0.85 }}>
          Filtrados: <strong>{policiaisFiltrados.length}</strong> | Selecionados para aplicar:{" "}
          <strong>{funcionaisSelecionadas.length}</strong>
        </div>

        <div className="admin-module-table-wrap" style={{ marginTop: 16 }}>
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Sel.</th>
                <th>Funcional</th>
                <th>Nome</th>
                <th>Patente</th>
                <th>Status</th>
                <th>ADV Atual</th>
                <th>Próxima ADV</th>
              </tr>
            </thead>

            <tbody>
              {policiaisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Nenhum policial encontrado.
                  </td>
                </tr>
              ) : (
                policiaisFiltrados.map((p) => (
                  <tr key={p.funcional}>
                    <td>
                      <input
                        type="checkbox"
                        checked={funcionaisSelecionadas.includes(Number(p.funcional))}
                        onChange={() => togglePolicial(Number(p.funcional))}
                      />
                    </td>

                    <td>{p.funcional}</td>
                    <td>{p.nome}</td>
                    <td>{p.patente}</td>
                    <td>{p.status}</td>

                    <td>
                      {p.advAtual && (
                        <span className={`admin-module-badge ${badgeClass(p.advAtual)}`}>
                          {p.advAtual}
                        </span>
                      )}
                    </td>

                    <td>
                      {p.advAtual !== "ADV 3" && (
                        <span className={`admin-module-badge ${badgeClass(p.proximaAdv)}`}>
                          {p.proximaAdv}
                        </span>
                      )}

                      {p.advAtual === "ADV 3" && (
                        <span className="admin-module-badge danger">Exonerar</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Remoção de advertências</h2>
            <span>
              Filtre por tipo e remova advertências individuais ou em lote.
            </span>
          </div>
        </div>

        <div className="admin-module-actions">
          <button className="admin-module-btn blue" onClick={selecionarAdvertenciasFiltradas}>
            Selecionar advertências filtradas
          </button>

          <button className="admin-module-btn" onClick={selecionarTodasAdvertencias}>
            Selecionar todas
          </button>

          <button className="admin-module-btn blue" onClick={limparSelecaoAdvertencias}>
            Limpar seleção
          </button>

          <button className="admin-module-btn danger" onClick={excluirAdvertenciasSelecionadas}>
            Remover selecionadas
          </button>
        </div>

        <div style={{ marginTop: 12, opacity: 0.85 }}>
          Registros exibidos: <strong>{advertenciasFiltradas.length}</strong> | Selecionados para remover:{" "}
          <strong>{advertenciasSelecionadas.length}</strong>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>Sel.</th>
                <th>Funcional</th>
                <th>Nome</th>
                <th>Patente</th>
                <th>Tipo</th>
                <th>Semana</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {advertenciasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Nenhuma advertência encontrada para o filtro.
                  </td>
                </tr>
              ) : (
                advertenciasFiltradas.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={advertenciasSelecionadas.includes(a._id)}
                        onChange={() => toggleAdvertencia(a._id)}
                      />
                    </td>

                    <td>{a.funcional}</td>
                    <td>{a.nome}</td>
                    <td>{a.patente}</td>

                    <td>
                      <div className="adv-badges-inline">
                        {getAdvertenciasAcumuladas(a.tipo).map((adv) => (
                          <span key={adv} className={`admin-module-badge ${badgeClass(adv)}`}>
                            {adv}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>{a.semanaReferencia}</td>

                    <td>
                      <button
                        className="admin-module-btn danger"
                        onClick={() => excluirAdvertencia(a._id)}
                      >
                        Remover
                      </button>
                    </td>
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