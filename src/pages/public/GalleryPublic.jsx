import { useEffect, useState } from "react";
import api from "../../api/api";
import "../../styles/public-pages.css";
import "../../styles/animations.css";

export default function GalleryPublic() {
  const [items, setItems] = useState([]);
  const [ativo, setAtivo] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await api.get("/api/gallery/public");
    setItems(res.data);
  };

  return (
    <div className="gallery-page page-enter">

      <h1>Galeria GATE</h1>

      <div className="gallery-grid">
        {items.map((item, i) => (
          <div
            key={item._id}
            className={`gallery-item fade-up fade-delay-${(i % 4) + 1}`}
            onClick={() =>
              setAtivo(`http://localhost:5000/uploads/gallery/${item.imagem}`)
            }
          >
            <img
              src={`http://localhost:5000/uploads/gallery/${item.imagem}`}
              alt={item.titulo}
            />
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
