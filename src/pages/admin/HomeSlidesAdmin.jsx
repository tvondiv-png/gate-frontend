import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function HomeSlidesAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [slides, setSlides] = useState([]);

  const [imagem, setImagem] = useState(null);
  const [preview, setPreview] = useState(null);

  const [titulo, setTitulo] = useState("");
  const [ordem, setOrdem] = useState(0);
  const [ativoNovo, setAtivoNovo] = useState(true);

  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

  /* =========================================================
     URL DA IMAGEM
  ========================================================= */

  const getImageUrl = (imagemPath) => {
    if (!imagemPath) return "";

    if (
      imagemPath.startsWith("http")
    ) {
      return imagemPath;
    }

    if (
      imagemPath.startsWith("/")
    ) {
      return `${API_URL}${imagemPath}`;
    }

    return `${API_URL}/${imagemPath}`;
  };

  /* =========================================================
     CARREGAR
  ========================================================= */

  const carregar = async () => {
    try {
      setCarregando(true);

      const res = await api.get(
        "/api/slideshow/admin"
      );

      setSlides(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar slides:",
        err
      );

      setSlides([]);

      toast.error(
        err?.response?.data?.message ||
          "Erro ao carregar slideshow"
      );
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  /* =========================================================
     LIMPAR
  ========================================================= */

  const limparFormulario = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setImagem(null);
    setPreview(null);

    setTitulo("");
    setOrdem(0);
    setAtivoNovo(true);
  };

  /* =========================================================
     IMAGEM
  ========================================================= */

  const selecionarImagem = (e) => {
    const selected =
      e.target.files?.[0];

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    if (!selected) {
      setImagem(null);
      setPreview(null);
      return;
    }

    setImagem(selected);

    setPreview(
      URL.createObjectURL(
        selected
      )
    );
  };

  /* =========================================================
     CRIAR
  ========================================================= */

  const enviar = async () => {
    if (!imagem) {
      toast.warning(
        "Selecione uma imagem"
      );

      return;
    }

    try {
      setLoading(true);

      const form =
        new FormData();

      form.append(
        "imagem",
        imagem
      );

      form.append(
        "titulo",
        titulo.trim()
      );

      form.append(
        "ordem",
        String(
          Number(ordem) || 0
        )
      );

      form.append(
        "ativo",
        ativoNovo
          ? "true"
          : "false"
      );

      await api.post(
        "/api/slideshow/admin",
        form,
        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      );

      limparFormulario();

      await carregar();

      toast.success(
        "Slide adicionado com sucesso"
      );
    } catch (err) {
      console.error(
        "Erro ao enviar slide:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao enviar slide"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     EDITAR
  ========================================================= */

  const editar = async (
    slide
  ) => {
    const novoTitulo =
      window.prompt(
        "Título do slide:",
        slide.titulo || ""
      );

    if (
      novoTitulo === null
    ) {
      return;
    }

    const novaOrdem =
      window.prompt(
        "Ordem do slide:",
        String(
          slide.ordem ?? 0
        )
      );

    if (
      novaOrdem === null
    ) {
      return;
    }

    const ordemNumerica =
      Number(novaOrdem);

    if (
      Number.isNaN(
        ordemNumerica
      )
    ) {
      toast.warning(
        "Informe uma ordem válida"
      );

      return;
    }

    try {
      await api.put(
        `/api/slideshow/admin/${slide._id}`,
        {
          titulo:
            novoTitulo.trim(),

          ordem:
            ordemNumerica
        }
      );

      await carregar();

      toast.success(
        "Slide atualizado com sucesso"
      );
    } catch (err) {
      console.error(
        "Erro ao editar slide:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao editar slide"
      );
    }
  };

  /* =========================================================
     ATIVAR / DESATIVAR
  ========================================================= */

  const alternarAtivo = async (
    slide
  ) => {
    const novoStatus =
      !slide.ativo;

    const confirmar =
      await confirm({ tone: "danger", message: novoStatus
          ? "Ativar este slide na Home?"
          : "Desativar este slide da Home?" });

    if (!confirmar) {
      return;
    }

    try {
      await api.put(
        `/api/slideshow/admin/${slide._id}`,
        {
          ativo:
            novoStatus
        }
      );

      await carregar();
    } catch (err) {
      console.error(
        "Erro ao alterar status:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao alterar status do slide"
      );
    }
  };

  /* =========================================================
     EXCLUIR
  ========================================================= */

  const excluir = async (
    id,
    tituloSlide
  ) => {
    const confirmar =
      await confirm({ tone: "danger", message: `Excluir ${
          tituloSlide
            ? `"${tituloSlide}"`
            : "este slide"
        } do slideshow?` });

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(
        `/api/slideshow/admin/${id}`
      );

      await carregar();
    } catch (err) {
      console.error(
        "Erro ao excluir slide:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao excluir slide"
      );
    }
  };

  return (
    <div className="admin-module-page">

      {/* =====================================================
          TOPO
      ===================================================== */}

      <div className="admin-module-topbar">

        <div>
          <h1>
            Slideshow da Home
          </h1>

          <p>
            Gerencie imagens, ordem e
            visibilidade do slideshow da
            página inicial do 2º BPChq
            Anchieta.
          </p>
        </div>

        <button
          type="button"
          className="admin-module-btn blue"
          onClick={carregar}
          disabled={carregando}
        >
          {carregando
            ? "Carregando..."
            : "↻ Recarregar"}
        </button>

      </div>

      {/* =====================================================
          NOVO SLIDE
      ===================================================== */}

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              Adicionar slide
            </h2>

            <span>
              Cadastre uma nova imagem para
              o destaque principal da Home.
            </span>
          </div>

        </div>

        <div className="admin-module-grid">

          <input
            className="admin-module-input"
            type="text"
            placeholder="Título opcional"
            value={titulo}
            onChange={(e) =>
              setTitulo(
                e.target.value
              )
            }
          />

          <input
            className="admin-module-input"
            type="number"
            placeholder="Ordem"
            value={ordem}
            onChange={(e) =>
              setOrdem(
                e.target.value
              )
            }
          />

          <input
            className="admin-module-input"
            type="file"
            accept="image/*"
            onChange={
              selecionarImagem
            }
          />

        </div>

        <div
          style={{
            marginTop: 14
          }}
        >
          <label
            style={{
              display:
                "inline-flex",

              alignItems:
                "center",

              gap: 8,

              cursor:
                "pointer"
            }}
          >

            <input
              type="checkbox"
              checked={ativoNovo}
              onChange={(e) =>
                setAtivoNovo(
                  e.target.checked
                )
              }
            />

            Ativar na Home imediatamente

          </label>
        </div>

        {preview && (

          <div
            style={{
              marginTop: 16,
              maxWidth: 520
            }}
          >

            <img
              src={preview}
              alt="Pré-visualização"
              style={{
                width:
                  "100%",

                maxHeight:
                  260,

                display:
                  "block",

                objectFit:
                  "cover",

                borderRadius:
                  16,

                border:
                  "1px solid rgba(255,255,255,0.08)"
              }}
            />

            <div
              style={{
                marginTop: 8,

                color:
                  "rgba(255,255,255,0.60)",

                fontSize: 12
              }}
            >
              {imagem?.name}
            </div>

          </div>
        )}

        <div className="admin-module-actions">

          <button
            type="button"
            className="admin-module-btn"
            onClick={enviar}
            disabled={loading}
          >
            {loading
              ? "Enviando..."
              : "Adicionar ao Slideshow"}
          </button>

          {(imagem ||
            titulo ||
            Number(ordem) !== 0) && (

            <button
              type="button"
              className="admin-module-btn"
              onClick={
                limparFormulario
              }
              disabled={loading}
            >
              Limpar
            </button>
          )}

        </div>

      </section>

      {/* =====================================================
          LISTA
      ===================================================== */}

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              Slides cadastrados
            </h2>

            <span>
              Total: {slides.length}
            </span>
          </div>

        </div>

        {carregando ? (

          <div className="admin-module-empty">
            Carregando slides...
          </div>

        ) : slides.length ===
          0 ? (

          <div className="admin-module-empty">
            Nenhum slide cadastrado.
          </div>

        ) : (

          <div className="admin-module-image-grid">

            {slides.map((s) => (

              <div
                key={s._id}
                className="admin-module-image-card"
              >

                <img
                  src={getImageUrl(
                    s.imagem
                  )}
                  alt={
                    s.titulo ||
                    "Slide"
                  }
                />

                <div className="admin-module-image-body">

                  <strong>
                    {s.titulo ||
                      "Sem título"}
                  </strong>

                  <div>
                    Ordem:{" "}
                    {s.ordem ?? 0}
                  </div>

                  <small>
                    {s.ativo
                      ? "Ativo na Home"
                      : "Inativo"}
                  </small>

                  <div className="admin-module-actions">

                    <button
                      type="button"
                      className="admin-module-btn blue"
                      onClick={() =>
                        editar(s)
                      }
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      className={
                        s.ativo
                          ? "admin-module-btn"
                          : "admin-module-btn green"
                      }
                      onClick={() =>
                        alternarAtivo(
                          s
                        )
                      }
                    >
                      {s.ativo
                        ? "Desativar"
                        : "Ativar"}
                    </button>

                    <button
                      type="button"
                      className="admin-module-btn danger"
                      onClick={() =>
                        excluir(
                          s._id,
                          s.titulo
                        )
                      }
                    >
                      Excluir
                    </button>

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </div>
  );
}