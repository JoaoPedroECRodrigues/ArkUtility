async function buscarDinoWiki(nomeDino) {
  const nomeFormatado = String(nomeDino || "")
    .trim()
    .replace(/\s+/g, "_");

  if (!nomeFormatado) {
    return {
      sucesso: false,
      nome: "",
      resumo: "Informe um nome de dino válido.",
      imagem: null,
      linkOficial: "",
      motivo: "nome_vazio",
    };
  }

  const queryUrl = new URL("https://ark.wiki.gg/api.php");
  queryUrl.searchParams.set("action", "query");
  queryUrl.searchParams.set("prop", "info");
  queryUrl.searchParams.set("format", "json");
  queryUrl.searchParams.set("titles", nomeFormatado);

  try {
    const paginaQuery = await fetch(queryUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!paginaQuery.ok) {
      return {
        sucesso: false,
        nome: nomeFormatado,
        resumo: "Não foi possível consultar a wiki neste momento.",
        imagem: null,
        linkOficial: `https://ark.wiki.gg/wiki/${nomeFormatado}`,
        motivo: "api_erro",
      };
    }

    const data = await paginaQuery.json();
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0];

    if (!page || page.missing || page.invalid || page.pageid === -1) {
      return {
        sucesso: false,
        nome: nomeFormatado,
        resumo:
          "Nenhum resultado encontrado. Verifique se o nome está em inglês e no formato correto.",
        imagem: null,
        linkOficial: `https://ark.wiki.gg/wiki/${nomeFormatado}`,
        motivo: "nao_encontrado",
      };
    }

    const nome = page.title || nomeFormatado;

    const parseUrl = new URL("https://ark.wiki.gg/api.php");
    parseUrl.searchParams.set("action", "parse");
    parseUrl.searchParams.set("page", nomeFormatado);
    parseUrl.searchParams.set("prop", "text");
    parseUrl.searchParams.set("format", "json");

    const parseResponse = await fetch(parseUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!parseResponse.ok) {
      return {
        sucesso: false,
        nome,
        resumo:
          "A página existe, mas a API do texto não respondeu corretamente.",
        imagem: null,
        linkOficial: `https://ark.wiki.gg/wiki/${nomeFormatado}`,
        motivo: "parse_erro",
      };
    }

    const parseData = await parseResponse.json();
    const html = parseData?.parse?.text?.["*"] ?? "";
    const paragrafos = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
      .map((match) => match[1])
      .map((p) =>
        p
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&#160;/g, " ")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter(
        (p) => p && p.length > 30 && !p.startsWith("This article is about"),
      );

    let resumo = paragrafos[0] || "Nenhum resumo disponível.";
    resumo = resumo.length > 2000 ? `${resumo.slice(0, 1997)}...` : resumo;

    const imageUrl = await buscarImagemArquivo(nomeFormatado);

    return {
      sucesso: true,
      nome,
      resumo,
      imagem: imageUrl,
      linkOficial: `https://ark.wiki.gg/wiki/${nomeFormatado}`,
    };
  } catch (error) {
    return {
      sucesso: false,
      nome: nomeFormatado,
      resumo: "Erro ao consultar a wiki.gg.",
      imagem: null,
      linkOficial: `https://ark.wiki.gg/wiki/${nomeFormatado}`,
      motivo: "excecao",
    };
  }
}

async function buscarImagemArquivo(nomeFormatado) {
  const arquivo = `File:${nomeFormatado.replace(/_/g, "")}.png`;
  const imageUrl = new URL("https://ark.wiki.gg/api.php");
  imageUrl.searchParams.set("action", "query");
  imageUrl.searchParams.set("prop", "imageinfo");
  imageUrl.searchParams.set("titles", arquivo);
  imageUrl.searchParams.set("iiprop", "url");
  imageUrl.searchParams.set("format", "json");

  try {
    const imagemResponse = await fetch(imageUrl.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!imagemResponse.ok) {
      return null;
    }

    const imagemData = await imagemResponse.json();
    const pages = imagemData?.query?.pages ?? {};
    const page = Object.values(pages).find((item) => item.imageinfo?.length);

    if (!page || !page.imageinfo || page.imageinfo.length === 0) {
      return null;
    }

    return page.imageinfo[0].url || null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  buscarDinoWiki,
};
