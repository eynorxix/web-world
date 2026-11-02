import fs from "node:fs";
import { deleteUserRecord } from "../js/firebase-client.js";

const data = JSON.parse(fs.readFileSync(new URL("../tests/multiuser/usuarios.json", import.meta.url), "utf8"));

for (const user of data.usuarios) {
  await deleteUserRecord(user.correo);
  console.log(`[MULTI] Cuenta eliminada: ${user.id} -> ${user.correo}`);
}

console.log(`[MULTI] Limpieza completada: ${data.usuarios.length} cuentas.`);
