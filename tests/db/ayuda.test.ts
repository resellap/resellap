/**
 * Ayuda, soporte y feedback: cada usuario solo escribe lo suyo, nadie lee las
 * tablas directamente y solo el administrador de la plataforma ve la bandeja.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { TEST_DATABASE_URL, TestDb, createTestDatabase, createUser, rpc, selectAs } from "./helpers";

const run = TEST_DATABASE_URL ? describe : describe.skip;

run("Ayuda y feedback", () => {
  let db: TestDb;
  let a: string, b: string, orgA: string;

  beforeAll(async () => {
    db = await createTestDatabase();
    a = await createUser(db, "ayuda-a@prueba.local", undefined, "Tienda A");
    b = await createUser(db, "ayuda-b@prueba.local", undefined, "Tienda B");
    orgA = (await db.client.query("select id from organizations where name = 'Tienda A'")).rows[0].id;
  }, 90_000);

  afterAll(async () => {
    await db?.close();
  });

  it("guarda el feedback con su espacio, su autor y la pantalla", async () => {
    const id = await rpc<number>(db, a, "submit_feedback", "fallo", "  No se guarda el filtro  ", "/ventas", `${orgA}/${a}/x.jpg`);
    const row = (await db.client.query("select organization_id, user_id, user_email, kind, message, page, status from feedback where id = $1", [id])).rows[0];
    expect(row).toMatchObject({ organization_id: orgA, user_id: a, user_email: "ayuda-a@prueba.local", kind: "fallo", message: "No se guarda el filtro", page: "/ventas", status: "nuevo" });
  });

  it("la captura solo puede estar en la carpeta de su espacio y su autor", async () => {
    await expect(rpc(db, b, "submit_feedback", "idea", "Hola hola", null, `${orgA}/${a}/robada.jpg`)).rejects.toThrow(/feedback_shot_own_folder/);
  });

  it("nadie lee ni escribe las tablas directamente", async () => {
    await expect(selectAs(db, a, "select * from feedback")).rejects.toThrow(/permission denied/);
    await expect(selectAs(db, a, "select * from support_requests")).rejects.toThrow(/permission denied/);
    await expect(selectAs(db, a, "insert into support_requests (organization_id, question) values ($1, 'x')", [orgA])).rejects.toThrow(/permission denied/);
  });

  it("dudas: respuesta de la IA, valoración y paso a soporte solo sobre las propias", async () => {
    const id = await rpc<number>(db, a, "support_ask", "¿Cómo importo un Excel?", "/ayuda", false);
    await rpc(db, a, "support_set_ai_answer", id, "Ve a Importar Excel.");
    // Otro usuario no puede tocarla
    expect(await rpc<boolean>(db, b, "support_resolve", id, false)).toBe(false);
    await rpc(db, b, "support_set_ai_answer", id, "Respuesta falsa");
    expect(await rpc<boolean>(db, a, "support_resolve", id, false)).toBe(true);
    // Solo una vez
    expect(await rpc<boolean>(db, a, "support_resolve", id, true)).toBe(false);
    const row = (await db.client.query("select status, ai_answer from support_requests where id = $1", [id])).rows[0];
    expect(row).toEqual({ status: "abierto", ai_answer: "Ve a Importar Excel." });
    expect((await selectAs<{ id: number }>(db, a, "select * from my_support_requests()")).map((r) => Number(r.id))).toEqual([Number(id)]);
    expect(await selectAs(db, b, "select * from my_support_requests()")).toEqual([]);
  });

  it("la bandeja es solo para el administrador de la plataforma", async () => {
    await expect(selectAs(db, a, "select * from platform_feedback()")).rejects.toThrow(/No autorizado/);
    await expect(selectAs(db, a, "select * from platform_support_requests()")).rejects.toThrow(/No autorizado/);
    await expect(selectAs(db, a, "select * from platform_reply_support(1, 'hola')")).rejects.toThrow(/No autorizado/);
    await db.client.query("insert into platform_admins (user_id) values ($1)", [b]);
    const open = await selectAs<{ id: number; question: string }>(db, b, "select * from platform_support_requests() where status = 'abierto'");
    expect(open.map((r) => r.question)).toEqual(["¿Cómo importo un Excel?"]);
    const reply = await selectAs<{ user_email: string }>(db, b, "select * from platform_reply_support($1, 'Desde Importar Excel.')", [open[0].id]);
    expect(reply[0].user_email).toBe("ayuda-a@prueba.local");
    const mine = await selectAs<{ status: string; reply: string }>(db, a, "select * from my_support_requests()");
    expect(mine[0]).toMatchObject({ status: "respondido", reply: "Desde Importar Excel." });
    expect((await selectAs<{ r: { feedback: number } }>(db, b, "select platform_inbox_counts() r"))[0].r.feedback).toBe(1);
  });

  it("límite diario de consultas", async () => {
    for (let i = 0; i < 20; i++) await rpc(db, b, "support_ask", `Pregunta ${i}`, null, true);
    await expect(rpc(db, b, "support_ask", "Una más", null, true)).rejects.toThrow(/muchas consultas/);
  });
});
