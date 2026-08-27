import test from "node:test";
import assert from "node:assert/strict";
import { allServicesCompleted, getPendingServiceItems, isDeliveryActionPending } from "./delivery-workflow.js";

test("only active delivery task states remain in the deliverer's queue", () => {
  assert.equal(isDeliveryActionPending("pendente"), true);
  assert.equal(isDeliveryActionPending("em_entrega"), true);
  assert.equal(isDeliveryActionPending("aguardando_complemento"), true);
  assert.equal(isDeliveryActionPending("aguardando_reativacao"), false);
  assert.equal(isDeliveryActionPending("pronta_validacao"), false);
  assert.equal(isDeliveryActionPending("concluida"), false);
});

test("the OS only advances after every service item is explicitly completed", () => {
  const items = [
    { id: "osvaldo", status: "concluido" },
    { id: "lucas", status: "pendente" },
  ];
  assert.equal(allServicesCompleted(items), false);
  assert.deepEqual(getPendingServiceItems(items).map((item) => item.id), ["lucas"]);
  assert.equal(allServicesCompleted(items.map((item) => ({ ...item, status: "concluido" }))), true);
  assert.equal(allServicesCompleted([]), false);
});
