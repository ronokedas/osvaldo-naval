import * as schema from "./src/db/schema.js";

function testMapping() {
  const tableConfig = schema.users;
  const mockBackupUsers = [
    {
      id: "c82b404d-080c-47bc-9bfa-f6f709fa39cb",
      nome: "Admin",
      email: "admin@test.com",
      role: "admin",
      cargo: "Administrador",
      ativo: true,
      senha: "hashedpassword",
      avatarUrl: null,
      permissions: [],
      legacy: false,
      createdAt: "2026-08-20T19:08:21.000Z",
      updatedAt: "2026-08-20T19:08:21.000Z"
    }
  ];

  const allKeys = new Set<string>();
  for (const row of mockBackupUsers) {
    if (row && typeof row === "object") {
      Object.keys(row).forEach((k) => allKeys.add(k));
    }
  }

  const chunk = mockBackupUsers.map((row: any) => {
    if (!row || typeof row !== "object") return row;
    const newRow: any = {};
    for (const k of allKeys) {
      let val = row[k] !== undefined ? row[k] : null;
      const columnDef = (tableConfig as any)[k];
      if (columnDef?.dataType === "date") {
        if (val) {
          const date = new Date(val);
          val = isNaN(date.getTime()) ? null : date;
        } else {
          val = null;
        }
      } else if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)) {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          val = date;
        }
      }
      newRow[k] = val;
    }
    return newRow;
  });

  console.log("Mapped createdAt is Date:", chunk[0].createdAt instanceof Date);
  console.log("Mapped updatedAt is Date:", chunk[0].updatedAt instanceof Date);
  console.log("Success!");
}

testMapping();

