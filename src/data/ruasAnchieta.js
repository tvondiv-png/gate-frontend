/* =========================================================
   RUAS DE BRASIL CAPITAL (mapa do servidor)

   Lista extraída dos prints do mapa enviados pelo usuário em
   2026-09-26. Cobertura de melhor esforço — nem todo texto do
   mapa estava legível o suficiente pra copiar com segurança,
   então esta lista tende a estar incompleta, não errada. Fácil
   de completar depois: é só adicionar { rua, bairro } aqui.
========================================================= */

export const RUAS_ANCHIETA = [
  // Santos
  { rua: "Av. Afonso Pena", bairro: "Santos" },
  { rua: "Av. Cidade Santos", bairro: "Santos" },
  { rua: "Av. Pres. Wilson", bairro: "Santos" },
  { rua: "Rua Brasil", bairro: "Santos" },
  { rua: "Rua Taubaté", bairro: "Santos" },

  // Suzano
  { rua: "Av. Arnaldo Salles de Oliveira", bairro: "Suzano" },
  { rua: "Av. Sete de Setembro", bairro: "Suzano" },
  { rua: "Av. Tiradentes", bairro: "Suzano" },
  { rua: "Av. Mogi das Cruzes", bairro: "Suzano" },
  { rua: "Rua Campos Salles", bairro: "Suzano" },
  { rua: "Rua Nove de Julho", bairro: "Suzano" },
  { rua: "Rua Onze", bairro: "Suzano" },
  { rua: "Rua Carlos Freire", bairro: "Suzano" },
  { rua: "Rua Amélia Guerra", bairro: "Suzano" },
  { rua: "Rua Papa João XXIII", bairro: "Suzano" },

  // Guarulhos
  { rua: "Av. Guarulhos", bairro: "Guarulhos" },
  { rua: "Av. Salgado Filho", bairro: "Guarulhos" },
  { rua: "Av. Monteiro Lobato", bairro: "Guarulhos" },
  { rua: "Rua Emílio Ribas", bairro: "Guarulhos" },
  { rua: "Rua Dom Pedro II", bairro: "Guarulhos" },
  { rua: "Rua Júlio Prestes", bairro: "Guarulhos" },
  { rua: "Rua Cachoeira", bairro: "Guarulhos" },

  // Jardins / Perdizes / Jardim América
  { rua: "Av. Paulista", bairro: "Jardins" },
  { rua: "Av. Europa", bairro: "Jardins" },
  { rua: "Av. Canadá", bairro: "Jardins" },
  { rua: "Alameda Campinas", bairro: "Jardins" },
  { rua: "Rua Alemanha", bairro: "Jardins" },
  { rua: "Rua Portugal", bairro: "Jardins" },
  { rua: "Rua Itália", bairro: "Jardins" },
  { rua: "Rua México", bairro: "Jardins" },
  { rua: "Rua Suécia", bairro: "Perdizes" },
  { rua: "Rua Holanda", bairro: "Perdizes" },
  { rua: "Rua França", bairro: "Perdizes" },
  { rua: "Rua Alasca", bairro: "Perdizes" },
  { rua: "Rua Costa Rica", bairro: "Jardim América" },
  { rua: "Rua Colômbia", bairro: "Jardim América" },
  { rua: "Av. Atlântica", bairro: "Jardim América" },
  { rua: "Alameda Lorena", bairro: "Jardim América" },
  { rua: "Alameda Rocha Azevedo", bairro: "Jardim América" },

  // Consolação / Santa Cecília / Vila Mariana
  { rua: "Rua da Consolação", bairro: "Consolação" },
  { rua: "Alameda Santos", bairro: "Consolação" },
  { rua: "Alameda Tietê", bairro: "Consolação" },
  { rua: "Av. Rio Branco", bairro: "Consolação" },
  { rua: "Av. Pacaembu", bairro: "Santa Cecília" },
  { rua: "Av. 13 de Maio", bairro: "Vila Mariana" },

  // Barra Funda / Bom Retiro / Centro
  { rua: "Av. do Estado", bairro: "Bom Retiro" },
  { rua: "Marginal Tietê", bairro: "Barra Funda" },
  { rua: "Av. Francisco Matarazzo", bairro: "Barra Funda" },
  { rua: "Alameda Eduardo Prado", bairro: "Bom Retiro" },
  { rua: "Av. 9 de Julho", bairro: "Bela Vista" },
  { rua: "Av. 23 de Maio", bairro: "Centro" },

  // Vila Alpina / Vila Prudente / Itaquera
  { rua: "Av. Jacu-Pêssego", bairro: "Itaquera" },
  { rua: "Av. Anhaia Mello", bairro: "Vila Prudente" },
  { rua: "Av. Salim Farah Maluf", bairro: "Distrito Industrial" },
  { rua: "Rua Francisco Polito", bairro: "Vila Alpina" },

  // Santo Amaro / Vila Suzana / Paraisópolis / Guaianazes
  { rua: "Av. Santo Amaro", bairro: "Santo Amaro" },
  { rua: "Av. Higienópolis", bairro: "Santo Amaro" },
  { rua: "Av. Aricanduva", bairro: "Itaquera" },
  { rua: "Rua Amador Bueno", bairro: "Santo Amaro" },
  { rua: "Rua João Alfredo", bairro: "Vila Suzana" },
  { rua: "Rua Panambi", bairro: "Guaianazes" },

  // Lapa / Butantã / Rockford Hills
  { rua: "Rua Cantareira", bairro: "Lapa" },
  { rua: "Rua 25 de Março", bairro: "Lapa" },
  { rua: "Rua São Nicolau", bairro: "Lapa" },
  { rua: "Av. Washington Luís", bairro: "Butantã" },
  { rua: "Av. Guarapiranga", bairro: "Butantã" },

  // Rodovias (aparecem em vários bairros — sem bairro fixo)
  { rua: "Rod. Anchieta", bairro: "—" },
  { rua: "Rod. dos Bandeirantes", bairro: "—" },
  { rua: "Rod. Ayrton Senna", bairro: "—" },
  { rua: "Rod. Transbrasiliana", bairro: "—" }
];
