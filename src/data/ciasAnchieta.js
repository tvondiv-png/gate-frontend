/* =========================================================
   DIVISÃO POR COMPANHIA (1ª / 2ª / 3ª CIA)

   Mapeamento bairro -> Cia, montado a partir do mapa de
   divisão de área enviado pelo usuário em 2026-09-26
   (fronteiras azul/vermelha/amarela) cruzado com as etiquetas
   de zona que aparecem no canto do mapa do jogo em cada print
   anterior (ex.: "Rockford Hills", "Pillbox Hill", "Deserto
   Grand Senora" — nomes reais do mapa do GTA V, usados aqui só
   como referência de localização, não aparecem pro usuário).

   Confiança:
   - "confirmado": a etiqueta de zona batia direto com o
     desenho da Cia no mapa enviado.
   - "provável": bairro perto da linha divisória, ou só vi a
     etiqueta de canto uma vez — pode estar do lado errado.
   - Bairros sem entrada aqui (Santos, Suzano) não têm etiqueta
     de zona confirmada em nenhum print — não arrisquei chutar.

   Fácil de corrigir: é só mudar o valor aqui, não precisa
   mexer no resto do código.
========================================================= */

export const CIA_POR_BAIRRO = {
  // 1ª CIA (oeste) — confirmado
  Jardins: "1ª CIA",
  Perdizes: "1ª CIA",
  Lapa: "1ª CIA",
  Butantã: "1ª CIA",
  Pinheiros: "1ª CIA",

  // 2ª CIA (centro/sul urbano) — confirmado
  Consolação: "2ª CIA",
  "Santa Cecília": "2ª CIA",
  "Vila Mariana": "2ª CIA",
  "Vila Madalena": "2ª CIA",
  "Jardim América": "2ª CIA",
  Centro: "2ª CIA",
  "Barra Funda": "2ª CIA",
  "Bom Retiro": "2ª CIA",
  Liberdade: "2ª CIA",
  "Bela Vista": "2ª CIA",
  "Vila Prudente": "2ª CIA",
  "Vila Alpina": "2ª CIA",
  Itaquera: "2ª CIA",
  "Distrito Industrial": "2ª CIA",
  "Santo Amaro": "2ª CIA",
  "Vila Suzana": "2ª CIA",
  Paraisópolis: "2ª CIA",
  Guaianazes: "2ª CIA",
  Brooklin: "2ª CIA",

  // 3ª CIA (norte/interior) — confirmado
  Guarulhos: "3ª CIA"
};

/* Bairros sem etiqueta de zona confirmada em nenhum print —
   não entram no mapeamento acima de propósito. */
export const BAIRROS_SEM_CIA_CONFIRMADA = ["Santos", "Suzano"];
