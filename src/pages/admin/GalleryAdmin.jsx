import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-base.css";

export default function GalleryAdmin() {
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

  const load = async () => {
    const res = await api.get("/api/gallery/admin");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // ================= ADICIONAR IMAGEM =================
  const submit = async () => {
    if (!form.titulo || !file) {
      alert("Título e imagem são obrigatórios");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("titulo", form.titulo);
    formData.append("descricao", form.descricao);
    formData.append("categoria", form.categoria);
    formData.append("publicado", form.publicado ? "true" : "false");
    formData.append("imagem", file);

    try {
      await api.post("/api/gallery", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setForm({
        titulo: "",
        descricao: "",
        categoria: "Geral",
        publicado: false
      });
      setFile(null);
      setPreview(null);
      load();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar imagem");
    } finally {
      setLoading(false);
    }
  };

  // ================= EXCLUIR IMAGEM =================
  const remove = async (id) => {
    if (!window.confirm("Excluir esta imagem da galeria?")) return;
    await api.delete(`/api/gallery/${id}`);
    load();
  };

  return (
    <div className="admin-page">
      <h1>Galeria (Admin)</h1>

      {/* ===== FORMULÁRIO ===== */}
      <div className="admin-section">
        <h3>Adicionar imagem</h3>

        <input
          placeholder="Título"
          value={form.titulo}
          onChange={e => setForm({ ...form, titulo: e.target.value })}
        />

        <input
          placeholder="Descrição"
          value={form.descricao}
          onChange={e => setForm({ ...form, descricao: e.target.value })}
        />

        <input
          type="file"
          accept="image/*"
          onChange={e => {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
          }}
        />

        {preview && (
          <img
            src={preview}
            alt="preview"
            style={{ maxWidth: 220, marginTop: 10 }}
          />
        )}

        <br /><br />

        <label>
          <input
            type="checkbox"
            checked={form.publicado}
            onChange={e =>
              setForm({ ...form, publicado: e.target.checked })
            }
          />{" "}
          Publicar na galeria pública
        </label>

        <br /><br />

        <button className="admin-btn" onClick={submit} disabled={loading}>
          {loading ? "Salvando..." : "Adicionar à Galeria"}
        </button>
      </div>

      {/* ===== LISTAGEM ===== */}
      <div className="admin-section">
        <h2>Imagens cadastradas</h2>

        {items.map(item => (
          <div
            key={item._id}
            className="admin-card"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              marginBottom: 15
            }}
          >
            <img
              src={item.imagem}
              alt={item.titulo}
              style={{ maxWidth: 120, cursor: "pointer" }}
              onClick={() => setAtivo(item.imagem)}
            />

            <div style={{ flex: 1 }}>
              <strong>{item.titulo}</strong>
              <p>{item.categoria}</p>
              <small>
                {item.publicado ? "Publicado" : "Não publicado"}
              </small>
            </div>

            <button
              className="admin-btn danger"
              onClick={() => remove(item._id)}
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      {/* ===== MODAL FULLSCREEN ===== */}
      {ativo && (
        <div className="gallery-modal" onClick={() => setAtivo(null)}>
          <span className="close">✕</span>
          <img src={ativo} alt="Imagem ampliada" />
        </div>
      )}
    </div>
  );
}
