const UNIDADES = [
  "", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove",
  "dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis",
  "dezessete", "dezoito", "dezenove",
];

const DEZENAS = [
  "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta",
  "setenta", "oitenta", "noventa",
];

const CENTENAS = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
  "seiscentos", "setecentos", "oitocentos", "novecentos",
];

function centenaToWords(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  if (n < 100) return dezenaToWords(n);
  const c = Math.floor(n / 100);
  const rest = n % 100;
  const cStr = CENTENAS[c] || "";
  const rStr = dezenaToWords(rest);
  return rStr ? `${cStr} e ${rStr}` : cStr;
}

function dezenaToWords(n: number): string {
  if (n === 0) return "";
  if (n < 20) return UNIDADES[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  const dStr = DEZENAS[d] || "";
  const uStr = UNIDADES[u];
  return uStr ? `${dStr} e ${uStr}` : dStr;
}

function grupoToWords(n: number, singular: string, plural: string): string {
  if (n === 0) return "";
  const words = centenaToWords(n);
  return `${words} ${n === 1 ? singular : plural}`;
}

export function numberToWords(valor: number): string {
  if (valor === 0) return "zero reais";

  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);

  const parts: string[] = [];

  if (reais > 0) {
    if (reais >= 1_000_000) {
      const milhoes = Math.floor(reais / 1_000_000);
      const rest = reais % 1_000_000;
      parts.push(grupoToWords(milhoes, "milhão", "milhões"));
      const restStr = centenaToWords(rest);
      if (restStr && parts.length > 0) parts.push(restStr);
      else if (restStr) parts.push(restStr);
    } else if (reais >= 1000) {
      const milhares = Math.floor(reais / 1000);
      const rest = reais % 1000;
      if (milhares === 1) {
        parts.push("mil");
      } else {
        parts.push(grupoToWords(milhares, "mil", "mil"));
      }
      const restStr = centenaToWords(rest);
      if (restStr) parts.push(restStr);
    } else {
      parts.push(centenaToWords(reais));
    }
  }

  let result = parts.length > 0 ? `${parts.join(" e ")} reais` : "";

  if (centavos > 0) {
    const centsStr = centenaToWords(centavos);
    if (result) {
      result += ` e ${centsStr} centavo${centavos > 1 ? "s" : ""}`;
    } else {
      result = `${centsStr} centavo${centavos > 1 ? "s" : ""}`;
    }
  }

  return result;
}