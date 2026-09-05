import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/api";
import "../../styles/balanco-operacional-admin.css";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

const formatarNumero = (valor) => {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
  }).format(Number(valor || 0));
};

const formatarInteiro = (valor) => {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 0
  }).format(Number(valor || 0));
};

const formatarMoeda = (valor) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(valor || 0));
};

const carregarImagem = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      reject(
        new Error(
          `Não foi possível carregar a imagem: ${src}`
        )
      );
    };

    img.src = src;
  });

const desenharImagemCover = (
  ctx,
  img,
  x,
  y,
  width,
  height
) => {
  const imgRatio =
    img.width / img.height;

  const boxRatio =
    width / height;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > boxRatio) {
    sw =
      img.height * boxRatio;

    sx =
      (img.width - sw) / 2;
  } else {
    sh =
      img.width / boxRatio;

    sy =
      (img.height - sh) / 2;
  }

  ctx.drawImage(
    img,
    sx,
    sy,
    sw,
    sh,
    x,
    y,
    width,
    height
  );
};

const desenharTextoComQuebra = (
  ctx,
  texto,
  x,
  y,
  maxWidth,
  lineHeight
) => {
  const palavras =
    String(texto).split(" ");

  let linha = "";
  let posY = y;

  palavras.forEach(
    (palavra, index) => {
      const teste =
        linha + palavra + " ";

      const largura =
        ctx.measureText(
          teste
        ).width;

      if (
        largura > maxWidth &&
        index > 0
      ) {
        ctx.fillText(
          linha.trim(),
          x,
          posY
        );

        linha =
          palavra + " ";

        posY += lineHeight;
      } else {
        linha = teste;
      }
    }
  );

  ctx.fillText(
    linha.trim(),
    x,
    posY
  );

  return posY;
};

