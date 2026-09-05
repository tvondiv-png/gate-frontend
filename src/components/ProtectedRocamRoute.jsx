import {
  useEffect,
  useState
} from "react";

import {
  Navigate
} from "react-router-dom";

import api from "../api/api";

export default function ProtectedRocamRoute({
  children
}) {
  const [loading, setLoading] =
    useState(true);

  const [permitido, setPermitido] =
    useState(false);

  useEffect(() => {
    let ativo = true;

    const validar = async () => {
      try {
        const res =
          await api.get(
            "/api/rocam/contexto"
          );

        if (!ativo) return;

        setPermitido(
          res.data?.podeAcessar === true
        );
      } catch (err) {
        console.error(
          "Acesso ROCAM negado:",
          err
        );

        if (ativo) {
          setPermitido(false);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    };

    validar();

    return () => {
      ativo = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#05070a",
          color: "#fff"
        }}
      >
        Validando acesso ROCAM...
      </div>
    );
  }

  if (!permitido) {
    return (
      <Navigate
        to="/select-panel"
        replace
      />
    );
  }

  return children;
}