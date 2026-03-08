import { useState } from "react";
import api from "../api/api";

export default function Signup() {
  const [nome, setNome] = useState("");
  const [funcional, setFuncional] = useState("");
  const [email, setEmail] = useState("");

  const submit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/signup", {
        nome,
        funcional: Number(funcional),
        email
      });

      alert("Solicitação enviada com sucesso!");

      setNome("");
      setFuncional("");
      setEmail("");
    } catch (err) {
      alert(err.response?.data?.message || "Erro ao enviar solicitação");
    }
  };

  return (
    <div style={{ padding: 60 }}>
      <h1>Solicitação de Cadastro</h1>

      <form onSubmit={submit}>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Nome completo"
          required
        />

        <br /><br />

        <input
          value={funcional}
          onChange={e => setFuncional(e.target.value)}
          placeholder="Funcional"
          required
        />

        <br /><br />

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          required
        />

        <br /><br />

        <button type="submit">
          Enviar Solicitação
        </button>
      </form>
    </div>
  );
}
