import test from 'node:test';
import assert from 'node:assert/strict';
import { isThemePreference, normalizeThemePreference } from './theme';

test('normaliza preferências de tema desconhecidas para o clássico', () => {
  assert.equal(normalizeThemePreference(undefined), 'classic');
  assert.equal(normalizeThemePreference('classic'), 'classic');
  assert.equal(normalizeThemePreference('nautilus_dark'), 'nautilus_dark');
  assert.equal(normalizeThemePreference('dark'), 'classic');
});

test('aceita somente as preferências suportadas', () => {
  assert.equal(isThemePreference('classic'), true);
  assert.equal(isThemePreference('nautilus_dark'), true);
  assert.equal(isThemePreference('dark'), false);
  assert.equal(isThemePreference(null), false);
});
