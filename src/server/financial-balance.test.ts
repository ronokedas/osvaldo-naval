import test from "node:test";
import assert from "node:assert/strict";
import { paidAmount, receivableBalance, receivableStatus } from "./financial-balance.js";

test("partial and full payments use the same canonical balance", () => {
  const payments = [{ valor: "250" }, { valor: "250" }];
  assert.equal(paidAmount(payments), 500);
  assert.equal(receivableBalance("2000", payments), 1500);
  assert.equal(receivableStatus("2000", payments), "parcial");
  assert.equal(receivableStatus("500", payments), "pago");
});

test("inactive payments never reduce an account balance", () => {
  const payments = [{ valor: "250", ativo: false }];
  assert.equal(paidAmount(payments), 0);
  assert.equal(receivableBalance("250", payments), 250);
  assert.equal(receivableStatus("250", payments), "pendente");
});
