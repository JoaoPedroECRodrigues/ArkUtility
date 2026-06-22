require("dotenv").config(); // carrega o token e o client id

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  AttachmentBuilder,
  REST, // <-- ferramentas novas pro slash command
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

// puxando a nossa lojinha
const dbArkZone = require("./servidores/arkzone10x.js");

// configurando o bot (n precisa mais da permissao de ler tds as msgs!)
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ==========================================
// DECLARANDO OS COMANDOS DE BARRA (/)
// ==========================================
const comandosSlash = [
  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Abre o painel interativo de lojas e infos do servidor"),
  new SlashCommandBuilder()
    .setName("sobre")
    .setDescription("Apresentação do ArkUtil e seus objetivos"),
];

// prepara o mandraque pra enviar os cmds pro discord
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// qnd o bot ligar, ele avisa e registra os comandos
client.once("ready", async () => {
  console.log(`🤖 Bot ArkUtil ta ON!`);

  try {
    console.log("Atualizando os comandos de barra (/) no Discord...");
    // envia os cmds pro discord usando o CLIENT_ID
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: comandosSlash,
    });
    console.log("Comandos atualizados com sucesso! Ja pode dar / no chat.");
  } catch (error) {
    console.error("Deu ruim ao registrar os comandos:", error);
  }
});

