import { TeamAgendaPeriod } from '../types/index.js';

export const AGENDA_TIMEZONE = 'America/Sao_Paulo' as const;

type DateParts = { year: number; month: number; day: number };

const pad = (value: number) => String(value).padStart(2, '0');

export const formatAgendaDate = ({ year, month, day }: DateParts): string =>
  `${year}-${pad(month)}-${pad(day)}`;

export const getSaoPauloDate = (now: Date = new Date()): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: AGENDA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return formatAgendaDate({ year: get('year'), month: get('month'), day: get('day') });
};

const parseDate = (value: string): DateParts | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month, day };
};

const shiftDate = (value: string, amount: number): string => {
  const parsed = parseDate(value);
  if (!parsed) return value;
  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + amount));
  return formatAgendaDate({ year: shifted.getUTCFullYear(), month: shifted.getUTCMonth() + 1, day: shifted.getUTCDate() });
};

export const isValidAgendaDate = (value: unknown): value is string => typeof value === 'string' && parseDate(value) !== null;
export const isValidAgendaTime = (value: unknown): value is string => typeof value === 'string' && /^(?:[01]\d|2[0-3]):(?:00|30)$/.test(value);

/**
 * Janela da aba semanal: os sete dias completos a partir de amanhã.
 * Não usamos a semana-calendário para não exibir dias que já passaram.
 */
export const getAgendaWeekRange = (now: Date = new Date()): { today: string; start: string; end: string } => {
  const today = getSaoPauloDate(now);
  const start = shiftDate(today, 1);
  return { today, start, end: shiftDate(today, 7) };
};

export const getAgendaPeriodRange = (period: TeamAgendaPeriod, now: Date = new Date()): { start?: string; end?: string } => {
  const week = getAgendaWeekRange(now);
  if (period === 'today') return { start: week.today, end: week.today };
  if (period === 'week') return { start: week.start, end: week.end };
  if (period === 'upcoming') return { start: shiftDate(week.end, 1), end: shiftDate(week.end, 30) };
  return { end: shiftDate(week.today, -1) };
};

export const classifyAgendaDate = (date: string, now: Date = new Date()): TeamAgendaPeriod | null => {
  if (!isValidAgendaDate(date)) return null;
  const range = getAgendaPeriodRange('week', now);
  const today = getSaoPauloDate(now);
  if (date === today) return 'today';
  if (date >= range.start! && date <= range.end!) return 'week';
  if (agendaDateInPeriod(date, 'upcoming', now)) return 'upcoming';
  return date < today ? 'history' : null;
};

export const agendaDateInPeriod = (date: string, period: TeamAgendaPeriod, now: Date = new Date()): boolean => {
  const range = getAgendaPeriodRange(period, now);
  return (!range.start || date >= range.start) && (!range.end || date <= range.end);
};
