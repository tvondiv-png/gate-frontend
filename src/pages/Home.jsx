import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./home.css";

const API_URL = import.meta.env.VITE_API_URL;

function AnimatedNumber({ value, isCurrency = false, duration = 1400 }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const valorFinal = Number(value || 0);

    let animationFrame;
    let startTime;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;

      const progress = Math.min((timestamp - startTime) / duration, 1);
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = valorFinal * easeOutCubic;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(valorFinal);
      }
    };

    animationFrame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  if (isCurrency) {
    return (
      <span className="numero counter-glow">
        {displayValue.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </span>
    );
  }

  return (
    <span className="numero counter-glow">
      {Math.floor(displayValue).toLocaleString("pt-BR")}
    </span>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const [slides, setSlides] = useState([]);
  const [slideAtivo, setSlideAtivo] = useState(0);
  const [apreensoes, setApreensoes] = useState([]);
  const [loading, setLoading] = useState(true);

  const getMediaUrl = (arquivo) => {
    if (!arquivo) return "";

    if (arquivo.startsWith("http")) {
      return arquivo;
    }

    if (arquivo.startsWith("/")) {
      return `${API_URL}${arquivo}`;
    }

    return `${API_URL}/uploads/${arquivo}`;
  };

  useEffect(() => {
    async function carregarDados() {
      try {
        const [slidesRes, apreensoesRes] = await Promise.all([
          api.get("/api/slideshow/public"),
          api.get("/api/apreensoes/public"),
        ]);

        setSlides(
          Array.isArray(slidesRes.data)
            ? slidesRes.data
            : []
        );

        setApreensoes(
          Array.isArray(apreensoesRes.data)
            ? apreensoesRes.data
            : []
        );
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

  useEffect(() => {
    if (!slides.length) return;

    const timer = setInterval(() => {
      setSlideAtivo((prev) =>
        prev === slides.length - 1
          ? 0
          : prev + 1
      );
    }, 7000);

    return () => clearInterval(timer);
  }, [slides]);

  const TIPOS = useMemo(
    () => [
      {
        label: "Armas",
        tipo: "Armas",
        icone: "⚔",
        formato: "unidade",
      },
      {
        label: "Munições",
        tipo: "Munições",
        icone: "◉",
        formato: "unidade",
      },
      {
        label: "Entorpecentes",
        tipo: "Entorpecentes",
        icone: "⚠",
        formato: "kg",
      },
      {
        label: "Ilícitos",
        tipo: "Ilicitos",
        icone: "⛔",
        formato: "unidade",
      },
      {
        label: "Valores",
        tipo: "Valores",
        icone: "💰",
        formato: "real",
      },
    ],
    []
  );

  const getQtd = (tipo) => {
    if (!Array.isArray(apreensoes)) {
      return 0;
    }

    const item = apreensoes.find(
      (a) => a.tipo === tipo
    );

    return Number(item?.quantidade || 0);
  };

  const slideAtual =
    slides[slideAtivo] || null;

  const videoUrl =
    slideAtual?.video
      ? getMediaUrl(slideAtual.video)
      : "";

  const imageUrl =
    slideAtual?.imagem
      ? getMediaUrl(slideAtual.imagem)
      : "";

  if (loading) {
    return (
      <div className="home-page">
        <section className="home-hero militar-loading">
          <div className="hero-overlay">
            <div className="hero-content">
              <span className="hero-badge">
                2º BPChq • SISTEMA OPERACIONAL
              </span>

              <h1>
                Carregando ambiente operacional...
              </h1>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-page">

      {/* =====================================================
          HERO PRINCIPAL
      ===================================================== */}

      <section className="home-hero">

        <div className="hero-media-layer">

          {videoUrl ? (
            <video
              key={videoUrl}
              className="hero-video-bg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={imageUrl || ""}
            >
              <source
                src={videoUrl}
                type="video/mp4"
              />
            </video>
          ) : imageUrl ? (
            <div
              className="hero-image-bg"
              style={{
                backgroundImage: `url("${imageUrl}")`,
              }}
            />
          ) : (
            <div className="hero-image-bg hero-image-fallback" />
          )}

        </div>

        <div className="hero-overlay">

          <div className="hero-particles" />

          <div className="hero-content">

            <div className="hero-logo-wrap">
              <img
                src="/anchieta-logo.png"
                alt="Brasão do 2º BPChq Anchieta"
                className="hero-logo"
              />
            </div>

            <span className="hero-badge">
              2º BPChq • ANCHIETA
            </span>

            <h1>
              <span className="hero-light">
                2º BATALHÃO DE
              </span>

              <br />

              <span className="hero-gold">
                POLÍCIA DE CHOQUE
              </span>
            </h1>

            <p className="hero-subtitle">
              Disciplina, hierarquia e atuação operacional.
              Um ambiente institucional desenvolvido para
              integrar o efetivo, organizar registros e
              fortalecer a estrutura do 2º BPChq Anchieta.
            </p>

            <div className="hero-actions">

              <button
                className="gate-btn primary"
                onClick={() =>
                  navigate("/entrar")
                }
              >
                Entrar no Sistema
              </button>

              <button
                className="gate-btn"
                onClick={() =>
                  navigate("/cadastro")
                }
              >
                Solicitar Cadastro
              </button>

            </div>

            {!!slides.length && (
              <div className="hero-indicators">

                {slides.map((_, i) => (
                  <button
                    key={i}
                    className={`hero-dot ${
                      slideAtivo === i
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      setSlideAtivo(i)
                    }
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}

              </div>
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          RESUMO INSTITUCIONAL
      ===================================================== */}

      <section className="gate-container home-summary-strip">

        <div className="home-summary-card">
          <small>Unidade</small>

          <strong>
            2º Batalhão de Polícia de Choque
          </strong>
        </div>

        <div className="home-summary-card">
          <small>Identificação</small>

          <strong>
            2º BPChq • Anchieta
          </strong>
        </div>

        <div className="home-summary-card">
          <small>Ambiente</small>

          <strong>
            Operacional e Administrativo
          </strong>
        </div>

      </section>

      {/* =====================================================
          COMANDO
      ===================================================== */}

      <section className="gate-container comando-section">

        <div className="section-header">

          <span className="section-tag">
            COMANDO INSTITUCIONAL
          </span>

          <h2 className="gate-title">
            Comando do 2º BPChq
          </h2>

        </div>

        <div className="comando-grid">

          <div className="comando-card">

            <strong>
              Ten. Cel. PM Xing Ling
            </strong>

            <span>
              Comandante do 2º Batalhão de
              Polícia de Choque
            </span>

          </div>

          <div className="comando-card">

            <strong>
              Major PM João Martinelli
            </strong>

            <span>
              Subcomandante do 2º Batalhão de
              Polícia de Choque
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          APREENSÕES
      ===================================================== */}

      <section className="gate-container">

        <div className="section-header">

          <span className="section-tag">
            DADOS OPERACIONAIS
          </span>

          <h2 className="gate-title">
            Apreensões
          </h2>

          <p className="section-description">
            Indicadores públicos consolidados
            das atividades operacionais do
            2º BPChq Anchieta.
          </p>

        </div>

        <div className="gate-stats apreensoes-grid-5">

          {TIPOS.map(
            ({
              label,
              tipo,
              icone,
              formato,
            }) => {
              const valor = getQtd(tipo);

              return (
                <div
                  key={tipo}
                  className={`stat-card stat-card-premium ${
                    formato === "real"
                      ? "stat-card-money"
                      : ""
                  }`}
                >

                  <div className="stat-topline" />

                  <div className="stat-icon">
                    {icone}
                  </div>

                  <div
                    className={`stat-number-wrapper ${
                      formato === "real"
                        ? "money"
                        : ""
                    }`}
                  >
                    <AnimatedNumber
                      value={valor}
                      isCurrency={
                        formato === "real"
                      }
                    />
                  </div>

                  <span className="label">
                    {label}
                  </span>

                  <span className="stat-format">

                    {formato === "real"
                      ? "Total em Reais (R$)"
                      : formato === "kg"
                      ? "Quantidade em Kg"
                      : "Quantidade em unidades"}

                  </span>

                </div>
              );
            }
          )}

        </div>

      </section>

      {/* =====================================================
          ATUAÇÃO OPERACIONAL
      ===================================================== */}

      <section className="gate-container destaque-operacional">

        <div className="operacao-box">

          <div className="section-header left">

            <span className="section-tag">
              ATUAÇÃO
            </span>

            <h2 className="gate-title left">
              Atuação Operacional
            </h2>

          </div>

          <div className="operacao-grid">

            <div>

              <p className="gate-text left">
                O 2º BPChq Anchieta atua de forma
                organizada e disciplinada nas
                atividades operacionais previstas
                no ambiente RolePlay, mantendo
                integração entre comando, efetivo
                e estrutura administrativa.
              </p>

              <div className="operacao-actions">

                <button
                  className="gate-btn"
                  onClick={() =>
                    navigate("/hierarquia")
                  }
                >
                  Ver Hierarquia
                </button>

                <button
                  className="gate-btn"
                  onClick={() =>
                    navigate("/galeria")
                  }
                >
                  Ver Galeria
                </button>

              </div>

            </div>

            <div className="operacao-panel">

              <div className="operacao-panel-item">

                <strong>
                  Prontidão Operacional
                </strong>

                <span>
                  Organização, preparo e
                  coordenação do efetivo.
                </span>

              </div>

              <div className="operacao-panel-item">

                <strong>
                  Disciplina
                </strong>

                <span>
                  Respeito à estrutura,
                  procedimentos e hierarquia.
                </span>

              </div>

              <div className="operacao-panel-item">

                <strong>
                  Integração
                </strong>

                <span>
                  Trabalho em equipe e
                  comunicação entre os integrantes
                  da unidade.
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          CAPACIDADES
      ===================================================== */}

      <section className="gate-container">

        <div className="section-header">

          <span className="section-tag">
            ESTRUTURA OPERACIONAL
          </span>

          <h2 className="gate-title">
            Pilares da Unidade
          </h2>

          <p className="section-description">
            Princípios que orientam a organização,
            formação e atuação do efetivo.
          </p>

        </div>

        <div className="gate-grid especialidades-grid">

          <div className="panel-card panel-card-premium">

            <h3>
              Disciplina Operacional
            </h3>

            <p>
              Padronização de procedimentos,
              responsabilidade individual e
              cumprimento das diretrizes da
              unidade.
            </p>

          </div>

          <div className="panel-card panel-card-premium">

            <h3>
              Capacitação
            </h3>

            <p>
              Desenvolvimento contínuo do efetivo
              por meio de treinamentos,
              instruções e acompanhamento
              operacional.
            </p>

          </div>

          <div className="panel-card panel-card-premium">

            <h3>
              Trabalho em Equipe
            </h3>

            <p>
              Integração entre os integrantes da
              unidade, promovendo coordenação,
              comunicação e eficiência.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          MISSÃO / VISÃO / VALORES
      ===================================================== */}

      <section className="gate-container">

        <div className="section-header">

          <span className="section-tag">
            INSTITUCIONAL
          </span>

          <h2 className="gate-title">
            Missão, Visão e Valores
          </h2>

        </div>

        <div className="gate-grid">

          <div className="panel-card panel-card-premium">

            <h3>
              Missão
            </h3>

            <p>
              Promover uma experiência de
              RolePlay organizada, disciplinada
              e integrada, mantendo padrões de
              atuação compatíveis com a proposta
              institucional da unidade.
            </p>

          </div>

          <div className="panel-card panel-card-premium">

            <h3>
              Visão
            </h3>

            <p>
              Consolidar o 2º BPChq Anchieta como
              referência em organização,
              profissionalismo e qualidade dentro
              do ambiente RolePlay.
            </p>

          </div>

          <div className="panel-card panel-card-premium">

            <h3>
              Valores
            </h3>

            <p>
              Disciplina, hierarquia,
              comprometimento, respeito,
              responsabilidade e trabalho em
              equipe.
            </p>

          </div>

        </div>

      </section>

      {/* =====================================================
          CTA FINAL
      ===================================================== */}

      <section className="gate-container cta-final-section">

        <div className="cta-final-card">

          <span className="section-tag">
            SISTEMA OPERACIONAL
          </span>

          <h2>
            Acesse o ambiente operacional
            do 2º BPChq Anchieta
          </h2>

          <p>
            Entre no sistema para acompanhar
            registros, notificações, horas
            operacionais, hierarquia e demais
            funcionalidades administrativas
            da unidade.
          </p>

          <div className="hero-actions">

            <button
              className="gate-btn primary"
              onClick={() =>
                navigate("/entrar")
              }
            >
              Entrar
            </button>

            <button
              className="gate-btn"
              onClick={() =>
                navigate("/regulamentos")
              }
            >
              Ver Regulamentos
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          INSTAGRAM
      ===================================================== */}

      <a
        href="https://www.instagram.com/reel/DSkaBnYEcUT/?igsh=ZjN3MXh1cnRhank4"
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-float"
      >
        📸 Instagram
      </a>

      {/* =====================================================
          RODAPÉ
      ===================================================== */}

      <footer className="gate-footer">

        <div className="footer-content">

          <strong>
            2º BPChq — ANCHIETA
          </strong>

          <span>
            2º Batalhão de Polícia de Choque
            • Sistema Operacional
          </span>

          <p>
            Aviso: Este projeto é destinado
            exclusivamente a fins de{" "}
            <strong>RolePlay</strong>.
            Todas as representações são fictícias.
          </p>

          <p className="site-credit">
            Site criado por{" "}
            <strong>
               PM Brito Smith
            </strong>
          </p>

        </div>

      </footer>

    </div>
  );
}