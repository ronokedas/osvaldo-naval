import { db, pool } from "./index.js";
import { users } from "./schema.js";
import { eq, ilike } from "drizzle-orm";
import * as argon2 from "argon2";
import { initializeModuleAccess, PERMISSIONS } from "../server/permissions.js";

async function run() {
  console.log("Aplicando permissões iniciais de usuários...");
  try {
    const allUsers = await db.select().from(users);

    // Legacy accounts receive their former menu access exactly once. The marker
    // added by initializeModuleAccess prevents Docker restarts from undoing an
    // administrator's later choices.
    for (const user of allUsers) {
      const permissions = initializeModuleAccess(user.permissions, user.role);
      if (JSON.stringify(permissions) !== JSON.stringify(user.permissions || [])) {
        await db.update(users).set({ permissions, updatedAt: new Date() }).where(eq(users.id, user.id));
      }
    }

    // Osvaldo: admin + all technical permissions
    const osvaldo = allUsers.find((u) => u.email.toLowerCase() === "osvaldo@nautilus.eng.br");
    if (osvaldo) {
      await db.update(users).set({
        permissions: initializeModuleAccess(osvaldo.permissions, osvaldo.role),
        updatedAt: new Date(),
      }).where(eq(users.id, osvaldo.id));
      console.log(`Permissões aplicadas a Osvaldo (${osvaldo.email})`);
    } else {
      console.log("Osvaldo não encontrado. Criando...");
      const hashed = await argon2.hash("123456");
      await db.insert(users).values({
        nome: "Osvaldo",
        email: "osvaldo@nautilus.eng.br",
        role: "admin",
        cargo: "Administrador / Responsável Técnico",
        senha: hashed,
        permissions: initializeModuleAccess([
          PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS,
          PERMISSIONS.REGISTRAR_ACEITE_AGENDAR,
          PERMISSIONS.EXECUTAR_VISTORIA,
          PERMISSIONS.ANEXAR_EDITAR_VERSOES,
          PERMISSIONS.REVISAR_DOCUMENTOS,
          PERMISSIONS.APROVAR_TECNICAMENTE,
          PERMISSIONS.REGISTRAR_ENVIO_RESPOSTA_EXTERNA,
          PERMISSIONS.ENTREGAR_CONCLUIR,
          PERMISSIONS.FINANCEIRO_ADMINISTRACAO,
        ], "admin"),
      });
      console.log("Osvaldo criado.");
    }

    // Deisy: comercial, financeiro, agendamento, edição de versões
    const deisy = allUsers.find((u) => u.email.toLowerCase() === "deisy@nautilus.eng.br");
    const deisyPerms = [
      PERMISSIONS.CADASTRAR_CLIENTES_EMBARCACOES_PROPOSTAS,
      PERMISSIONS.REGISTRAR_ACEITE_AGENDAR,
      PERMISSIONS.ANEXAR_EDITAR_VERSOES,
      PERMISSIONS.FINANCEIRO_ADMINISTRACAO,
    ];
    if (deisy) {
      await db.update(users).set({
        permissions: initializeModuleAccess(deisy.permissions, deisy.role),
        updatedAt: new Date(),
      }).where(eq(users.id, deisy.id));
      console.log(`Permissões aplicadas a Deisy (${deisy.email})`);
    } else {
      console.log("Deisy não encontrada. Criando...");
      const hashed = await argon2.hash("123456");
      await db.insert(users).values({
        nome: "Deisy Saldanha",
        email: "deisy@nautilus.eng.br",
        role: "financeiro",
        cargo: "Comercial / Financeiro",
        senha: hashed,
        permissions: initializeModuleAccess(deisyPerms, "financeiro"),
      });
      console.log("Deisy criada.");
    }

    // Lucas: edição de versões, entrega, conclusão; create lucas@nautilus.eng.br senha 123456
    const lucas = allUsers.find((u) => u.email.toLowerCase() === "lucas@nautilus.eng.br");
    const lucasPerms = [
      PERMISSIONS.ANEXAR_EDITAR_VERSOES,
      PERMISSIONS.EXECUTAR_ENTREGAS,
      PERMISSIONS.ENTREGAR_CONCLUIR,
    ];
    if (lucas) {
      const existingLucasPermissions = Array.isArray(lucas.permissions) ? lucas.permissions.map(String) : [];
      await db.update(users).set({
        permissions: initializeModuleAccess([...new Set([...existingLucasPermissions, ...lucasPerms])], lucas.role),
        updatedAt: new Date(),
      }).where(eq(users.id, lucas.id));
      console.log(`Permissões aplicadas a Lucas (${lucas.email})`);
    } else {
      console.log("Lucas não encontrado. Criando...");
      const hashed = await argon2.hash("123456");
      await db.insert(users).values({
        nome: "Lucas",
        email: "lucas@nautilus.eng.br",
        role: "tecnico",
        cargo: "Entregador",
        senha: hashed,
        permissions: initializeModuleAccess(lucasPerms, "tecnico"),
      });
      console.log(`Lucas criado com senha inicial 123456.`);
    }

    console.log("Setup de permissões concluído!");
  } catch (err) {
    console.error("Falha ao aplicar permissões:", err);
    process.exitCode = 1;
  } finally {
    pool.end();
  }
}

run();
