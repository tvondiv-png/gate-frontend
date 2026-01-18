import { useEffect, useState } from "react";
import api from "../../api/api";

export default function HomeSlidesAdmin() {
  const [slides, setSlides] = useState([]);
  const [imagem, setImagem] = useState(null);

  const carregar = async () => {
    const res = await api.get("/api/slideshow/admin");
    setSlides(res.data);
  };

  useEffect(() => {
    carregar();
  }, []);

  const enviar = async () => {
    const form = new FormData();
    form.append("imagem", imagem);

    await api.post("/slideshow/admin", form);
    setImagem(null);
    carregar();
  };

  const excluir = async (id) => {
    await api.delete(`/slideshow/admin/${id}`);
    carregar();
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Slideshow da Home</h2>

      <input
        type="file"
        onChange={e => setImagem(e.target.files[0])}
      />
      <button onClick={enviar}>Enviar</button>

      <hr />

      {slides.map(s => (
        <div key={s._id}>
          <img
            src={`http://localhost:5000${s.imagem}`}
            style={{ width: 200 }}
          />
          <button onClick={() => excluir(s._id)}>Excluir</button>
        </div>
      ))}
    </div>
  );
}
