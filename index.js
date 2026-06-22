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
  AttachmentBuilder,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

// Puxando os bancos de dados
const dbArkZone = require("./servidores/arkzone10x.js");
const dbArkBot = require("./servidores/arkbotTestes.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const comandosSlash = [
  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Abre o painel interativo de lojas e infos do servidor"),
  new SlashCommandBuilder()
    .setName("sobre")
    .setDescription("Apresentação do ArkUtil e seus objetivos"),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// ==========================================
// CONFIGURAÇÃO DE IDs DOS SERVIDORES
// ==========================================
const ID_TESTES = "1518266572647436429"; // O ID do servidor de testes onde tudo é liberado e visível
const ID_ARKZONE = "1518271177792032928"; // O ID do servidor do ArkZone

client.once("ready", async () => {
  console.log(`🤖 Bot ArkUtil ta ON!`);
  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: comandosSlash,
    });
    console.log("Comandos de barra (/) registrados com sucesso!");
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);
  }
});

// Função auxiliar para gerar o menu inicial baseado no servidor
function gerarMenuServidores(guildId) {
  const selectServidor = new StringSelectMenuBuilder()
    .setCustomId("menu_servidor")
    .setPlaceholder("1️⃣ Escolha o Servidor...");

  // Lógica principal: Testes vê tudo, clientes veem apenas o deles
  if (guildId === ID_TESTES) {
    selectServidor.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("ArkZone 10x PVE")
        .setEmoji("🦖")
        .setValue("arkzone"),
      new StringSelectMenuOptionBuilder()
        .setLabel("ArkBot Testes")
        .setEmoji("🧪")
        .setValue("arkbot"),
    );
  } else if (guildId === ID_ARKZONE) {
    selectServidor.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("ArkZone 10x PVE")
        .setEmoji("🦖")
        .setValue("arkzone"),
    );
  } else {
    // Fallback caso seja adicionado em um servidor não configurado
    selectServidor.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Servidor Não Configurado")
        .setValue("none"),
    );
  }
  return selectServidor;
}

