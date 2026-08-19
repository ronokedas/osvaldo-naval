export const formatDateBR = (value?: string | Date | null): string => {
  if (!value) return '';
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString('pt-BR');
  }
  const text = String(value).trim();
  if (!text) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? text : parsed.toLocaleDateString('pt-BR');
};

export const formatDateTimeBR = (value?: string | Date | null): string => {
  if (!value) return '';
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatDateBR(value);
  return parsed.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
