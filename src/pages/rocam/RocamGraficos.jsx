import { useEffect, useState } from "react";
import api from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import "../../styles/admin-module-premium.css";
import "../../styles/rocam-graficos.css";

const GRID = "rgba(255,255,255,0.08)";
const AXIS = "#8b95a4";
const GOLD = "#c9a24d";
const BLUE = "#4f9cf9";

const CORES_STATUS = {
  APROVADO: "#22c55e",
  REPROVADO: "#ef4444",
  CANCELADO: "#64748b",
  DESLIGADO: "#f59e0b"
};

const LABEL_STATUS = {
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  CANCELADO: "Cancelado",
  DESLIGADO: "Desligado"
};

const tipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "#e5e7eb",
  fontSize: 12
};

export default function RocamGraficos() {
  const toast = useToast();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/rocam/comando/graficos")
      .then((r) => setDados(r.data))
      .catch(() => toast.error("Erro ao carregar os gráficos ROCAM"))
      .finally(() => setLoading(false));
  }, [toast]);

  const statusData = (dados?.statusEstagios || []).map((item) => ({
    ...item,
    label: LABEL_STATUS[item.status] || item.status
  }));

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Gráficos ROCAM</h1>
          <p>Progresso dos estagiários, produtividade dos braçais e histórico de estágios.</p>
        </div>
      </div>

      {loading && <p style={{ color: "#8b95a4" }}>Carregando...</p>}

      {!loading && dados && (
        <>
          <section className="admin-module-section">
            <div className="admin-module-section-title">
              <div>
                <h2>Tempo médio de aprovação</h2>
                <span>
                  Baseado em {dados.totalAprovadosConsiderados} estágio(s)
                  aprovado(s).
                </span>
              </div>
            </div>
            <div className="rocam-graficos-destaque">
              <strong>{dados.tempoMedioAprovacaoDias}</strong>
              <span>dias, em média, do início do estágio até a aprovação</span>
            </div>
          </section>

          <section className="admin-module-section">
            <div className="admin-module-section-title">
              <div>
                <h2>Progresso dos estagiários ativos</h2>
                <span>Percentual geral de cada estagiário em estágio aberto.</span>
              </div>
            </div>
            {dados.progressoEstagiarios.length === 0 ? (
              <p style={{ color: "#8b95a4" }}>Nenhum estagiário ativo no momento.</p>
            ) : (
              <div style={{ width: "100%", height: Math.max(220, dados.progressoEstagiarios.length * 42) }}>
                <ResponsiveContainer>
                  <BarChart
                    data={dados.progressoEstagiarios}
                    layout="vertical"
                    margin={{ left: 10, right: 20 }}
                  >
                    <CartesianGrid stroke={GRID} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke={AXIS} fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="nome"
                      stroke={AXIS}
                      fontSize={11}
                      width={140}
                    />
                    <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="percentual" name="Progresso (%)" fill={GOLD} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="admin-module-section">
            <div className="admin-module-section-title">
              <div>
                <h2>Avaliações por Braçal (mês atual)</h2>
                <span>Quantidade de avaliações enviadas e nota média.</span>
              </div>
            </div>
            {dados.avaliacoesPorBracal.length === 0 ? (
              <p style={{ color: "#8b95a4" }}>Nenhuma avaliação registrada este mês.</p>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={dados.avaliacoesPorBracal}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="nome" stroke={AXIS} fontSize={11} />
                    <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Legend />
                    <Bar dataKey="total" name="Avaliações" fill={BLUE} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="admin-module-section">
            <div className="admin-module-section-title">
              <div>
                <h2>Desfecho dos estágios</h2>
                <span>Aprovados, reprovados, cancelados e desligados (histórico total).</span>
              </div>
            </div>
            {statusData.length === 0 ? (
              <p style={{ color: "#8b95a4" }}>Sem estágios concluídos ainda.</p>
            ) : (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="total"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {statusData.map((item) => (
                        <Cell
                          key={item.status}
                          fill={CORES_STATUS[item.status] || "#8b95a4"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
