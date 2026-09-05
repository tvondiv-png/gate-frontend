import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

export default function ComandoProdutividade() {
  const [data, setData] = useState({
    resumo: [],
    rankingMensal: [],
    totais: {
      acoesValidas30Dias: 0,
      acoesValidasMes: 0
    },
    alertas: {
      metaConcluida: [],
      proximoDaMeta: []
    }
  });

  const carregar = async () => {
    try {
      const res = await api.get("/api/admin/actions/metrics");
      setData(
        res.data || {
          resumo: [],
          rankingMensal: [],
          totais: {
            acoesValidas30Dias: 0,
            acoesValidasMes: 0
          },
          alertas: {
            metaConcluida: [],
            proximoDaMeta: []
          }
        }
      );
    } catch (err) {
      console.error("Erro ao carregar produtividade:", err);
      setData({
        resumo: [],
        rankingMensal: [],
        totais: {
          acoesValidas30Dias: 0,
          acoesValidasMes: 0
        },
        alertas: {
          metaConcluida: [],
          proximoDaMeta: []
        }
      });
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Comando • Produtividade Operacional</h1>
          <p>
            Leitura executiva de ações, metas, ranking mensal e acompanhamento de desempenho.
          </p>
        </div>

        <button className="admin-module-btn blue" onClick={carregar}>
          Recarregar
        </button>
      </div>

      <section className="admin-module-summary-grid">
        <div className="admin-module-summary-card">
          <small>Ações válidas 30 dias</small>
          <strong>{data.totais?.acoesValidas30Dias || 0}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Ações válidas no mês</small>
          <strong>{data.totais?.acoesValidasMes || 0}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Meta concluída</small>
          <strong>{data.alertas?.metaConcluida?.length || 0}</strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Próximos da meta</small>
          <strong>{data.alertas?.proximoDaMeta?.length || 0}</strong>
        </div>
      </section>

      <section className="admin-module-grid-2">
        <div className="admin-module-section">
          <div className="admin-module-section-title">
            <div>
              <h2>Próximos da meta</h2>
              <span>Policiais perto de concluir a meta operacional.</span>
            </div>
          </div>

          <div className="admin-module-table-wrap">
            <table className="admin-module-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Patente</th>
                  <th>30 dias</th>
                  <th>Mês</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(data.alertas?.proximoDaMeta || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Nenhum policial próximo da meta.
                    </td>
                  </tr>
                ) : (
                  data.alertas.proximoDaMeta.map((item) => (
                    <tr key={item.userId}>
                      <td>{item.nome}</td>
                      <td>{item.patente}</td>
                      <td>{item.totalValidas30Dias}</td>
                      <td>{item.totalMes}</td>
                      <td>{item.statusMeta}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-module-section">
          <div className="admin-module-section-title">
            <div>
              <h2>Meta concluída</h2>
              <span>Policiais que já bateram a meta.</span>
            </div>
          </div>

          <div className="admin-module-table-wrap">
            <table className="admin-module-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Patente</th>
                  <th>30 dias</th>
                  <th>Mês</th>
                  <th>Aproveitamento</th>
                </tr>
              </thead>
              <tbody>
                {(data.alertas?.metaConcluida || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center" }}>
                      Nenhum policial concluiu a meta ainda.
                    </td>
                  </tr>
                ) : (
                  data.alertas.metaConcluida.map((item) => (
                    <tr key={item.userId}>
                      <td>{item.nome}</td>
                      <td>{item.patente}</td>
                      <td>{item.totalValidas30Dias}</td>
                      <td>{item.totalMes}</td>
                      <td>{item.aproveitamento}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="admin-module-section">
        <div className="admin-module-section-title">
          <div>
            <h2>Ranking mensal</h2>
            <span>Maior produção operacional do mês.</span>
          </div>
        </div>

        <div className="admin-module-table-wrap">
          <table className="admin-module-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>Patente</th>
                <th>Total mês</th>
                <th>Ganhas</th>
                <th>Perdidas</th>
                <th>Aproveitamento</th>
              </tr>
            </thead>
            <tbody>
              {(data.rankingMensal || []).length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    Nenhum ranking mensal disponível.
                  </td>
                </tr>
              ) : (
                data.rankingMensal.map((item, index) => (
                  <tr key={item.userId}>
                    <td>{index + 1}º</td>
                    <td>{item.nome}</td>
                    <td>{item.patente}</td>
                    <td>{item.totalMes}</td>
                    <td>{item.ganhasMes}</td>
                    <td>{item.perdidasMes}</td>
                    <td>{item.aproveitamento}%</td>
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