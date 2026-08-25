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

  const url =
    `https://ark.wiki.gg/api.php?action=query&prop=extracts|pageimages&titles=${nomeFormatado}&format=json&exintro=1&explaintext=1&pithumbsize=512`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        sucesso: false,
        nome: nomeFormatado,
        resumo: "Não foi possível consultar a wiki neste momento.",
        imagem: null,
        linkOficial: `https://ark.wiki.gg/wiki/${nomeFormatado}`,
        motivo: "api_erro",
      };
    }

    const data = await response.json();
    const pages = data?.query?.pages ?? {};
    const page = Object.values(pages)[0];

    if (!page || page.pageid === -1) {
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
    const resumoOriginal = page.extract || "Nenhum resumo disponível.";
    const resumo =
      resumoOriginal.length > 2000
        ? `${resumoOriginal.slice(0, 1997)}...`
        : resumoOriginal;

    const imagem =
      page.thumbnail && page.thumbnail.source ? page.thumbnail.source : null;

    return {
      sucesso: true,
      nome,
      resumo,
      imagem,
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

module.exports = {
  buscarDinoWiki,
};
