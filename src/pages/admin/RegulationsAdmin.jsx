import { useEffect, useMemo, useState } from "react";
import api from "../../api/api";
import "../../styles/admin-module-premium.css";

import { useToast, useConfirm } from "../../contexts/ToastContext";
const FORM_INICIAL = {
  titulo: "",
  descricao: "",
  conteudo: "",
  categoria: "GERAL",
  publicado: false
};

const labelCategoria = (
  categoria
) => {
  if (categoria === "ROCAM") {
    return "ROCAM";
  }

  return "Geral";
};

export default function RegulationsAdmin() {
  const toast = useToast();
  const confirm = useConfirm();
  const [regs, setRegs] =
    useState([]);

  const [form, setForm] =
    useState(FORM_INICIAL);

  const [editing, setEditing] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  /* =========================================================
     CARREGAR
  ========================================================= */

  const load = async () => {
    try {
      const res = await api.get(
        "/api/regulations/admin"
      );

      setRegs(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(
        "Erro ao carregar regulamentos:",
        err
      );

      setRegs([]);

      toast.error(
        err?.response?.data?.message ||
          "Erro ao carregar regulamentos"
      );
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================================================
     LIMPAR
  ========================================================= */

  const limpar = () => {
    setEditing(null);

    setForm(FORM_INICIAL);
  };

  /* =========================================================
     SALVAR
  ========================================================= */

  const submit = async () => {
    if (!form.titulo.trim()) {
      toast.warning(
        "Informe o título do regulamento"
      );

      return;
    }

    try {
      setLoading(true);

      if (editing) {
        await api.put(
          `/api/regulations/${editing}`,
          form
        );
      } else {
        await api.post(
          "/api/regulations",
          form
        );
      }

      limpar();

      await load();

      toast.success(
        editing
          ? "Regulamento atualizado com sucesso"
          : "Regulamento criado com sucesso"
      );
    } catch (err) {
      console.error(
        "Erro ao salvar regulamento:",
        err
      );

      toast.error(
        err?.response?.data?.message ||
          "Erro ao salvar regulamento"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     EDITAR
  ========================================================= */

  const edit = (r) => {
    setEditing(r._id);

    setForm({
      titulo:
        r.titulo || "",

      descricao:
        r.descricao || "",

      conteudo:
        r.conteudo || "",

      categoria:
        r.categoria ||
        "GERAL",

      publicado:
        !!r.publicado
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  /* =========================================================
     PUBLICAR / DESPUBLICAR
  ========================================================= */

  const togglePublicado = async (
    r
  ) => {
    try {
      await api.put(
        `/api/regulations/${r._id}`,
        {
          publicado:
            !r.publicado
        }
      );

      await load();
    } catch (err) {
      console.error(err);

      toast.error(
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
    if (
      !(await confirm({ tone: "danger", message: `Excluir o regulamento "${titulo}"?` }))
    ) {
      return;
    }

    try {
      await api.delete(
        `/api/regulations/${id}`
      );

      if (editing === id) {
        limpar();
      }

      await load();
    } catch (err) {
      console.error(err);

      toast.error(
        "Erro ao excluir regulamento"
      );
    }
  };

  /* =========================================================
     RESUMO
  ========================================================= */

  const resumo = useMemo(
    () => ({
      total:
        regs.length,

      gerais:
        regs.filter(
          (r) =>
            !r.categoria ||
            r.categoria ===
              "GERAL"
        ).length,

      rocam:
        regs.filter(
          (r) =>
            r.categoria ===
            "ROCAM"
        ).length,

      publicados:
        regs.filter(
          (r) => r.publicado
        ).length
    }),
    [regs]
  );

  return (
    <div className="admin-module-page">

      <div className="admin-module-topbar">

        <div>
          <h1>
            Regulamentos
          </h1>

          <p>
            Gerencie regulamentações gerais e
            normas específicas da ROCAM.
          </p>
        </div>

        <button
          className="admin-module-btn blue"
          onClick={load}
        >
          ↻ Recarregar
        </button>

      </div>

      <section className="admin-module-summary-grid">

        <div className="admin-module-summary-card">
          <small>Total</small>
          <strong>
            {resumo.total}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Gerais</small>
          <strong>
            {resumo.gerais}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>ROCAM</small>
          <strong>
            {resumo.rocam}
          </strong>
        </div>

        <div className="admin-module-summary-card">
          <small>Publicados</small>
          <strong>
            {resumo.publicados}
          </strong>
        </div>

      </section>

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              {editing
                ? "Editar Regulamento"
                : "Novo Regulamento"}
            </h2>

            <span>
              Cadastre o conteúdo institucional.
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

          <select
            className="admin-module-input"
            value={form.categoria}
            onChange={(e) =>
              setForm({
                ...form,
                categoria:
                  e.target.value
              })
            }
          >
            <option value="GERAL">
              Regulamento Geral
            </option>

            <option value="ROCAM">
              Regulamento ROCAM
            </option>
          </select>

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

        </div>

        <div
          style={{
            marginTop: 12
          }}
        >
          <textarea
            className="admin-module-textarea"
            placeholder="Conteúdo do regulamento"
            value={form.conteudo}
            onChange={(e) =>
              setForm({
                ...form,
                conteudo:
                  e.target.value
              })
            }
            rows={12}
          />
        </div>

        <div
          style={{
            marginTop: 14
          }}
        >
          <label>
            <input
              type="checkbox"
              checked={
                form.publicado
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  publicado:
                    e.target.checked
                })
              }
            />{" "}
            Publicar no portal público
          </label>
        </div>

        <div className="admin-module-actions">

          <button
            className="admin-module-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading
              ? "Salvando..."
              : editing
              ? "Salvar Alterações"
              : "Criar Regulamento"}
          </button>

          {editing && (
            <button
              className="admin-module-btn blue"
              onClick={limpar}
              disabled={loading}
            >
              Cancelar edição
            </button>
          )}

        </div>

      </section>

      <section className="admin-module-section">

        <div className="admin-module-section-title">

          <div>
            <h2>
              Regulamentos cadastrados
            </h2>

            <span>
              Total: {regs.length}
            </span>
          </div>

        </div>

        <div className="admin-module-table-wrap">

          <table className="admin-module-table">

            <thead>
              <tr>
                <th>Regulamento</th>
                <th>Categoria</th>
                <th>Publicado</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>

              {regs.map((r) => (

                <tr key={r._id}>

                  <td>
                    <strong>
                      {r.titulo}
                    </strong>

                    {r.descricao && (
                      <div
                        style={{
                          marginTop: 4,
                          color:
                            "rgba(255,255,255,0.58)",
                          fontSize: 12
                        }}
                      >
                        {r.descricao}
                      </div>
                    )}
                  </td>

                  <td>
                    <span
                      className={`admin-module-badge ${
                        r.categoria ===
                        "ROCAM"
                          ? "danger"
                          : "info"
                      }`}
                    >
                      {labelCategoria(
                        r.categoria
                      )}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`admin-module-badge ${
                        r.publicado
                          ? "success"
                          : "warning"
                      }`}
                    >
                      {r.publicado
                        ? "Publicado"
                        : "Não publicado"}
                    </span>
                  </td>

                  <td>
                    <div
                      className="admin-module-actions"
                      style={{
                        marginTop: 0
                      }}
                    >

                      <button
                        className="admin-module-btn blue"
                        onClick={() =>
                          edit(r)
                        }
                      >
                        Editar
                      </button>

                      <button
                        className={
                          r.publicado
                            ? "admin-module-btn"
                            : "admin-module-btn green"
                        }
                        onClick={() =>
                          togglePublicado(
                            r
                          )
                        }
                      >
                        {r.publicado
                          ? "Retirar publicação"
                          : "Publicar"}
                      </button>

                      <button
                        className="admin-module-btn danger"
                        onClick={() =>
                          remove(
                            r._id,
                            r.titulo
                          )
                        }
                      >
                        Excluir
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

              {regs.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    style={{
                      textAlign:
                        "center"
                    }}
                  >
                    Nenhum regulamento cadastrado.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}