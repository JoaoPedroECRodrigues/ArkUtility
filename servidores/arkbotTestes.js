// servidores/arkbotTestes.js

module.exports = {
  // 🛒 GAVETA DA LOJA
  loja: {
    dinos1: [
      "`dodo` - Dodo de Testes Lv150 | Preço: 10",
      "`raptor` - Raptor de Testes Lv150 | Preço: 50",
    ].join("\n"),

    dinos2: ["Nenhum outro dino no servidor de testes por enquanto."].join(
      "\n",
    ),

    recursos: [
      "`wood` - Madeira Teste 100x | Preço: 1",
      "`stone` - Pedra Teste 100x | Preço: 1",
    ].join("\n"),

    tributos: ["Nenhum tributo configurado nos testes."].join("\n"),

    equips: ["`flak_teste` - Armadura Básica | Preço: 10"].join("\n"),

    misc: ["`pontos` - 1000 Points Teste | Preço: 0"].join("\n"),
  },

  // 📝 GAVETA DOS TEXTOS INFORMATIVOS
  textos: {
    vip: "Ambiente de testes: Não há pacotes VIP disponíveis no momento.",

    regras:
      "**Regras de Teste:**\n" +
      "Pode quebrar tudo, afinal é o servidor de testes! 💥",

    rates:
      "**Gerais (Testes):**\n" +
      "📈 **XP:** 100x\n" +
      "⛏️ **Harvest:** 100x\n" +
      "🦖 **Taming:** Instantâneo",

    drops: "Sem modificações nos drops para o ambiente de testes.",

    links: "Este servidor é fechado apenas para administradores.",

    comandos:
      "A lista de comandos segue a mesma base do servidor oficial, porém sem a restrição de custo para administradores.",
  },
};
