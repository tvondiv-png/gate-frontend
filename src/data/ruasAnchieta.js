/* =========================================================
   RUAS DE BRASIL CAPITAL (mapa do servidor)

   Lista extraída dos prints do mapa enviados pelo usuário em
   2026-09-26 (duas levas — a segunda leva veio com zoom e
   praticamente tudo ficou legível). Cobertura de melhor
   esforço — pode faltar alguma rua muito pequena que nunca
   apareceu num print. Fácil de completar depois: é só
   adicionar { rua, bairro } aqui.

   Única incerteza registrada: "Rua Boba Gato" (Vila Suzana) —
   nome incomum, o texto no mapa era pequeno demais pra ter
   100% de certeza da grafia exata.
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

  // Jardins
  { rua: "Av. Paulista", bairro: "Jardins" },
  { rua: "Av. Europa", bairro: "Jardins" },
  { rua: "Av. Canadá", bairro: "Jardins" },
  { rua: "Alameda Campinas", bairro: "Jardins" },
  { rua: "Rua Alemanha", bairro: "Jardins" },
  { rua: "Rua Portugal", bairro: "Jardins" },
  { rua: "Rua Itália", bairro: "Jardins" },
  { rua: "Rua México", bairro: "Jardins" },
  { rua: "Rua Estados Unidos", bairro: "Jardins" },

  // Perdizes
  { rua: "Rua Suécia", bairro: "Perdizes" },
  { rua: "Rua Suíça", bairro: "Perdizes" },
  { rua: "Rua Noruega", bairro: "Perdizes" },
  { rua: "Rua Holanda", bairro: "Perdizes" },
  { rua: "Rua França", bairro: "Perdizes" },
  { rua: "Rua Alasca", bairro: "Perdizes" },

  // Jardim América
  { rua: "Rua Costa Rica", bairro: "Jardim América" },
  { rua: "Rua Colômbia", bairro: "Jardim América" },
  { rua: "Av. Atlântica", bairro: "Jardim América" },
  { rua: "Alameda Lorena", bairro: "Jardim América" },
  { rua: "Alameda Rocha Azevedo", bairro: "Jardim América" },
  { rua: "Av. Ipiranga", bairro: "Jardim América" },
  { rua: "Rua São João", bairro: "Jardim América" },
  { rua: "Rua Cuba", bairro: "Jardim América" },

  // Consolação
  { rua: "Rua da Consolação", bairro: "Consolação" },
  { rua: "Alameda Santos", bairro: "Consolação" },
  { rua: "Alameda Tietê", bairro: "Consolação" },
  { rua: "Av. Rio Branco", bairro: "Consolação" },
  { rua: "Rua Peixoto Gomide", bairro: "Consolação" },
  { rua: "Rua Frei Caneca", bairro: "Consolação" },
  { rua: "Rua Nestor Pestana", bairro: "Consolação" },
  { rua: "Rua Bela Cintra", bairro: "Consolação" },
  { rua: "Rua Gravataí", bairro: "Consolação" },

  // Santa Cecília
  { rua: "Av. Pacaembu", bairro: "Santa Cecília" },
  { rua: "Av. Angélica", bairro: "Santa Cecília" },
  { rua: "Av. Casper Líbero", bairro: "Santa Cecília" },

  // Vila Mariana
  { rua: "Av. 13 de Maio", bairro: "Vila Mariana" },
  { rua: "Rua Cordeiro Galvão", bairro: "Vila Mariana" },
  { rua: "Rua Galeão Coutinho", bairro: "Vila Mariana" },

  // Barra Funda / Bom Retiro / Centro / Liberdade
  { rua: "Av. do Estado", bairro: "Bom Retiro" },
  { rua: "Marginal Tietê", bairro: "Barra Funda" },
  { rua: "Av. Francisco Matarazzo", bairro: "Barra Funda" },
  { rua: "Rua Brigadeiro Galvão", bairro: "Barra Funda" },
  { rua: "Via Elevado Pres. João Goulart", bairro: "Barra Funda" },
  { rua: "Alameda Eduardo Prado", bairro: "Bom Retiro" },
  { rua: "Av. 9 de Julho", bairro: "Bela Vista" },
  { rua: "Av. 23 de Maio", bairro: "Centro" },
  { rua: "Av. Praça da Sé", bairro: "Centro" },
  { rua: "Rua São Paulo", bairro: "Centro" },
  { rua: "Av. Roberto Marinho", bairro: "Liberdade" },

  // Vila Alpina / Vila Prudente / Itaquera
  { rua: "Av. Jacu-Pêssego", bairro: "Itaquera" },
  { rua: "Av. Anhaia Mello", bairro: "Vila Prudente" },
  { rua: "Av. Salim Farah Maluf", bairro: "Distrito Industrial" },
  { rua: "Rua Francisco Polito", bairro: "Vila Alpina" },
  { rua: "Rua Amparo", bairro: "Vila Prudente" },
  { rua: "Rua João Adolfo", bairro: "Vila Prudente" },

  // Santo Amaro / Vila Suzana / Distrito Industrial / Paraisópolis / Guaianazes / Brooklin
  { rua: "Av. Santo Amaro", bairro: "Santo Amaro" },
  { rua: "Av. Higienópolis", bairro: "Santo Amaro" },
  { rua: "Av. Aricanduva", bairro: "Itaquera" },
  { rua: "Rua Amador Bueno", bairro: "Santo Amaro" },
  { rua: "Rua João Alfredo", bairro: "Vila Suzana" },
  { rua: "Av. Jucelino Kubitschek", bairro: "Vila Suzana" },
  { rua: "Rua da Paz", bairro: "Vila Suzana" },
  { rua: "Rua Boba Gato", bairro: "Vila Suzana" },
  { rua: "Rua São Luís", bairro: "Distrito Industrial" },
  { rua: "Rua Parapuã", bairro: "Distrito Industrial" },
  { rua: "Rua Panambi", bairro: "Guaianazes" },
  { rua: "Av. Pedro Bueno", bairro: "Paraisópolis" },
  { rua: "Rua Guararapes", bairro: "Brooklin" },
  { rua: "Rua Joaquim Nabuco", bairro: "Brooklin" },

  // Lapa / Butantã / Pinheiros / Rockford Hills
  { rua: "Rua Cantareira", bairro: "Lapa" },
  { rua: "Rua 25 de Março", bairro: "Lapa" },
  { rua: "Rua São Nicolau", bairro: "Lapa" },
  { rua: "Av. Washington Luís", bairro: "Butantã" },
  { rua: "Av. Guarapiranga", bairro: "Butantã" },
  { rua: "Av. Brigadeiro Faria Lima", bairro: "Pinheiros" },

  // Rodovias (aparecem em vários bairros — sem bairro fixo)
  { rua: "Rod. Anchieta", bairro: "—" },
  { rua: "Rod. dos Bandeirantes", bairro: "—" },
  { rua: "Rod. Ayrton Senna", bairro: "—" },
  { rua: "Rod. Transbrasiliana", bairro: "—" },
  { rua: "Rodoanel Mário Covas", bairro: "—" }
];
