import { useEffect, useState } from "react";
import api from "../../api/api";
import { useToast } from "../../contexts/ToastContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import "../../styles/admin-module-premium.css";

const GRID = "rgba(255,255,255,0.08)";
const AXIS = "#8b95a4";
const GOLD = "#c9a24d";
const BLUE = "#4f9cf9";

const tipStyle = {
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  color: "#e5e7eb",
  fontSize: 12
};

export default function ComandoGraficos() {
  const toast = useToast();
  const [dados, setDados] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/comando/graficos")
      .then((r) => setDados(r.data))
      .catch(() => toast.error("Erro ao carregar os gráficos"))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="admin-module-page">
      <div className="admin-module-topbar">
        <div>
          <h1>Gráficos do Comando</h1>
          <p>Evolução operacional das últimas 8 semanas.</p>
        </div>
      </div>

      {loading && <p style={{ color: "#8b95a4" }}>Carregando...</p>}

      {!loading && dados && (
        <>
          <section className="admin-module-section">
            <div className="admin-module-section-title">
              <div>
                <h2>Horas de patrulhamento por semana</h2>
                <span>Total do batalhão e média por policial (no fechamento de cada semana).</span>
              </div>
            </div>
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <LineChart data={dados.horasPorSemana}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="rotulo" stroke={AXIS} fontSize={12} />
                  <YAxis stroke={AXIS} fontSize={12} />
                  <Tooltip contentStyle={tipStyle} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="horas"
                    name="Total (h)"
                    stroke={GOLD}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="media"
                    name="Média/policial (h)"
                    stroke={BLUE}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-module-section">
            <div className="admin-module-section-title">
              <div>
                <h2>Ações aprovadas por semana</h2>
                <span>Contagem de ações aprovadas com data na semana.</span>
              </div>
            </div>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={dados.acoesPorSemana}>
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="rotulo" stroke={AXIS} fontSize={12} />
                  <YAxis stroke={AXIS} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="aprovadas" name="Aprovadas" fill={GOLD} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="admin-module-section">
            <div className="admin-module-section-title">
              <div>
                <h2>Ranking de horas no mês</h2>
                <span>Top {dados.rankingHoras.length} do efetivo ativo.</span>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                height: Math.max(200, dados.rankingHoras.length * 42)
              }}
            >
              <ResponsiveContainer>
                <BarChart
                  data={dados.rankingHoras}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid stroke={GRID} horizontal={false} />
                  <XAxis type="number" stroke={AXIS} fontSize={12} />
                  <YAxis
                    type="category"
                    dataKey="nome"
                    stroke={AXIS}
                    fontSize={11}
                    width={140}
                  />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="horas" name="Horas" fill={BLUE} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
