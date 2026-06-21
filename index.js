require("dotenv").config(); // carrega as config do .env pra n vazar o token

// puxando todas as ferramentas do discord que a gnt vai usar
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
} = require("discord.js");

// importando nossos bancos de dados da pastinha servidores
const dbArkZone = require("./servidores/arkzone10x.js");
const dbArkBot = require("./servidores/arkbotTestes.js");

// configurando o bot pra ele conseguir ler as msg e os chats
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const PREFIX = "!"; // prefixo padrao

// avisa no console qnd o bot ligar
client.once("ready", () => {
  console.log(`🤖 Bot ArkUtil ta on e pronto pro combate!`);
});

// lendo as msgs da galera
client.on("messageCreate", async (message) => {
  // ignora se for outro bot ou se n tiver o prefixo
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // COMANDO PRINCIPAL: aceita varias palavras pra ngm se perder
  if (["menu", "painel", "ajuda", "arkzone", "ark"].includes(command)) {
    // puxa a foto q ta na msm pasta do bot (tem q chamar logo.png la nos arquivos)
    const imagemLogo = new AttachmentBuilder("./logo.png");

    const embedCentral = new EmbedBuilder()
      .setTitle("🌐 Central ArkUtil")
      .setColor(0x0099ff)
      .setDescription(
        "Bem-vindo à central do ArkUtil! Clique no botão abaixo para abrir o painel de lojas e utilidades dos nossos servidores.",
      )
      .setThumbnail("attachment://logo.png"); // avisa pra embed usar o arquivo q a gnt puxou ali em cima

    // botao azul lindao pra abrir o menu
    const btnAbrir = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("btn_abrir_menu")
        .setLabel("💻 Abrir Painel Interativo")
        .setStyle(ButtonStyle.Primary),
    );

    // manda a msg no chat com a embed, o botao e os arquivos (a imagem no caso)
    await message.channel.send({
      embeds: [embedCentral],
      components: [btnAbrir],
      files: [imagemLogo],
    });
  }
});

// ==========================================
// LOGICA DOS MENUS (A magica toda acontece aqui)
// ==========================================
client.on("interactionCreate", async (interaction) => {
  // 1. O cara clicou no botao principal do painel
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
    // ephemeral: true faz a msg ser so pra quem clicou (n polui o chat)
    await interaction.reply({
      content: "Olá! Escolha de qual servidor você quer ver as informações:",
      components: [row],
      ephemeral: true,
    });
  }

  // 2. Ouvindo o q o cara escolheu nos dropdowns
  if (interaction.isStringSelectMenu()) {
    const escolha = interaction.values[0];

    // --- PASSO 2: ESCOLHEU QUAL SERVIDOR VER ---
    if (interaction.customId === "menu_servidor") {
      const servidorEscolhido = escolha;
      let nomeServidor =
        servidorEscolhido === "arkzone" ? "ArkZone 10x PVE" : "ArkBot Testes";

      const selectFuncionalidade = new StringSelectMenuBuilder()
        .setCustomId(`menu_funcionalidade_${servidorEscolhido}`)
        .setPlaceholder("2️⃣ O que deseja acessar?");

      // se for o arkzone, mostra td. senao, mostra so o q tem de teste
      if (servidorEscolhido === "arkzone") {
        selectFuncionalidade.addOptions(
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
            .setDescription("Multiplicadores do servidor")
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
      } else {
        selectFuncionalidade.addOptions(
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
      }

      const row = new ActionRowBuilder().addComponents(selectFuncionalidade);
      await interaction.update({
        content: `**Servidor Selecionado:** ${nomeServidor}\nO que você deseja acessar?`,
        components: [row],
      });
    }

    // --- PASSO 3: ESCOLHEU O Q VER DO SERVIDOR (shop, regras, etc) ---
    if (interaction.customId.startsWith("menu_funcionalidade_")) {
      const servidorEscolhido = interaction.customId.replace(
        "menu_funcionalidade_",
        "",
      );

      // puxa a base de dados certa dependendo do sv q ele escolheu
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
        let componentes = [];
        // so mostra o botao de discord se for o oficial
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
      } else if (escolha === "comandos") {
        const embedComandos = new EmbedBuilder()
          .setTitle("⌨️ Comandos do Servidor")
          .setColor(0x00bfff)
          .setDescription(db.textos.comandos);
        await interaction.update({
          content: "Aqui estão os comandos in-game disponíveis:",
          embeds: [embedComandos],
          components: [],
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
      } else if (escolha === "drops") {
        const embedDrops = new EmbedBuilder()
          .setTitle("📦 Tabela de Drops e Sinalizadores")
          .setColor(0x9b59b6)
          .setDescription(db.textos.drops);
        await interaction.update({
          content: "Informações sobre os saques disponíveis no servidor:",
          embeds: [embedDrops],
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

    // --- PASSO 4: EXIBE A LISTA DA LOJA ---
    if (interaction.customId.startsWith("shop_dropdown_")) {
      const servidorEscolhido = interaction.customId.replace(
        "shop_dropdown_",
        "",
      );

      const db = servidorEscolhido === "arkzone" ? dbArkZone : dbArkBot;

      let embedsParaEnviar = [];

      // monta a embed dependendo doq o cara clicou
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

      // o fixzinho bala pra ensinar a galera a comprar (poe em todas as abas da loja)
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

// liga o bot de fato!
client.login(process.env.DISCORD_TOKEN);