// ==========================================
// LOGICA DE QUANDO O CARA CLICA OU DIGITA ALGO
// ==========================================
client.on("interactionCreate", async (interaction) => {
  // --- 1. O CARA DIGITOU UM COMANDO DE BARRA ---
  if (interaction.isChatInputCommand()) {
    // Comando: /menu
    if (interaction.commandName === "menu") {
      // puxa a thumb e forca o nome pra n bugar no discloud
      const imagemLogo = new AttachmentBuilder("./logo.png", {
        name: "logo.png",
      });

      const embedCentral = new EmbedBuilder()
        .setTitle("🌐 Central ArkUtil")
        .setColor(0x0099ff)
        .setDescription(
          "Bem-vindo à central do ArkUtil! Clique no botão abaixo para abrir o painel de lojas e utilidades dos nossos servidores.",
        )
        .setThumbnail("attachment://logo.png");

      const btnAbrir = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("btn_abrir_menu")
          .setLabel("💻 Abrir Painel Interativo")
          .setStyle(ButtonStyle.Primary),
      );

      // manda pro chat
      await interaction.reply({
        embeds: [embedCentral],
        components: [btnAbrir],
        files: [imagemLogo],
      });
    }

    // Comando: /sobre (A msg humanizada q a gnt montou)
    if (interaction.commandName === "sobre") {
      const embedSobre = new EmbedBuilder()
        .setTitle("🤖 Quem é o ArkUtil?")
        .setColor(0x2ec271)
        .setDescription(
          "Fala, sobrevivente! 🦖\n\nEu sou o ArkUtil, o braço direito aqui no ArkZone. Meu objetivo é simples: facilitar a sua vida pra vc não perder tempo e focar em dominar o mapa.\n\nComigo, vc tem acesso rápido à nossa loja, onde pode checar os dinos e entender certinho os custos (seja em **Tokens** ou **Points**). Também entrego rules, rates e cmds rapidinho.\n\nO ArkUtil não tá aqui pra substituir a staff, mas sim pra cuidar das perguntas repetitivas e deixar os admins focarem em melhorar o sv pra vcs!\n\nTô sempre evoluindo. Bora pro jogo!",
        );

      await interaction.reply({ embeds: [embedSobre] });
    }
  }

  // --- 2. O CARA CLICOU NO BOTAO DO MENU ---
  if (interaction.isButton() && interaction.customId === "btn_abrir_menu") {
    const selectServidor = new StringSelectMenuBuilder()
      .setCustomId("menu_servidor")
      .setPlaceholder("1️⃣ Escolha o Servidor...")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("ArkZone 10x PVE")
          .setEmoji("🦖")
          .setValue("arkzone"),
      );
    const row = new ActionRowBuilder().addComponents(selectServidor);
    // ephemeral faz a msg so aparecer pra quem clicou (n polui chat)
    await interaction.reply({
      content: "Olá! Escolha de qual servidor você quer ver as informações:",
      components: [row],
      ephemeral: true,
    });
  }

  // --- 3. O CARA ESCOLHEU ALGO NAS LISTINHAS (DROPDOWN) ---
  if (interaction.isStringSelectMenu()) {
    const escolha = interaction.values[0];

    // Escolheu o Servidor
    if (interaction.customId === "menu_servidor") {
      const selectFunc = new StringSelectMenuBuilder()
        .setCustomId("menu_func_arkzone")
        .setPlaceholder("2️⃣ O que deseja acessar?")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Loja (Shop)")
            .setDescription("Compre dinos e itens")
            .setEmoji("🛒")
            .setValue("shop"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Comandos")
            .setDescription("Lista de comandos in-game")
            .setEmoji("⌨️")
            .setValue("comandos"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Regras")
            .setDescription("Regras do Servidor")
            .setEmoji("📜")
            .setValue("regras"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Rates e Infos")
            .setDescription("Multiplicadores")
            .setEmoji("📊")
            .setValue("rates"),
        );

      const row = new ActionRowBuilder().addComponents(selectFunc);
      await interaction.update({
        content: `O que você deseja acessar do ArkZone?`,
        components: [row],
      });
    }

    // Escolheu a categoria (Loja, regras, etc)
    if (interaction.customId === "menu_func_arkzone") {
      const db = dbArkZone;

      if (escolha === "shop") {
        const selectShop = new StringSelectMenuBuilder()
          .setCustomId("shop_dropdown_arkzone")
          .setPlaceholder("3️⃣ Selecione a aba da loja...")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Dinos Lv Max")
              .setEmoji("🦖")
              .setValue("dinosMax"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Dinos Lv 1")
              .setEmoji("🥚")
              .setValue("dinosLv1"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Recursos")
              .setEmoji("🪨")
              .setValue("recursos"),
          );
        const row = new ActionRowBuilder().addComponents(selectShop);
        await interaction.update({
          content:
            "**Loja Aberta!**\nEscolha qual categoria de itens você deseja ver:",
          components: [row],
        });
      } else if (escolha === "regras") {
        const embedRegras = new EmbedBuilder()
          .setTitle("📜 Regras do Servidor")
          .setColor(0xff0000)
          .setDescription(db.textos.regras);
        await interaction.update({
          content: " ",
          embeds: [embedRegras],
          components: [],
        });
      } else if (escolha === "comandos") {
        const embedComandos = new EmbedBuilder()
          .setTitle("⌨️ Comandos do Servidor")
          .setColor(0x00bfff)
          .setDescription(db.textos.comandos);
        await interaction.update({
          content: " ",
          embeds: [embedComandos],
          components: [],
        });
      } else if (escolha === "rates") {
        const embedRates = new EmbedBuilder()
          .setTitle("📊 Configurações e Rates")
          .setColor(0x00ff00)
          .setDescription(db.textos.rates);
        await interaction.update({
          content: " ",
          embeds: [embedRates],
          components: [],
        });
      }
    }

    // Escolheu qual parte da loja ver (Dinos Max, Dinos 1, Recursos)
    if (interaction.customId === "shop_dropdown_arkzone") {
      const db = dbArkZone;
      let embedLoja = new EmbedBuilder().setColor(0x2ec271);

      if (escolha === "dinosMax") {
        embedLoja
          .setTitle(`🦖 Dinos Nível Máximo`)
          .setDescription(db.loja.dinosMax);
      } else if (escolha === "dinosLv1") {
        embedLoja.setTitle(`🥚 Dinos Nível 1`).setDescription(db.loja.dinosLv1);
      } else if (escolha === "recursos") {
        embedLoja.setTitle(`🪨 Recursos`).setDescription(db.loja.recursos);
      }

      await interaction.update({
        content: `Aqui está o catálogo:`,
        embeds: [embedLoja],
        components: [],
      });
    }
  }
});

// bot ligando os motores
client.login(process.env.DISCORD_TOKEN);
