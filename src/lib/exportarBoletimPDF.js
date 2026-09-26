import jsPDF from "jspdf";

/* =========================================================
   EXPORTAR BOLETIM DE OCORRÊNCIA EM PDF (client-side, sem custo)
========================================================= */

export function exportarBoletimPDF(boletim) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  const maxWidth = 180;
  const lineHeight = 6;
  let y = 20;

  const linhas = String(boletim.textoCompleto || "").split("\n");

  linhas.forEach((linha) => {
    const ehTitulo =
      linha.trim().length > 2 &&
      linha.trim() === linha.trim().toUpperCase() &&
      /[A-ZÀ-Ú]/.test(linha);

    const wrapped = doc.splitTextToSize(linha || " ", maxWidth);

    wrapped.forEach((w) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }

      doc.setFont("helvetica", ehTitulo ? "bold" : "normal");
      doc.setFontSize(ehTitulo ? 11 : 10);
      doc.text(w, margin, y);
      y += lineHeight;
    });

    if (linha.trim() === "") {
      y += 1;
    }
  });

  doc.save(`bopm-${boletim._id || "novo"}.pdf`);
}
