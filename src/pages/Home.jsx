import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./home.css";

export default function Home() {
  const navigate = useNavigate();

  const [slides, setSlides] = useState([]);
  const [slideAtivo, setSlideAtivo] = useState(0);
  const [apreensoes, setApreensoes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===================== LOAD DADOS =====================
  useEffect(() => {
    async function carregarDados() {
      try {
        const [slidesRes, apreensoesRes] = await Promise.all([
          api.get("/api/slideshow/public"),
          api.get("/api/apreensoes/public")
        ]);

        // Slides
        if (Array.isArray(slidesRes.data)) {
          setSlides(slidesRes.data);
        } else {
          console.error("Slides inválidos:", slidesRes.data);
          setSlides([]);
        }

        // Apreensões
        if (Array.isArray(apreensoesRes.data)) {
          setApreensoes(apreensoesRes.data);
        } else {
          console.error("Apreensões inválidas:", apreensoesRes.data);
          setApreensoes([]);
        }

      } catch (error) {
        console.error("Erro ao carregar Home:", error);
        setSlides([]);
        setApreensoes([]);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  // ===================== SLIDESHOW =====================
  useEffect(() => {
    if (!slides.length) return;

    const timer = setInterval(() => {
      setSlideAtivo((prev) =>
        prev === slides.length - 1 ? 0 : prev + 1
      );
    }, 6000);

    return () => clearInterval(timer);
  }, [slides]);

  // ===================== APREENSÕES =====================
  const TIPOS = [
    { label: "Armas", tipo: "Armas" },
    { label: "Munições", tipo: "Munições" },
    { label: "Entorpecentes", tipo: "Entorpecentes" },
    { label: "Valores", tipo: "Valores" }
  ];

  const getQtd = (tipo) => {
    if (!Array.isArray(apreensoes)) return 0;

    const item = apreensoes.find(a => a.tipo === tipo);
    return item?.quantidade ?? 0;
  };

  // ===================== LOADING =====================
  if (loading) {
    return (
      <div className="home-page">
        <section className="home-hero">
          <div className="hero-overlay">
            <h1>Carregando...</h1>
          </div>
        </section>
      </div>
    );
  }

  // ===================== RENDER =====================
  return (
    <div className="home-page">

      {/* ================= HERO ================= */}
      <section
        className="home-hero"
        style={{
          backgroundImage: slides[slideAtivo]
            ? `url(http://localhost:5000${slides[slideAtivo].imagem})`
            : "none"
        }}
      >
        <div className="hero-overlay">
          <h1>4º BPCHQ — <span>GATE</span></h1>
          <p>Grupo de Ações Táticas Especiais</p>

          <div className="hero-actions">
            <button className="gate-btn" onClick={() => navigate("/entrar")}>
              Entrar no Sistema
            </button>
            <button className="gate-btn" onClick={() => navigate("/cadastro")}>
              Solicitar Cadastro
            </button>
          </div>
        </div>
      </section>

      {/* ================= APREENSÕES ================= */}
      <section className="gate-container">
        <h2 className="gate-title">Apreensões</h2>

        <div className="gate-stats">
          {TIPOS.map(({ label, tipo }) => (
            <div key={tipo} className="stat-card">
              <span className="numero">{getQtd(tipo)}</span>
              <span className="label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ================= ATUAÇÃO ================= */}
      <section className="gate-container">
        <h2 className="gate-title">Atuação Operacional</h2>
        <p className="gate-text">
          O GATE atua em situações de alto risco, preservando vidas e mantendo a
          ordem através de operações táticas especializadas em ambiente urbano.
        </p>
      </section>

      {/* ================= MISSÃO / VISÃO / VALORES ================= */}
      <section className="gate-container">
        <h2 className="gate-title">Missão, Visão e Valores</h2>

        <div className="gate-grid">
          <div className="panel-card">
            <h3>Missão</h3>
            <p>
              Atuar em ocorrências de alto risco com excelência tática,
              preservando vidas e garantindo a ordem pública em cenários críticos.
            </p>
          </div>

          <div className="panel-card">
            <h3>Visão</h3>
            <p>
              Ser referência em operações táticas especializadas dentro do
              RolePlay, mantendo profissionalismo, realismo e disciplina.
            </p>
          </div>

          <div className="panel-card">
            <h3>Valores</h3>
            <p>
              Disciplina, hierarquia, comprometimento, trabalho em equipe e
              respeito à vida.
            </p>
          </div>
        </div>
      </section>

      {/* ================= INSTAGRAM ================= */}
      <a
        href="https://www.instagram.com/reel/DSkaBnYEcUT/?igsh=ZjN3MXh1cnRhank4"
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-float"
      >
        📸 Instagram
      </a>

      {/* ================= FOOTER ================= */}
      <footer className="gate-footer">
        Aviso: Este projeto é destinado exclusivamente a fins de{" "}
        <strong>RolePlay</strong>. Todas as representações são fictícias.
      </footer>

    </div>
  );
}
