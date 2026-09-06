import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function GalleryAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [ativo, setAtivo] = useState(null);

  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    categoria: "Geral",
    publicado: false
  });

  /* =========================================================
     URL DA IMAGEM
  ========================================================= */

  const getImageUrl = (imagem) => {
    if (!imagem) return "";

    if (imagem.startsWith("http")) {
      return imagem;
    }

    if (imagem.startsWith("/")) {
      return `${API_URL}${imagem}`;
    }

    return `${API_URL}/uploads/gallery/${imagem}`;
  };

  /* =========================================================
     CARREGAR
  ========================================================= */

  const load = async () => {
    try {
      const res = await api.get(
        "/api/gallery/admin"
      );

      setItems(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar galeria:",
        err
      );

      setItems([]);

      toast.error(
        err?.response?.data?.message ||
          "Erro ao carregar galeria"
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     LIMPAR FORMULÁRIO
  ========================================================= */

  const limparFormulario = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setForm({
      titulo: "",
      descricao: "",
      categoria: "Geral",
      publicado: false
    });

    setFile(null);
    setPreview(null);
  };

  /* =========================================================
     CRIAR
  ========================================================= */

  const submit = async () => {
    if (!form.titulo.trim()) {
      toast.warning("Título é obrigatório");
      return;
    }

    if (!file) {
      toast.warning("Imagem é obrigatória");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append(
        "titulo",
        form.titulo.trim()
      );

      formData.append(
        "descricao",
        form.descricao.trim()
      );

      formData.append(
        "categoria",
        form.categoria.trim() ||
          "Geral"
      );

      formData.append(
        "publicado",
        form.publicado
          ? "true"
          : "false"
      );

      formData.append(
        "imagem",
        file
      );

      await api.post(
        "/api/gallery",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data"
          }
        }
      );

      limparFormulario();

      await load();

      toast.success(
        "Imagem adicionada com sucesso"
      );
    } catch (err) {
      console.error(
        "Erro ao salvar imagem:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao salvar imagem"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     EDITAR
  ========================================================= */

  const editarItem = async (item) => {
    const titulo = window.prompt(
      "Título:",
      item.titulo || ""
    );

    if (titulo === null) {
      return;
    }

    if (!titulo.trim()) {
      toast.warning(
        "O título não pode ficar vazio"
      );
      return;
    }

    const descricao = window.prompt(
      "Descrição:",
      item.descricao || ""
    );

    if (descricao === null) {
      return;
    }

    const categoria = window.prompt(
      "Categoria:",
      item.categoria || "Geral"
    );

    if (categoria === null) {
      return;
    }

    try {
      await api.put(
        `/api/gallery/${item._id}`,
        {
          titulo:
            titulo.trim(),

          descricao:
            descricao.trim(),

          categoria:
            categoria.trim() ||
            "Geral"
        }
      );

      await load();

      toast.success(
        "Registro atualizado com sucesso"
      );
    } catch (err) {
      console.error(
        "Erro ao editar imagem:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao editar imagem"
      );
    }
  };

  /* =========================================================
     PUBLICAR / DESPUBLICAR
  ========================================================= */

  const togglePublicado = async (
    item
  ) => {
    const novoStatus =
      !item.publicado;

    const mensagem =
      novoStatus
        ? "Publicar esta imagem na galeria pública?"
        : "Retirar esta imagem da galeria pública?";

    if (
      !(await confirm({ tone: "danger", message: mensagem }))
    ) {
      return;
    }

    try {
      await api.put(
        `/api/gallery/${item._id}`,
        {
          publicado:
            novoStatus
        }
      );

      await load();
    } catch (err) {
      console.error(
        "Erro ao alterar publicação:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao alterar publicação"
      );
    }
  };

  /* =========================================================
     EXCLUIR
  ========================================================= */

  const remove = async (
    id,
    titulo
  ) => {
    const confirmar =
      await confirm({ tone: "danger", message: `Excluir "${
          titulo || "esta imagem"
        }" da galeria?\n\nA imagem também será removida do servidor.` });

    if (!confirmar) {
      return;
    }

    try {
      await api.delete(
        `/api/gallery/${id}`
      );

      if (
        ativo &&
        ativo.id === id
      ) {
        setAtivo(null);
      }

      await load();
    } catch (err) {
      console.error(
        "Erro ao excluir imagem:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao excluir imagem"
      );
    }
  };

  /* =========================================================
     SELECIONAR ARQUIVO
  ========================================================= */

  const selecionarArquivo = (
    e
  ) => {
    const selected =
      e.target.files?.[0];

    if (preview) {
      URL.revokeObjectURL(
        preview
      );
    }

    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(selected);

    setPreview(
      URL.createObjectURL(
        selected
      )
    );
  };

  return (
    <div className="admin-module-page">

      {/* =====================================================
          TOPO
      ===================================================== */}

      <div className="admin-module-topbar">

        <div>
          <h1>
            Galeria Institucional
          </h1>

          <p>
            Cadastre, publique, edite,
            visualize e remova registros
            visuais do 2º BPChq Anchieta.
          </p>
        </div>

        <button
          type="button"
          className="admin-module-btn blue"
          onClick={load}
        >
          ↻ Recarregar
        </button>

      </div>

      {/* =====================================================
          NOVA IMAGEM
      ===================================================== */}

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              Adicionar imagem
            </h2>

            <span>
              Preencha as informações da
              nova publicação.
            </span>
          </div>

        </div>

        <div className="admin-module-grid">

          <input
            className="admin-module-input"
            placeholder="Título"
            value={form.titulo}
            onChange={(e) =>
              setForm({
                ...form,
                titulo:
                  e.target.value
              })
            }
          />

          <input
            className="admin-module-input"
            placeholder="Descrição"
            value={form.descricao}
            onChange={(e) =>
              setForm({
                ...form,
                descricao:
                  e.target.value
              })
            }
          />

          <input
            className="admin-module-input"
            placeholder="Categoria"
            value={form.categoria}
            onChange={(e) =>
              setForm({
                ...form,
                categoria:
                  e.target.value
              })
            }
          />

          <input
            className="admin-module-input"
            type="file"
            accept="image/*"
            onChange={
              selecionarArquivo
            }
          />

        </div>

        {/* ===================================================
            PREVIEW
        =================================================== */}

        {preview && (

          <div
            style={{
              marginTop: 16
            }}
          >

            <div
              style={{
                maxWidth: 300
              }}
            >

              <img
                src={preview}
                alt="Pré-visualização"
                style={{
                  display:
                    "block",

                  width:
                    "100%",

                  maxHeight:
                    220,

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
                  marginTop:
                    8,

                  color:
                    "rgba(255,255,255,0.60)",

                  fontSize:
                    12
                }}
              >
                {file?.name}
              </div>

            </div>

          </div>
        )}

        {/* ===================================================
            PUBLICAÇÃO
        =================================================== */}

        <div
          style={{
            marginTop: 16
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
              checked={
                form.publicado
              }
              onChange={(e) =>
                setForm({
                  ...form,

                  publicado:
                    e.target
                      .checked
                })
              }
            />

            Publicar imediatamente na
            galeria pública

          </label>

        </div>

        {/* ===================================================
            AÇÕES
        =================================================== */}

        <div className="admin-module-actions">

          <button
            type="button"
            className="admin-module-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? "Salvando..."
              : "Adicionar à Galeria"}
          </button>

          {(file ||
            form.titulo ||
            form.descricao) && (

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
          CADASTRADAS
      ===================================================== */}

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              Imagens cadastradas
            </h2>

            <span>
              Total: {items.length}
            </span>
          </div>

        </div>

        {items.length === 0 ? (

          <div className="admin-module-empty">
            Nenhuma imagem cadastrada.
          </div>

        ) : (

          <div className="admin-module-image-grid">

            {items.map((item) => {

              const imageUrl =
                getImageUrl(
                  item.imagem
                );

              return (

                <div
                  key={item._id}
                  className="admin-module-image-card"
                >

                  <img
                    src={imageUrl}
                    alt={
                      item.titulo ||
                      "Imagem institucional"
                    }
                    onClick={() =>
                      setAtivo({
                        id:
                          item._id,

                        url:
                          imageUrl,

                        titulo:
                          item.titulo
                      })
                    }
                    style={{
                      cursor:
                        "pointer"
                    }}
                  />

                  <div className="admin-module-image-body">

                    <strong>
                      {item.titulo}
                    </strong>

                    <div>
                      {item.categoria ||
                        "Geral"}
                    </div>

                    {item.descricao && (
                      <p
                        style={{
                          margin:
                            "6px 0",

                          color:
                            "rgba(255,255,255,0.62)",

                          fontSize:
                            13,

                          lineHeight:
                            1.5
                        }}
                      >
                        {item.descricao}
                      </p>
                    )}

                    <small>
                      {item.publicado
                        ? "Publicado na galeria pública"
                        : "Não publicado"}
                    </small>

                    {/* =======================================
                        AÇÕES
                    ======================================= */}

                    <div className="admin-module-actions">

                      <button
                        type="button"
                        className="admin-module-btn blue"
                        onClick={() =>
                          editarItem(
                            item
                          )
                        }
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className={
                          item.publicado
                            ? "admin-module-btn"
                            : "admin-module-btn green"
                        }
                        onClick={() =>
                          togglePublicado(
                            item
                          )
                        }
                      >
                        {item.publicado
                          ? "Retirar da Galeria"
                          : "Publicar"}
                      </button>

                      <button
                        type="button"
                        className="admin-module-btn danger"
                        onClick={() =>
                          remove(
                            item._id,
                            item.titulo
                          )
                        }
                      >
                        Excluir
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          MODAL
      ===================================================== */}

      {ativo && (

        <div
          className="admin-module-modal-backdrop"
          onClick={() =>
            setAtivo(null)
          }
        >

          <div
            className="admin-module-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {ativo.titulo && (
              <div
                style={{
                  marginBottom:
                    12
                }}
              >
                <strong>
                  {ativo.titulo}
                </strong>
              </div>
            )}

            <img
              src={ativo.url}
              alt={
                ativo.titulo ||
                "Imagem ampliada"
              }
              style={{
                width:
                  "100%",

                maxHeight:
                  "75vh",

                objectFit:
                  "contain",

                borderRadius:
                  16,

                background:
                  "#020617"
              }}
            />

            <div className="admin-module-actions">

              <button
                type="button"
                className="admin-module-btn blue"
                onClick={() =>
                  setAtivo(null)
                }
              >
                Fechar
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}