client.on("interactionCreate", async (interaction) => {
  // --- 1. COMANDOS DE BARRA ---
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "menu") {
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

      await interaction.reply({
        embeds: [embedCentral],
        components: [btnAbrir],
        files: [imagemLogo],
      });
    }

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

  // --- 2. BOTAO DE ABRIR O MENU ---
  if (interaction.isButton() && interaction.customId === "btn_abrir_menu") {
    const selectServidor = gerarMenuServidores(interaction.guildId);
    const row = new ActionRowBuilder().addComponents(selectServidor);
    await interaction.reply({
      content: "Olá! Confirme o servidor para ver as informações:",
      components: [row],
      ephemeral: true,
    });
  }

  // --- 3. ESCOLHEU ALGO NAS LISTINHAS ---
  if (interaction.isStringSelectMenu()) {
    const escolha = interaction.values[0];

    // --- Escolheu o Servidor ---
    if (interaction.customId === "menu_servidor") {
      const servidorEscolhido = escolha;

      if (servidorEscolhido === "none") {
        return interaction.update({
          content:
            "Este servidor não está configurado no banco de dados do bot.",
          components: [],
        });
      }

      const selectFunc = new StringSelectMenuBuilder()
        .setCustomId(`menu_func_${servidorEscolhido}`)
        .setPlaceholder("2️⃣ O que deseja acessar?");

      // Se for Arkzone mostra TUDO
      if (servidorEscolhido === "arkzone") {
        selectFunc.addOptions(
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
            .setLabel("Comandos")
            .setDescription("Lista de cmds in-game")
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
          new StringSelectMenuOptionBuilder()
            .setLabel("Drops e Saques")
            .setDescription("Conteúdo de Sinalizadores")
            .setEmoji("📦")
            .setValue("drops"),
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
      }
      // Se for Testes mostra só o básico
      else if (servidorEscolhido === "arkbot") {
        selectFunc.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Loja (Shop)")
            .setDescription("Compre dinos e itens")
            .setEmoji("🛒")
            .setValue("shop"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Comandos")
            .setDescription("Lista de comandos")
            .setEmoji("⌨️")
            .setValue("comandos"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Voltar")
            .setDescription("Escolher outro servidor")
            .setEmoji("⬅️")
            .setValue("voltar"),
        );
      }

      const row = new ActionRowBuilder().addComponents(selectFunc);
      await interaction.update({
        content: `O que você deseja acessar?`,
        components: [row],
      });
    }

    // --- Escolheu a Categoria (Loja, VIP, Regras, etc) ---
    if (interaction.customId.startsWith("menu_func_")) {
      const servidorEscolhido = interaction.customId.replace("menu_func_", "");
      const db = servidorEscolhido === "arkzone" ? dbArkZone : dbArkBot;

      if (escolha === "shop") {
        const selectShop = new StringSelectMenuBuilder()
          .setCustomId(`shop_dropdown_${servidorEscolhido}`)
          .setPlaceholder("3️⃣ Selecione a aba da loja...")
          .addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel("Dinos (Parte 1)")
              .setEmoji("🦖")
              .setValue("dinos1"),
            new StringSelectMenuOptionBuilder()
              .setLabel("Dinos (Parte 2)")
              .setEmoji("🦖")
              .setValue("dinos2"),
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
            new StringSelectMenuOptionBuilder()
              .setLabel("Voltar")
              .setDescription("Menu anterior")
              .setEmoji("⬅️")
              .setValue("voltar_func"),
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
        await interaction.update({
          content: " ",
          embeds: [embedVip],
          components: [],
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
      } else if (escolha === "drops") {
        const embedDrops = new EmbedBuilder()
          .setTitle("📦 Tabela de Drops e Sinalizadores")
          .setColor(0x9b59b6)
          .setDescription(db.textos.drops);
        await interaction.update({
          content: " ",
          embeds: [embedDrops],
          components: [],
        });
      } else if (escolha === "links") {
        const embedLinks = new EmbedBuilder()
          .setTitle("🔗 Links Úteis")
          .setColor(0x0099ff)
          .setDescription(db.textos.links);
        await interaction.update({
          content: " ",
          embeds: [embedLinks],
          components: [],
        });
      } else if (escolha === "voltar") {
        // Usa a mesma função auxiliar para gerar o menu correto no retorno
        const selectServidor = gerarMenuServidores(interaction.guildId);
        const row = new ActionRowBuilder().addComponents(selectServidor);
        await interaction.update({
          content: "Escolha de qual servidor você quer ver as informações:",
          components: [row],
        });
      }
    }

    // --- Escolheu aba da Loja ---
    if (interaction.customId.startsWith("shop_dropdown_")) {
      const servidorEscolhido = interaction.customId.replace(
        "shop_dropdown_",
        "",
      );
      const db = servidorEscolhido === "arkzone" ? dbArkZone : dbArkBot;

      if (escolha === "voltar_func") {
        // Se clicar em voltar dentro da loja, a gente finge que ele acabou de selecionar o servidor
        // para carregar os botões da segunda etapa (Shop, VIP, Comandos...) de novo.
        interaction.customId = "menu_servidor";
        interaction.values[0] = servidorEscolhido;
        // Re-emite o evento pro próprio código ler
        return client.emit("interactionCreate", interaction);
      }

      let embedLoja = new EmbedBuilder().setColor(0x2ec271);

      if (escolha === "dinos1") {
        embedLoja
          .setTitle(`🦖 Dinos (Parte 1)`)
          .setDescription(db.loja.dinos1 || "Vazio");
      } else if (escolha === "dinos2") {
        embedLoja
          .setTitle(`🦖 Dinos (Parte 2)`)
          .setDescription(db.loja.dinos2 || "Vazio");
      } else if (escolha === "recursos") {
        embedLoja
          .setTitle(`🪨 Recursos`)
          .setDescription(db.loja.recursos || "Vazio");
      } else if (escolha === "tributos") {
        embedLoja
          .setTitle(`🩸 Tributos`)
          .setColor(0x8b0000)
          .setDescription(db.loja.tributos || "Vazio");
      } else if (escolha === "equips") {
        embedLoja
          .setTitle(`⚔️ Equipamentos`)
          .setColor(0x708090)
          .setDescription(db.loja.equips || "Vazio");
      } else if (escolha === "misc") {
        embedLoja
          .setTitle(`📦 Misc e VIP`)
          .setColor(0x9b59b6)
          .setDescription(db.loja.misc || "Vazio");
      }

      await interaction.update({
        content: `Aqui está o catálogo:`,
        embeds: [embedLoja],
        components: [],
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