export default function BalancoOperacionalAdmin() {
  const agora = new Date();

  const canvasRef =
    useRef(null);

  const [mes, setMes] =
    useState(
      agora.getMonth() + 1
    );

  const [ano, setAno] =
    useState(
      agora.getFullYear()
    );

  const [dados, setDados] =
    useState(null);

  const [historico, setHistorico] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [gerando, setGerando] =
    useState(false);

  const [fechado, setFechado] =
    useState(false);

  const [mensagem, setMensagem] =
    useState("");

  const periodoEhAtual =
    Number(mes) ===
      agora.getMonth() + 1 &&
    Number(ano) ===
      agora.getFullYear();

  const periodoTexto = useMemo(
    () =>
      `${MESES[
        Number(mes) - 1
      ]} de ${ano}`,
    [mes, ano]
  );

  /* =========================================================
     HISTÓRICO
  ========================================================= */

  const carregarHistorico =
    async () => {
      try {
        const res =
          await api.get(
            "/api/apreensoes/balanco/historico"
          );

        setHistorico(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(
          "Erro ao carregar histórico:",
          err
        );
      }
    };

  /* =========================================================
     PRÉVIA ATUAL
  ========================================================= */

  const carregarPreviewAtual =
    async () => {
      try {
        setLoading(true);
        setMensagem("");

        const res =
          await api.get(
            "/api/apreensoes/balanco/preview"
          );

        setDados({
          armas:
            Number(
              res.data?.armas || 0
            ),

          municoes:
            Number(
              res.data
                ?.municoes || 0
            ),

          entorpecentes:
            Number(
              res.data
                ?.entorpecentes || 0
            ),

          ilicitos:
            Number(
              res.data
                ?.ilicitos || 0
            ),

          valores:
            Number(
              res.data
                ?.valores || 0
            )
        });

        setFechado(false);

        setMensagem(
          "Exibindo os contadores atuais de apreensões."
        );
      } catch (err) {
        console.error(
          "Erro ao carregar prévia:",
          err
        );

        setDados(null);

        setMensagem(
          err?.response?.data
            ?.message ||
            "Erro ao carregar dados atuais."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     CARREGAR PERÍODO
  ========================================================= */

  const carregarPeriodo =
    async () => {
      try {
        setLoading(true);
        setMensagem("");

        const res =
          await api.get(
            `/api/apreensoes/balanco/${ano}/${mes}`
          );

        const item =
          res.data;

        setDados({
          armas:
            Number(
              item.armas || 0
            ),

          municoes:
            Number(
              item.municoes || 0
            ),

          entorpecentes:
            Number(
              item.entorpecentes ||
                0
            ),

          ilicitos:
            Number(
              item.ilicitos || 0
            ),

          valores:
            Number(
              item.valores || 0
            )
        });

        setFechado(true);

        setMensagem(
          `Balanço de ${periodoTexto} carregado do histórico.`
        );
      } catch (err) {
        if (
          err?.response?.status ===
          404
        ) {
          if (periodoEhAtual) {
            await carregarPreviewAtual();
            return;
          }

          setDados(null);
          setFechado(false);

          setMensagem(
            "Esse período ainda não possui balanço fechado."
          );

          return;
        }

        console.error(err);

        setDados(null);

        setMensagem(
          "Erro ao carregar o balanço."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     FECHAR BALANÇO
  ========================================================= */

  const fecharBalanco =
    async () => {
      if (!periodoEhAtual) {
        alert(
          "O fechamento deve ser feito para o período atual antes de zerar os contadores."
        );

        return;
      }

      if (
        !window.confirm(
          `Confirmar o fechamento do balanço de ${periodoTexto}?\n\nOs números ficarão arquivados permanentemente.`
        )
      ) {
        return;
      }

      try {
        setLoading(true);

        const res =
          await api.post(
            "/api/apreensoes/balanco/fechar",
            {
              mes:
                Number(mes),

              ano:
                Number(ano)
            }
          );

        const item =
          res.data.balance;

        setDados({
          armas:
            Number(
              item.armas || 0
            ),

          municoes:
            Number(
              item.municoes || 0
            ),

          entorpecentes:
            Number(
              item.entorpecentes ||
                0
            ),

          ilicitos:
            Number(
              item.ilicitos || 0
            ),

          valores:
            Number(
              item.valores || 0
            )
        });

        setFechado(true);

        setMensagem(
          `Balanço de ${periodoTexto} fechado e arquivado com sucesso.`
        );

        await carregarHistorico();

        alert(
          "Balanço fechado com sucesso."
        );
      } catch (err) {
        console.error(err);

        alert(
          err?.response?.data
            ?.message ||
            "Erro ao fechar balanço"
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     CARD DA ARTE
  ========================================================= */

  const desenharCard = ({
    ctx,
    x,
    y,
    width,
    height,
    valor,
    titulo,
    unidade,
    icone
  }) => {
    ctx.save();

    ctx.fillStyle =
      "rgba(4, 7, 12, 0.90)";

    ctx.strokeStyle =
      "rgba(218, 169, 0, 0.88)";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.roundRect(
      x,
      y,
      width,
      height,
      18
    );

    ctx.fill();
    ctx.stroke();

    /* ÍCONE */

    ctx.fillStyle =
      "#e3b600";

    ctx.font =
      "700 30px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      icone,
      x + width / 2,
      y + 45
    );

    /* VALOR */

    let tamanhoValor = 60;

    if (titulo === "Valores") {
      if (valor.length > 20) {
        tamanhoValor = 27;
      } else if (valor.length > 18) {
        tamanhoValor = 29;
      } else if (valor.length > 16) {
        tamanhoValor = 32;
      } else if (valor.length > 14) {
        tamanhoValor = 35;
      } else if (valor.length > 12) {
        tamanhoValor = 38;
      } else {
        tamanhoValor = 42;
      }
    } else {
      if (valor.length > 12) {
        tamanhoValor = 42;
      } else if (valor.length > 9) {
        tamanhoValor = 48;
      }
    }

    ctx.fillStyle =
      titulo === "Valores"
        ? "#ffffff"
        : "#ffffff";

    ctx.font =
      `900 ${tamanhoValor}px Arial`;

    ctx.textAlign =
      "center";

    ctx.fillText(
      valor,
      x + width / 2,
      y + 120
    );

    /* TÍTULO */

    ctx.fillStyle =
      "#e3b600";

    ctx.font =
      "800 24px Arial";

    ctx.fillText(
      titulo.toUpperCase(),
      x + width / 2,
      y + 164
    );

    /* UNIDADE */

    ctx.fillStyle =
      "#a8adb5";

    ctx.font =
      "400 17px Arial";

    ctx.fillText(
      unidade,
      x + width / 2,
      y + 195
    );

    ctx.restore();
  };

  /* =========================================================
     GERAR ARTE
  ========================================================= */

  const gerarArte = async (
    baixar = false
  ) => {
    if (!dados) {
      alert(
        "Carregue os dados antes de gerar a arte."
      );

      return;
    }

    try {
      setGerando(true);

      const [
        logo,
        fundoAnchieta
      ] =
        await Promise.all([
          carregarImagem(
            "/anchieta-logo.png"
          ),

          carregarImagem(
            "/balanco/anchieta-fundo.png"
          )
        ]);

      const canvas =
        canvasRef.current;

      const ctx =
        canvas.getContext("2d");

      canvas.width = 1920;
      canvas.height = 1080;

      /* =====================================================
         FUNDO
      ===================================================== */

      const bg =
        ctx.createLinearGradient(
          0,
          0,
          1920,
          1080
        );

      bg.addColorStop(
        0,
        "#020306"
      );

      bg.addColorStop(
        0.55,
        "#080b10"
      );

      bg.addColorStop(
        1,
        "#020305"
      );

      ctx.fillStyle = bg;

      ctx.fillRect(
        0,
        0,
        1920,
        1080
      );

      /* =====================================================
         IMAGEM ÚNICA DO ANCHIETA
      ===================================================== */

      ctx.save();

      ctx.globalAlpha =
        0.96;

      desenharImagemCover(
        ctx,
        fundoAnchieta,
        700,
        0,
        1220,
        610
      );

      const fundoOverlay =
        ctx.createLinearGradient(
          700,
          0,
          1280,
          0
        );

      fundoOverlay.addColorStop(
        0,
        "rgba(2,3,6,1)"
      );

      fundoOverlay.addColorStop(
        0.35,
        "rgba(2,3,6,0.72)"
      );

      fundoOverlay.addColorStop(
        0.70,
        "rgba(2,3,6,0.12)"
      );

      fundoOverlay.addColorStop(
        1,
        "rgba(2,3,6,0.04)"
      );

      ctx.fillStyle =
        fundoOverlay;

      ctx.fillRect(
        700,
        0,
        1220,
        610
      );

      ctx.restore();

      /* =====================================================
         ESCURECIMENTO INFERIOR
      ===================================================== */

      const inferior =
        ctx.createLinearGradient(
          0,
          450,
          0,
          730
        );

      inferior.addColorStop(
        0,
        "rgba(2,3,6,0)"
      );

      inferior.addColorStop(
        1,
        "rgba(2,3,6,1)"
      );

      ctx.fillStyle =
        inferior;

      ctx.fillRect(
        0,
        440,
        1920,
        330
      );

      /* =====================================================
         TEXTURA
      ===================================================== */

      ctx.save();

      ctx.globalAlpha =
        0.055;

      for (
        let i = 0;
        i < 2400;
        i += 1
      ) {
        const x =
          Math.random() *
          1920;

        const y =
          Math.random() *
          1080;

        ctx.fillStyle =
          Math.random() >
          0.55
            ? "#ffffff"
            : "#d8a900";

        ctx.fillRect(
          x,
          y,
          1,
          1
        );
      }

      ctx.restore();

      /* =====================================================
         LOGO
      ===================================================== */

      const logoAltura =
        195;

      const logoLargura =
        logo.width *
        (logoAltura /
          logo.height);

      ctx.drawImage(
        logo,
        62,
        45,
        logoLargura,
        logoAltura
      );

      /* =====================================================
         IDENTIDADE
      ===================================================== */

      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        "900 63px Arial";

      ctx.textAlign =
        "left";

      ctx.fillText(
        "2º BPChq",
        280,
        102
      );

      ctx.fillStyle =
        "#d8a900";

      ctx.font =
        "800 32px Arial";

      ctx.fillText(
        "BATALHÃO ANCHIETA",
        283,
        148
      );

      ctx.fillStyle =
        "#b6bac1";

      ctx.font =
        "500 19px Arial";

      ctx.fillText(
        "POLÍCIA MILITAR DO ESTADO DE SÃO PAULO",
        283,
        185
      );

      /* =====================================================
         LINHA
      ===================================================== */

      ctx.fillStyle =
        "#d8a900";

      ctx.fillRect(
        280,
        211,
        430,
        3
      );

      /* =====================================================
         TÍTULO
      ===================================================== */

      ctx.fillStyle =
        "#ffffff";

      ctx.font =
        "900 88px Arial";

      ctx.fillText(
        "BALANÇO",
        62,
        345
      );

      ctx.fillStyle =
        "#d8a900";

      ctx.fillText(
        "OPERACIONAL",
        62,
        438
      );

      /* =====================================================
         PERÍODO
      ===================================================== */

      ctx.fillStyle =
        "#d8a900";

      ctx.font =
        "800 31px Arial";

      ctx.fillText(
        `${MESES[
          Number(mes) - 1
        ].toUpperCase()} • ${ano}`,
        65,
        495
      );

      ctx.fillStyle =
        "#c6c9ce";

      ctx.font =
        "400 19px Arial";

      desenharTextoComQuebra(
        ctx,
        "Indicadores públicos consolidados das atividades operacionais do 2º BPChq Anchieta.",
        65,
        530,
        650,
        27
      );

      /* =====================================================
         CARDS
      ===================================================== */

      const cardY = 705;

      const margem = 46;
      const gap = 14;

      const cardWidth =
        (1920 -
          margem * 2 -
          gap * 4) /
        5;

      const cardHeight =
        245;

      const cards = [
        {
          valor:
            formatarInteiro(
              dados.armas
            ),

          titulo:
            "Armas",

          unidade:
            "Quantidade em unidades",

          icone: "⚔"
        },

        {
          valor:
            formatarInteiro(
              dados.municoes
            ),

          titulo:
            "Munições",

          unidade:
            "Quantidade em unidades",

          icone: "●"
        },

        {
          valor:
            formatarNumero(
              dados.entorpecentes
            ),

          titulo:
            "Entorpecentes",

          unidade:
            "Quantidade em Kg",

          icone: "▲"
        },

        {
          valor:
            formatarInteiro(
              dados.ilicitos
            ),

          titulo:
            "Ilícitos",

          unidade:
            "Quantidade em unidades",

          icone: "◆"
        },

        {
          valor:
            formatarMoeda(
              dados.valores
            ),

          titulo:
            "Valores",

          unidade:
            "Total em Reais (R$)",

          icone: "$"
        }
      ];

      cards.forEach(
        (card, index) => {
          desenharCard({
            ctx,

            x:
              margem +
              index *
                (cardWidth +
                  gap),

            y: cardY,

            width:
              cardWidth,

            height:
              cardHeight,

            ...card
          });
        }
      );

      /* =====================================================
         RODAPÉ
      ===================================================== */

      ctx.fillStyle =
        "#d8a900";

      ctx.fillRect(
        0,
        1058,
        1920,
        22
      );

      ctx.fillStyle =
        "#9ca1aa";

      ctx.font =
        "600 20px Arial";

      ctx.textAlign =
        "center";

      ctx.fillText(
        "2º BATALHÃO DE POLÍCIA DE CHOQUE • ANCHIETA",
        960,
        1026
      );

      /* =====================================================
         DOWNLOAD
      ===================================================== */

      if (baixar) {
        const link =
          document.createElement(
            "a"
          );

        const mesArquivo =
          String(mes).padStart(
            2,
            "0"
          );

        link.download =
          `balanco-operacional-2bpchq-${ano}-${mesArquivo}.png`;

        link.href =
          canvas.toDataURL(
            "image/png",
            1
          );

        link.click();
      }
    } catch (err) {
      console.error(
        "Erro ao gerar arte:",
        err
      );

      alert(
        err?.message ||
          "Erro ao gerar a arte."
      );
    } finally {
      setGerando(false);
    }
  };

  /* =========================================================
     ZERAR CONTADORES
  ========================================================= */

  const zerarContadores =
    async () => {
      if (!fechado) {
        alert(
          "Feche o balanço mensal antes de zerar os contadores."
        );

        return;
      }

      if (
        !window.confirm(
          "ATENÇÃO\n\nOs contadores atuais serão zerados.\n\nO balanço fechado continuará salvo no histórico.\n\nDeseja continuar?"
        )
      ) {
        return;
      }

      try {
        setLoading(true);

        await api.post(
          "/api/apreensoes/zerar"
        );

        alert(
          "Contadores zerados com sucesso."
        );

        await carregarPreviewAtual();
      } catch (err) {
        console.error(err);

        alert(
          "Erro ao zerar contadores."
        );
      } finally {
        setLoading(false);
      }
    };

  /* =========================================================
     INICIAL
  ========================================================= */

  useEffect(() => {
    carregarHistorico();
    carregarPreviewAtual();
  }, []);

  return (
    <div className="balanco-admin-page">

      <header className="balanco-admin-hero">

        <div>

          <span className="balanco-admin-kicker">
            COMUNICAÇÃO SOCIAL • 2º BPChq
          </span>

          <h1>
            Balanço Operacional
          </h1>

          <p>
            Fechamento mensal dos indicadores
            públicos de apreensões do
            2º Batalhão de Polícia de Choque
            — Anchieta.
          </p>

        </div>

      </header>

      <section className="balanco-admin-section">

        <div className="balanco-admin-section-title">

          <div>
            <h2>
              Período do balanço
            </h2>

            <span>
              Selecione o mês e o ano.
            </span>
          </div>

        </div>

        <div className="balanco-admin-filters">

          <div>

            <label>
              Mês
            </label>

            <select
              value={mes}
              onChange={(e) =>
                setMes(
                  Number(
                    e.target.value
                  )
                )
              }
            >
              {MESES.map(
                (
                  nome,
                  index
                ) => (
                  <option
                    key={nome}
                    value={
                      index + 1
                    }
                  >
                    {nome}
                  </option>
                )
              )}
            </select>

          </div>

          <div>

            <label>
              Ano
            </label>

            <input
              type="number"
              value={ano}
              min="2020"
              max="2100"
              onChange={(e) =>
                setAno(
                  Number(
                    e.target.value
                  )
                )
              }
            />

          </div>

          <button
            type="button"
            className="balanco-admin-btn blue"
            onClick={
              carregarPeriodo
            }
            disabled={loading}
          >
            {loading
              ? "Carregando..."
              : "Carregar período"}
          </button>

        </div>

        {mensagem && (
          <div className="balanco-admin-message">
            {mensagem}
          </div>
        )}

      </section>

      {dados && (
        <section className="balanco-admin-section">

          <div className="balanco-admin-section-title">

            <div>
              <h2>
                Indicadores
              </h2>

              <span>
                {periodoTexto}
              </span>
            </div>

            <span
              className={`balanco-admin-status ${
                fechado
                  ? "closed"
                  : "open"
              }`}
            >
              {fechado
                ? "BALANÇO FECHADO"
                : "CONTADORES ATUAIS"}
            </span>

          </div>

          <div className="balanco-admin-metrics">

            <div className="balanco-admin-metric">

              <small>
                Armas
              </small>

              <strong>
                {formatarInteiro(
                  dados.armas
                )}
              </strong>

              <span>
                unidades
              </span>

            </div>

            <div className="balanco-admin-metric">

              <small>
                Munições
              </small>

              <strong>
                {formatarInteiro(
                  dados.municoes
                )}
              </strong>

              <span>
                unidades
              </span>

            </div>

            <div className="balanco-admin-metric">

              <small>
                Entorpecentes
              </small>

              <strong>
                {formatarNumero(
                  dados.entorpecentes
                )}
              </strong>

              <span>
                kg
              </span>

            </div>

            <div className="balanco-admin-metric">

              <small>
                Ilícitos
              </small>

              <strong>
                {formatarInteiro(
                  dados.ilicitos
                )}
              </strong>

              <span>
                unidades
              </span>

            </div>

            <div className="balanco-admin-metric value">

              <small>
                Valores
              </small>

              <strong>
                {formatarMoeda(
                  dados.valores
                )}
              </strong>

              <span>
                reais
              </span>

            </div>

          </div>

          <div className="balanco-admin-actions">

            {!fechado &&
              periodoEhAtual && (
                <button
                  type="button"
                  className="balanco-admin-btn gold"
                  onClick={
                    fecharBalanco
                  }
                  disabled={loading}
                >
                  Fechar balanço mensal
                </button>
              )}

            <button
              type="button"
              className="balanco-admin-btn blue"
              onClick={() =>
                gerarArte(false)
              }
              disabled={gerando}
            >
              {gerando
                ? "Gerando..."
                : "Atualizar prévia"}
            </button>

            <button
              type="button"
              className="balanco-admin-btn green"
              onClick={() =>
                gerarArte(true)
              }
              disabled={gerando}
            >
              Gerar PNG 1920×1080
            </button>

          </div>

        </section>
      )}

      <section className="balanco-admin-section">

        <div className="balanco-admin-section-title">

          <div>
            <h2>
              Prévia da publicação
            </h2>

            <span>
              Comunicação Social • formato 16:9
            </span>
          </div>

        </div>

        <div className="balanco-admin-canvas-wrap">

          <canvas
            ref={canvasRef}
            className="balanco-admin-canvas"
            width="1920"
            height="1080"
          />

        </div>

      </section>

      <section className="balanco-admin-section">

        <div className="balanco-admin-section-title">

          <div>
            <h2>
              Histórico de balanços
            </h2>

            <span>
              Fechamentos mensais arquivados
            </span>
          </div>

        </div>

        {historico.length === 0 ? (
          <div className="balanco-admin-empty">
            Nenhum balanço fechado.
          </div>
        ) : (
          <div className="balanco-admin-history">

            {historico.map(
              (item) => (

                <button
                  type="button"
                  key={item._id}
                  className="balanco-admin-history-item"
                  onClick={() => {
                    setMes(
                      Number(
                        item.mes
                      )
                    );

                    setAno(
                      Number(
                        item.ano
                      )
                    );

                    setDados({
                      armas:
                        Number(
                          item.armas ||
                            0
                        ),

                      municoes:
                        Number(
                          item.municoes ||
                            0
                        ),

                      entorpecentes:
                        Number(
                          item.entorpecentes ||
                            0
                        ),

                      ilicitos:
                        Number(
                          item.ilicitos ||
                            0
                        ),

                      valores:
                        Number(
                          item.valores ||
                            0
                        )
                    });

                    setFechado(
                      true
                    );

                    setMensagem(
                      "Balanço carregado do histórico."
                    );
                  }}
                >

                  <strong>
                    {
                      MESES[
                        Number(
                          item.mes
                        ) - 1
                      ]
                    }{" "}
                    {item.ano}
                  </strong>

                  <span>
                    Armas:{" "}
                    {formatarInteiro(
                      item.armas
                    )}
                  </span>

                  <span>
                    Munições:{" "}
                    {formatarInteiro(
                      item.municoes
                    )}
                  </span>

                </button>
              )
            )}

          </div>
        )}

      </section>

      <section className="balanco-admin-danger">

        <div>

          <h2>
            Fechamento administrativo
          </h2>

          <p>
            Somente zere os contadores após
            conferir, fechar e gerar o balanço
            mensal.
          </p>

        </div>

        <button
          type="button"
          className="balanco-admin-btn danger"
          onClick={
            zerarContadores
          }
          disabled={
            loading ||
            !fechado
          }
        >
          Zerar contadores para o próximo mês
        </button>

      </section>

    </div>
  );
}