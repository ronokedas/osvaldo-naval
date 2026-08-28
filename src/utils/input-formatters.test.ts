import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCurrency, parseCurrencyInput } from './input-formatters.js';

test('máscara de moeda acumula dígitos como centavos', () => {
  assert.equal(parseCurrencyInput('2'), 0.02);
  assert.equal(parseCurrencyInput('20'), 0.2);
  assert.equal(parseCurrencyInput('200'), 2);
  assert.equal(parseCurrencyInput('200000'), 2000);
  assert.equal(formatCurrency(parseCurrencyInput('200000')), 'R$ 2.000,00');
});

test('máscara preserva o valor de moeda já formatada', () => {
  assert.equal(parseCurrencyInput('R$ 2.000,00'), 2000);
  assert.equal(parseCurrencyInput(''), 0);
});
