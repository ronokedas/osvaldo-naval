import test from 'node:test';
import assert from 'node:assert/strict';
import { agendaDateInPeriod, classifyAgendaDate, getAgendaPeriodRange, getAgendaWeekRange, getSaoPauloDate, isValidAgendaDate, isValidAgendaTime } from './team-agenda.js';

const instant = (value: string) => new Date(value);

test('calcula hoje e a semana de segunda a domingo', () => {
  const now = instant('2026-08-27T02:00:00.000Z');
  assert.equal(getSaoPauloDate(now), '2026-08-26');
  assert.deepEqual(getAgendaWeekRange(now), { today: '2026-08-26', start: '2026-08-24', end: '2026-08-30' });
  assert.equal(classifyAgendaDate('2026-08-26', now), 'today');
  assert.equal(classifyAgendaDate('2026-08-30', now), 'week');
  assert.equal(classifyAgendaDate('2026-08-31', now), 'upcoming');
  assert.equal(classifyAgendaDate('2026-08-23', now), 'history');
});

test('trata viradas de mês e ano sem deslocamento UTC', () => {
  const now = instant('2026-01-01T15:00:00.000Z');
  assert.deepEqual(getAgendaWeekRange(now), { today: '2026-01-01', start: '2025-12-29', end: '2026-01-04' });
  assert.equal(classifyAgendaDate('2025-12-28', now), 'history');
  assert.equal(classifyAgendaDate('2026-01-05', now), 'upcoming');
});

test('valida datas e horários dos agendamentos', () => {
  assert.equal(isValidAgendaDate('2026-02-28'), true);
  assert.equal(isValidAgendaDate('2026-02-29'), false);
  assert.equal(isValidAgendaDate('2026-2-09'), false);
  assert.equal(isValidAgendaTime('08:00'), true);
  assert.equal(isValidAgendaTime('23:30'), true);
  assert.equal(isValidAgendaTime('08:15'), false);
  assert.equal(isValidAgendaTime('24:00'), false);
});

test('define corretamente os limites de cada aba', () => {
  const now = instant('2026-08-27T12:00:00.000Z');
  assert.deepEqual(getAgendaPeriodRange('today', now), { start: '2026-08-27', end: '2026-08-27' });
  assert.equal(agendaDateInPeriod('2026-08-24', 'week', now), true);
  assert.equal(agendaDateInPeriod('2026-08-31', 'week', now), false);
  assert.equal(agendaDateInPeriod('2026-09-01', 'upcoming', now), true);
  assert.equal(agendaDateInPeriod('2026-08-23', 'history', now), true);
});
