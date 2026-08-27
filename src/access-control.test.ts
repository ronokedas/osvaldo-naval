import test from "node:test";
import assert from "node:assert/strict";
import { defaultModulesForRole, hasModuleAccess, initializeModuleAccess, mergeModuleAccess, modulePermission } from "./access-control.js";

test("legacy users keep their historical module baseline exactly once", () => {
  const initialized = initializeModuleAccess(["executar_vistoria"], "tecnico");
  assert.equal(hasModuleAccess({ role: "tecnico", permissions: initialized }, "tasks"), true);
  const revoked = mergeModuleAccess(initialized, ["vessels"]);
  assert.equal(hasModuleAccess({ role: "tecnico", permissions: revoked }, "tasks"), false);
  assert.deepEqual(initializeModuleAccess(revoked, "tecnico"), revoked);
});

test("administrators always have module access and settings remain administrator-only", () => {
  assert.equal(hasModuleAccess({ role: "admin", permissions: [] }, "financial"), true);
  assert.equal(hasModuleAccess({ role: "tecnico", permissions: [modulePermission("settings")] }, "settings"), false);
  assert.ok(defaultModulesForRole("financeiro").includes("financial"));
});
