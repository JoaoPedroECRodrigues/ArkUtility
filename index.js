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

  // COMANDO PRINCIPAL: !central (Cria o Painel Fixo do ArkUtil)
  if (command === "central") {
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
  // 1. O jogador clicou para abrir o menu inicial
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
      content:
        "Olá! Por favor, escolha de qual servidor você quer ver as informações:",
      components: [row],
      ephemeral: true,
    });
  }

  // 2. O jogador selecionou algo em um dos Menus
  if (interaction.isStringSelectMenu()) {
    const escolha = interaction.values[0];

    // --- PASSO 2: ESCOLHEU O SERVIDOR ---
    if (interaction.customId === "menu_servidor") {
      const servidorEscolhido = escolha; // Pode ser 'arkzone' ou 'arkbot'
      let nomeServidor =
        servidorEscolhido === "arkzone" ? "ArkZone 10x PVE" : "ArkBot Testes";

      const selectFuncionalidade = new StringSelectMenuBuilder()
        // A mágica: Colocamos o ID do servidor no ID do menu para o bot lembrar!
        .setCustomId(`menu_funcionalidade_${servidorEscolhido}`)
        .setPlaceholder("2️⃣ O que deseja acessar?")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Loja (Shop)")
            .setDescription("Compre dinos e itens")
            .setEmoji("🛒")
            .setValue("shop"),
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

    // --- PASSO 3: ESCOLHEU A FUNCIONALIDADE (Shop ou Voltar) ---
    if (interaction.customId.startsWith("menu_funcionalidade_")) {
      const servidorEscolhido = interaction.customId.replace(
        "menu_funcionalidade_",
        "",
      );

      if (escolha === "shop") {
        const selectShop = new StringSelectMenuBuilder()
          // Passamos o servidor pra frente de novo
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

    // --- PASSO 4: EXIBE A LISTA FINAL DO SHOP DE ACORDO COM O SERVIDOR ---
    if (interaction.customId.startsWith("shop_dropdown_")) {
      const servidorEscolhido = interaction.customId.replace(
        "shop_dropdown_",
        "",
      );
      let nomeServidor =
        servidorEscolhido === "arkzone" ? "ArkZone 10x PVE" : "ArkBot Testes";

      // Puxa o banco de dados correto de dentro da pasta "servidores"
      const db = servidorEscolhido === "arkzone" ? dbArkZone : dbArkBot;

      let embedsParaEnviar = [];

      if (escolha === "dinos") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🦖 Dinos (Parte 1)`)
            .setColor(0x2ec271)
            .setDescription(db.dinos1),
        );
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🦖 Dinos (Parte 2)`)
            .setColor(0x2ec271)
            .setDescription(db.dinos2),
        );
      } else if (escolha === "recursos") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🪨 Recursos`)
            .setColor(0x8b4513)
            .setDescription(db.recursos),
        );
      } else if (escolha === "tributos") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`🩸 Tributos`)
            .setColor(0x8b0000)
            .setDescription(db.tributos),
        );
      } else if (escolha === "equips") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`⚔️ Equipamentos`)
            .setColor(0x708090)
            .setDescription(db.equips),
        );
      } else if (escolha === "misc") {
        embedsParaEnviar.push(
          new EmbedBuilder()
            .setTitle(`📦 Misc`)
            .setColor(0x9b59b6)
            .setDescription(db.misc)
            .setFooter({ text: "Comando: /buy id quantidade" }),
        );
      }

      // Manda a lista e avisa de qual servidor é
      await interaction.update({
        content: `Aqui está a lista que você pediu referente ao servidor **${nomeServidor}**:`,
        embeds: embedsParaEnviar,
        components: [],
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
