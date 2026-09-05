const PatrolHours = require("../models/PatrolHours");
const Notification = require("../models/Notification");
const User = require("../models/User");

function calcularRisco(horas, diaSemana) {
  if (horas === 0) return "CRITICO";
  if (horas < 180 && diaSemana >= 3) return "ALTO";
  if (horas < 360) return "MEDIO";
  return "OK";
}

async function gerarAlertasAutomaticos() {
  const hoje = new Date();
  const diaSemana = hoje.getDay();

  const policiais = await PatrolHours.find({ status: "Ativo" });

  for (const p of policiais) {
    const risco = calcularRisco(p.horasSemanaMin, diaSemana);

    if (risco === "OK") continue;

    const user = await User.findOne({ funcional: p.funcional });
    if (!user) continue;

    let mensagem = "";

    if (risco === "CRITICO") {
      mensagem = "Você não registrou horas de patrulha nesta semana.";
    }

    if (risco === "ALTO") {
      mensagem = "Risco alto de não atingir a meta semanal.";
    }

    if (risco === "MEDIO") {
      mensagem = "Atenção: abaixo da meta operacional.";
    }

    await Notification.create({
      user: user._id,
      titulo: "⚠️ Alerta do Comando",
      mensagem,
      tipo: "GERAL"
    });
  }

  console.log("✅ Alertas automáticos gerados");
}

module.exports = {
  gerarAlertasAutomaticos
};