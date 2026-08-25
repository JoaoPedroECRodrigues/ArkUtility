module.exports = {
  default: {
    nome: "Servidor Geral",
    ativo: true,
    taxas: {
      xp: 1,
      harvest: 1,
      taming: 1,
      raise: 1,
      mating: 1,
      fuel: 1,
    },
    combustiveis: {
      gasolina: { nome: "Gasolina", consumoPorHora: 1.25 },
      bio: { nome: "Biocombustível", consumoPorHora: 0.9 },
      elemento: { nome: "Elemento", consumoPorHora: 0.45 },
    },
    observacoes: "Taxas base em referência a valores comuns do ARK Wiki para XP, coleta, taming e raise.",
  },

  arkbot: {
    nome: "ArkBot Testes",
    ativo: true,
    taxas: {
      xp: 10,
      harvest: 10,
      taming: 10,
      raise: 4,
      mating: 1,
      fuel: 1,
    },
    combustiveis: {
      gasolina: { nome: "Gasolina", consumoPorHora: 1.25 },
      bio: { nome: "Biocombustível", consumoPorHora: 0.9 },
      elemento: { nome: "Elemento", consumoPorHora: 0.45 },
    },
    observacoes: "Servidor de testes. Ajuste as taxas aqui para refletir a regra da comunidade.",
  },
};
