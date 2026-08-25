const configuracoes = require("../servidores/configuracoes.js");

function obterConfiguracao(servidor) {
  return configuracoes[servidor] || configuracoes.default;
}

function formatarTempoHoras(totalHoras) {
  const totalMinutos = Math.max(0, Math.round(totalHoras * 60));
  const dias = Math.floor(totalMinutos / (24 * 60));
  const horas = Math.floor((totalMinutos % (24 * 60)) / 60);
  const minutos = totalMinutos % 60;

  const partes = [];
  if (dias > 0) partes.push(`${dias}d`);
  if (horas > 0 || partes.length > 0) partes.push(`${horas}h`);
  partes.push(`${minutos}m`);

  return partes.join(" ");
}

function calcularCombustivel({
  servidor = "arkbot",
  tipo = "gasolina",
  quantidade = 100,
  horas = 12,
}) {
  const cfg = obterConfiguracao(servidor);
  const item = cfg.combustiveis[tipo] || cfg.combustiveis.gasolina;
  const fatorTaxa = cfg.taxas.fuel || 1;
  const consumoPorHora = (item.consumoPorHora / fatorTaxa) || 0;
  const consumoTotal = consumoPorHora * horas;
  const duracaoHoras = quantidade / consumoPorHora || 0;

  return {
    servidor: cfg.nome,
    taxa: Number((cfg.taxas.fuel || 1).toFixed(2)),
    tipo: item.nome,
    quantidade: Number(Number(quantidade).toFixed(2)),
    horas: Number(Number(horas).toFixed(2)),
    consumoPorHora: Number(consumoPorHora.toFixed(2)),
    consumoTotal: Number(consumoTotal.toFixed(2)),
    duracaoHoras: Number(duracaoHoras.toFixed(2)),
    duracaoFormatada: formatarTempoHoras(duracaoHoras),
  };
}

function calcularTaming({ servidor = "arkbot", nivel = 120 }) {
  const cfg = obterConfiguracao(servidor);
  const fatorTaxa = cfg.taxas.taming || 1;
  const tempoHoras = ((nivel / 18) * (10 / fatorTaxa));

  return {
    servidor: cfg.nome,
    taxa: Number(fatorTaxa.toFixed(2)),
    nivel: Number(Number(nivel).toFixed(2)),
    tempoHoras: Number(tempoHoras.toFixed(2)),
    tempoFormatado: formatarTempoHoras(tempoHoras),
  };
}

function calcularRaise({ servidor = "arkbot", nivel = 120 }) {
  const cfg = obterConfiguracao(servidor);
  const fatorTaxa = cfg.taxas.raise || 1;
  const tempoHoras = ((nivel / 12) * (10 / fatorTaxa));

  return {
    servidor: cfg.nome,
    taxa: Number(fatorTaxa.toFixed(2)),
    nivel: Number(Number(nivel).toFixed(2)),
    tempoHoras: Number(tempoHoras.toFixed(2)),
    tempoFormatado: formatarTempoHoras(tempoHoras),
  };
}

module.exports = {
  configuracoes,
  calcularCombustivel,
  calcularTaming,
  calcularRaise,
  formatarTempoHoras,
};
