require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");

// Importando os bancos de dados de dentro da pasta "servidores"
const dbArkZone = require("./servidores/arkzone10x.js");
const dbArkBot = require("./servidores/arkbotTestes.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "!";

client.once("ready", () => {
  console.log(
    `🤖 Bot ArkUtil está online e pronto para gerenciar os servidores!`,
  );
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // COMANDO PRINCIPAL: Aceita várias palavras para abrir o painel!
  if (["menu", "painel", "ajuda", "arkzone", "ark"].includes(command)) {
    const embedCentral = new EmbedBuilder()
      .setTitle("🌐 Central ArkUtil")
      .setColor(0x0099ff)
      .setDescription(
        "Bem-vindo à central do ArkUtil! Clique no botão abaixo para abrir o painel de lojas e utilidades dos nossos servidores.",
      );

    const btnAbrir = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_abrir_menu")
        .setLabel("💻 Abrir Painel Interativo")
        .setStyle(ButtonStyle.Primary),
    );

    await message.channel.send({
      embeds: [embedCentral],
      components: [btnAbrir],
    });
  }
});

// ==========================================
// LÓGICA DE NAVEGAÇÃO DOS MENUS
// ==========================================
client.on("interactionCreate", async (interaction) => {
  // 1. Abertura do Menu Inicial
  if (interaction.isButton() && interaction.customId === "btn_abrir_menu") {
    const selectServidor = new StringSelectMenuBuilder()
      .setCustomId("menu_servidor")
      .setPlaceholder("1️⃣ Escolha o Servidor...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("ArkZone 10x PVE")
          .setEmoji("🦖")
          .setValue("arkzone"),
        new StringSelectMenuOptionBuilder()
          .setLabel("ArkBot Testes")
          .setEmoji("🧪")
          .setValue("arkbot"),
      );
    const row = new ActionRowBuilder().addComponents(selectServidor);
    await interaction.reply({
      content: "Olá! Escolha de qual servidor você quer ver as informações:",
      components: [row],
      ephemeral: true,
    });
  }

  // 2. Ouvindo as seleções
  if (interaction.isStringSelectMenu()) {
    const escolha = interaction.values[0];

    // --- PASSO 2: ESCOLHEU O SERVIDOR ---
    if (interaction.customId === "menu_servidor") {
      const servidorEscolhido = escolha;
      let nomeServidor =
        servidorEscolhido === "arkzone" ? "ArkZone 10x PVE" : "ArkBot Testes";

      const selectFuncionalidade = new StringSelectMenuBuilder()
        .setCustomId(`menu_funcionalidade_${servidorEscolhido}`)
        .setPlaceholder("2️⃣ O que deseja acessar?")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Loja (Shop)")
            .setDescription("Compre dinos e itens")
            .setEmoji("🛒")
            .setValue("shop"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Pacotes VIP")
            .setDescription("Loja VIP e Doações")
            .setEmoji("💎")
            .setValue("vip"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Regras")
            .setDescription("Regras do Servidor")
            .setEmoji("📜")
            .setValue("regras"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Rates e Infos")
            .setDescription("Multiplicadores do servidor")
            .setEmoji("📊")
            .setValue("rates"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Links Úteis")
            .setDescription("Links de conexão e site")
            .setEmoji("🔗")
            .setValue("links"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Voltar")
            .setDescription("Escolher outro servidor")
            .setEmoji("⬅️")
            .setValue("voltar"),
        );

      const row = new ActionRowBuilder().addComponents(selectFuncionalidade);
      await interaction.update({
        content: `**Servidor Selecionado:** ${nomeServidor}\nO que você deseja acessar?`,
        components: [row],
      });
    }

    // --- PASSO 3: ESCOLHEU A FUNCIONALIDADE ---
    if (interaction.customId.startsWith("menu_funcionalidade_")) {
      const servidorEscolhido = interaction.customId.replace(
        "menu_funcionalidade_",
        "",
      );

      // Puxa o banco de dados correto para os textos
      const db = servidorEscolhido === "arkzone" ? dbArkZone : dbArkBot;

      if (escolha === "shop") {
        const selectShop = new StringSelectMenuBuilder()
          .setCustomId(`shop_dropdown_${servidorEscolhido}`)
          .setPlaceholder("3️⃣ Selecione a categoria da loja...")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Dinos")
              .setEmoji("🦖")
              .setValue("dinos"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Recursos")
              .setEmoji("🪨")
              .setValue("recursos"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Tributos")
              .setEmoji("🩸")
              .setValue("tributos"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Equipamentos")
              .setEmoji("⚔️")
              .setValue("equips"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Misc e VIP")
              .setEmoji("📦")
              .setValue("misc"),
          );
        const row = new ActionRowBuilder().addComponents(selectShop);
        await interaction.update({
          content:
            "**Loja Aberta!**\nEscolha qual categoria de itens você deseja ver:",
          components: [row],
        });
      } else if (escolha === "vip") {
        const embedVip = new EmbedBuilder()
          .setTitle("💎 Pacotes VIP e Doações")
          .setColor(0xffd700)
          .setDescription(db.textos.vip);

        // Exibe o botão de convite apenas no servidor principal
        let componentes = [];
        if (servidorEscolhido === "arkzone") {
          componentes.push(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel("Entrar no Servidor (Convite)")
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.gg/aDyjGctRfJ"),
            ),
          );
        }

        await interaction.update({
          content: "Veja como adquirir seu VIP:",
          embeds: [embedVip],
          components: componentes,
        });
      } else if (escolha === "regras") {
        const embedRegras = new EmbedBuilder()
          .setTitle("📜 Regras do Servidor")
          .setColor(0xff0000)
          .setDescription(db.textos.regras);
        await interaction.update({
          content: "Leia atentamente nossas regras:",
          embeds: [embedRegras],
          components: [],
        });
      } else if (escolha === "rates") {
        const embedRates = new EmbedBuilder()
          .setTitle("📊 Configurações e Rates")
          .setColor(0x00ff00)
          .setDescription(db.textos.rates);
        await interaction.update({
          content: "Confira os multiplicadores:",
          embeds: [embedRates],
          components: [],
        });
      } else if (escolha === "links") {
        const embedLinks = new EmbedBuilder()
          .setTitle("🔗 Links Úteis")
          .setColor(0x0099ff)
          .setDescription(db.textos.links);
        await interaction.update({
          content: "Aqui estão nossos links principais:",
          embeds: [embedLinks],
          components: [],
        });
      } else if (escolha === "voltar") {
        const selectServidor = new StringSelectMenuBuilder()
          .setCustomId("menu_servidor")
          .setPlaceholder("1️⃣ Escolha o Servidor...")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("ArkZone 10x PVE")
              .setEmoji("🦖")
              .setValue("arkzone"),
            new StringSelectMenuOptionBuilder()
              .setLabel("ArkBot Testes")
              .setEmoji("🧪")
              .setValue("arkbot"),
          );
        const row = new ActionRowBuilder().addComponents(selectServidor);
        await interaction.update({
          content: "Escolha de qual servidor você quer ver as informações:",
          components: [row],
        });
      }
    }

    // --- PASSO 4: EXIBE A LISTA DO SHOP ---
    if (interaction.customId.startsWith("shop_dropdown_")) {
      const servidorEscolhido = interaction.customId.replace(
        "shop_dropdown_",
        "",
      );

      // Puxa o banco de dados correto para os itens da loja
      const db = servidorEscolhido === "arkzone" ? dbArkZone : dbArkBot;

      let embedsParaEnviar = [];

      if (escolha === "dinos") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🦖 Dinos (Parte 1)`)
            .setColor(0x2ec271)
            .setDescription(db.loja.dinos1),
        );
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🦖 Dinos (Parte 2)`)
            .setColor(0x2ec271)
            .setDescription(db.loja.dinos2),
        );
      } else if (escolha === "recursos") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🪨 Recursos`)
            .setColor(0x8b4513)
            .setDescription(db.loja.recursos),
        );
      } else if (escolha === "tributos") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🩸 Tributos`)
            .setColor(0x8b0000)
            .setDescription(db.loja.tributos),
        );
      } else if (escolha === "equips") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`⚔️ Equipamentos`)
            .setColor(0x708090)
            .setDescription(db.loja.equips),
        );
      } else if (escolha === "misc") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`📦 Misc`)
            .setColor(0x9b59b6)
            .setDescription(db.loja.misc),
        );
      }

      // O FIX ESTÁ AQUI: Adiciona o rodapé ensinando a comprar em TODOS os embeds gerados!
      embedsParaEnviar.forEach((embed) =>
        embed.setFooter({
          text: "💡 Para comprar use no jogo: /buy [id] [quantidade]",
        }),
      );

      await interaction.update({
        content: `Aqui está a lista que você pediu:`,
        embeds: embedsParaEnviar,
        components: [],
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
