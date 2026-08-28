import test from 'node:test';
import assert from 'node:assert/strict';
import { agendaDateInPeriod, classifyAgendaDate, getAgendaPeriodRange, getAgendaWeekRange, getSaoPauloDate, isValidAgendaDate, isValidAgendaTime } from './team-agenda.js';

const instant = (value: string) => new Date(value);

test('calcula hoje e os sete dias a partir de amanhã', () => {
  const now = instant('2026-08-27T02:00:00.000Z');
  assert.equal(getSaoPauloDate(now), '2026-08-26');
  assert.deepEqual(getAgendaWeekRange(now), { today: '2026-08-26', start: '2026-08-27', end: '2026-09-02' });
  assert.equal(classifyAgendaDate('2026-08-26', now), 'today');
  assert.equal(classifyAgendaDate('2026-09-02', now), 'week');
  assert.equal(classifyAgendaDate('2026-09-03', now), 'upcoming');
  assert.equal(classifyAgendaDate('2026-08-23', now), 'history');
});

test('trata viradas de mês e ano sem deslocamento UTC', () => {
  const now = instant('2026-01-01T15:00:00.000Z');
  assert.deepEqual(getAgendaWeekRange(now), { today: '2026-01-01', start: '2026-01-02', end: '2026-01-08' });
  assert.equal(classifyAgendaDate('2025-12-28', now), 'history');
  assert.equal(classifyAgendaDate('2026-01-09', now), 'upcoming');
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
  assert.deepEqual(getAgendaPeriodRange('week', now), { start: '2026-08-28', end: '2026-09-03' });
  assert.deepEqual(getAgendaPeriodRange('upcoming', now), { start: '2026-09-04', end: '2026-10-03' });
  assert.equal(agendaDateInPeriod('2026-08-27', 'week', now), false);
  assert.equal(agendaDateInPeriod('2026-09-03', 'week', now), true);
  assert.equal(agendaDateInPeriod('2026-09-04', 'upcoming', now), true);
  assert.equal(agendaDateInPeriod('2026-10-04', 'upcoming', now), false);
  assert.equal(agendaDateInPeriod('2026-08-26', 'history', now), true);
});
