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

const {
  configuracoes,
  calcularCombustivel,
  calcularTaming,
  calcularRaise,
} = require("./modulos/calculadoraArk.js");
const { buscarDinoWiki } = require("./modulos/wikiArk.js");

// Puxando os bancos de dados
const dbArkBot = require("./servidores/arkbotTestes.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const comandosSlash = [
  new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Abre o painel interativo de lojas e infos do servidor"),
  new SlashCommandBuilder()
    .setName("sobre")
    .setDescription("Apresentação do ArkUtil e seus objetivos"),
  new SlashCommandBuilder()
    .setName("calculadora")
    .setDescription("Calcula combustíveis, taming e raise por taxa do servidor")
    .addStringOption((option) =>
      option
        .setName("servidor")
        .setDescription("Servidor configurado")
        .setRequired(true)
        .addChoices(
          ...Object.keys(configuracoes)
            .filter((key) => key !== "default")
            .map((key) => ({ name: configuracoes[key].nome, value: key })),
        ),
    )
    .addStringOption((option) =>
      option
        .setName("tipo")
        .setDescription("Tipo de cálculo")
        .setRequired(true)
        .addChoices(
          { name: "Combustível", value: "combustivel" },
          { name: "Taming", value: "taming" },
          { name: "Raise", value: "raise" },
        ),
    )
    .addNumberOption((option) =>
      option
        .setName("valor")
        .setDescription("Quantidade ou nível para calcular")
        .setRequired(true),
    )
    .addNumberOption((option) =>
      option
        .setName("tempo")
        .setDescription("Tempo em horas para combustível (opcional)")
        .setRequired(false),
    ),
  new SlashCommandBuilder()
    .setName("wiki")
    .setDescription("Busca um dino na wiki oficial do ARK")
    .addStringOption((option) =>
      option
        .setName("dino")
        .setDescription("Nome do dino em inglês")
        .setRequired(true),
    ),
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// ==========================================
// CONFIGURAÇÃO DE IDs DOS SERVIDORES
// ==========================================
const ID_TESTES = "1518266572647436429"; // O ID do servidor de testes onde tudo é liberado e visível

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

  if (guildId === ID_TESTES) {
    selectServidor.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("ArkBot Testes")
        .setEmoji("🧪")
        .setValue("arkbot"),
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

function gerarLayoutCalculadora(servidorEscolhido) {
  const selectCalc = new StringSelectMenuBuilder()
    .setCustomId(`calc_menu_${servidorEscolhido}`)
    .setPlaceholder("2️⃣ Escolha a calculadora...");

  selectCalc.addOptions(
    new StringSelectMenuOptionBuilder()
      .setLabel("Combustível")
      .setDescription("Consumo em horas e duração de tanques")
      .setEmoji("⛽")
      .setValue("combustivel"),
    new StringSelectMenuOptionBuilder()
      .setLabel("Taming")
      .setDescription("Tempo estimado de domar dinos")
      .setEmoji("🦖")
      .setValue("taming"),
    new StringSelectMenuOptionBuilder()
      .setLabel("Raise")
      .setDescription("Tempo estimado de crescimento")
      .setEmoji("🌱")
      .setValue("raise"),
    new StringSelectMenuOptionBuilder()
      .setLabel("Voltar")
      .setDescription("Menu anterior")
      .setEmoji("⬅️")
      .setValue("voltar"),
  );

  return selectCalc;
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
          "Fala, sobrevivente! 🦖\n\nEu sou o ArkUtil, criado a partir de uma necessidade simples: transformar a experiência de gerenciar informações no ARK em algo muito mais prático e centralizado.\n\nCansei de ver jogadores perdidos procurando tabelas, regras ou comandos em diferentes lugares, então desenvolvi este bot para ser o seu braço direito. Comigo, você tem acesso rápido a tudo o que precisa — desde o catálogo da loja e configurações do servidor até listas de comandos e regras — sem precisar sair do Discord ou abrir abas externas.\n\nO meu objetivo é poupar o seu tempo e o da administração, deixando as informações importantes sempre à mão, de forma organizada e eficiente. Estou em constante evolução para tornar sua jogatina mais fluida. Bora pro jogo!",
        );

      await interaction.reply({ embeds: [embedSobre] });
    }

    if (interaction.commandName === "calculadora") {
      const servidor = interaction.options.getString("servidor");
      const tipo = interaction.options.getString("tipo");
      const valor = interaction.options.getNumber("valor");
      const tempo = interaction.options.getNumber("tempo") || 12;

      let resultado;
      if (tipo === "combustivel") {
        resultado = calcularCombustivel({
          servidor,
          tipo: "gasolina",
          quantidade: valor,
          horas: tempo,
        });
      } else if (tipo === "taming") {
        resultado = calcularTaming({ servidor, nivel: valor });
      } else {
        resultado = calcularRaise({ servidor, nivel: valor });
      }

      const embedCalc = new EmbedBuilder()
        .setTitle("🧮 Calculadora Ark")
        .setColor(0xffa500)
        .setDescription(
          `**Servidor:** ${resultado.servidor}\n` +
            `**Taxa configurada:** ${resultado.taxa}x\n\n` +
            (tipo === "combustivel"
              ? `**Combustível:** ${resultado.tipo}\n` +
                `**Quantidade disponível:** ${resultado.quantidade}\n` +
                `**Consumo por hora:** ${resultado.consumoPorHora}\n` +
                `**Consumo total em ${resultado.horas}h:** ${resultado.consumoTotal}\n` +
                `**Duração estimada:** ${resultado.duracaoFormatada}`
              : tipo === "taming"
                ? `**Nível de taming:** ${resultado.nivel}\n` +
                  `**Tempo estimado:** ${resultado.tempoFormatado}`
                : `**Nível de raise:** ${resultado.nivel}\n` +
                  `**Tempo estimado:** ${resultado.tempoFormatado}`),
        );

      await interaction.reply({ embeds: [embedCalc] });
    }

    if (interaction.commandName === "wiki") {
      await interaction.deferReply();

      const nomeDino = interaction.options.getString("dino");
      const resultado = await buscarDinoWiki(nomeDino);

      if (!resultado.sucesso) {
        const embedErro = new EmbedBuilder()
          .setTitle("📚 Wiki do ARK")
          .setColor(0x00bfff)
          .setDescription(
            `${resultado.resumo}\n\n[Ver na wiki oficial](${resultado.linkOficial})`,
          );

        return interaction.editReply({ embeds: [embedErro] });
      }

      const embedWiki = new EmbedBuilder()
        .setTitle(`📚 ${resultado.nome}`)
        .setColor(0x00bfff)
        .setDescription(
          `${resultado.resumo}\n\n[Ver na wiki oficial](${resultado.linkOficial})`,
        );

      if (resultado.imagem) {
        embedWiki.setThumbnail(resultado.imagem);
      }

      return interaction.editReply({ embeds: [embedWiki] });
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

      if (servidorEscolhido === "arkbot") {
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
            .setLabel("Regras")
            .setDescription("Regras do servidor")
            .setEmoji("📜")
            .setValue("regras"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Rates e Infos")
            .setDescription("Multiplicadores")
            .setEmoji("📊")
            .setValue("rates"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Links Úteis")
            .setDescription("Links de conexão e site")
            .setEmoji("🔗")
            .setValue("links"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Calculadora Ark")
            .setDescription("Combustível, Taming e Raise")
            .setEmoji("🧮")
            .setValue("calculadora"),
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
      const db = dbArkBot;

      if (escolha === "calculadora") {
        const selectCalc = gerarLayoutCalculadora(servidorEscolhido);
        const row = new ActionRowBuilder().addComponents(selectCalc);
        await interaction.update({
          content: `**Calculadora Ark**\nSelecione o tipo de cálculo para o servidor **${configuracoes[servidorEscolhido]?.nome || "Servidor"}**:`,
          components: [row],
        });
        return;
      }

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
        const selectServidor = gerarMenuServidores(interaction.guildId);
        const row = new ActionRowBuilder().addComponents(selectServidor);
        await interaction.update({
          content: "Escolha de qual servidor você quer ver as informações:",
          components: [row],
        });
      }
    }

    if (interaction.customId.startsWith("calc_menu_")) {
      const servidorEscolhido = interaction.customId.replace("calc_menu_", "");

      if (escolha === "voltar") {
        const selectFunc = new StringSelectMenuBuilder()
          .setCustomId(`menu_func_${servidorEscolhido}`)
          .setPlaceholder("2️⃣ O que deseja acessar?");
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
            .setLabel("Regras")
            .setDescription("Regras do servidor")
            .setEmoji("📜")
            .setValue("regras"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Rates e Infos")
            .setDescription("Multiplicadores")
            .setEmoji("📊")
            .setValue("rates"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Links Úteis")
            .setDescription("Links de conexão e site")
            .setEmoji("🔗")
            .setValue("links"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Calculadora Ark")
            .setDescription("Combustível, Taming e Raise")
            .setEmoji("🧮")
            .setValue("calculadora"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Voltar")
            .setDescription("Escolher outro servidor")
            .setEmoji("⬅️")
            .setValue("voltar"),
        );

        const row = new ActionRowBuilder().addComponents(selectFunc);
        await interaction.update({
          content: "O que você deseja acessar?",
          components: [row],
        });
        return;
      }

      const resultado =
        escolha === "combustivel"
          ? calcularCombustivel({
              servidor: servidorEscolhido,
              tipo: "gasolina",
              quantidade: 100,
              horas: 12,
            })
          : escolha === "taming"
            ? calcularTaming({ servidor: servidorEscolhido, nivel: 120 })
            : calcularRaise({ servidor: servidorEscolhido, nivel: 120 });

      const embedCalc = new EmbedBuilder()
        .setTitle("🧮 Calculadora Ark")
        .setColor(0xffa500)
        .setDescription(
          `**Servidor:** ${resultado.servidor}\n` +
            `**Taxa configurada:** ${resultado.taxa}x\n\n` +
            (escolha === "combustivel"
              ? `**Combustível:** ${resultado.tipo}\n` +
                `**Quantidade disponível:** ${resultado.quantidade}\n` +
                `**Consumo por hora:** ${resultado.consumoPorHora}\n` +
                `**Consumo total em ${resultado.horas}h:** ${resultado.consumoTotal}\n` +
                `**Duração estimada:** ${resultado.duracaoFormatada}`
              : escolha === "taming"
                ? `**Nível de taming:** ${resultado.nivel}\n` +
                  `**Tempo estimado:** ${resultado.tempoFormatado}`
                : `**Nível de raise:** ${resultado.nivel}\n` +
                  `**Tempo estimado:** ${resultado.tempoFormatado}`),
        );

      await interaction.update({
        content: " ",
        embeds: [embedCalc],
        components: [],
      });
    }

    // --- Escolheu aba da Loja ---
    if (interaction.customId.startsWith("shop_dropdown_")) {
      const servidorEscolhido = interaction.customId.replace(
        "shop_dropdown_",
        "",
      );
      const db = dbArkBot;

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
