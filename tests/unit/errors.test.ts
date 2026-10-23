import { describe, expect, it } from "vitest";
import { friendlyError } from "@/lib/errors";

describe("mensajes de error", () => {
  it("los mensajes de nuestras funciones se enseñan tal cual", () => {
    expect(friendlyError({ code: "P0001", message: "El correo no existe." })).toBe("El correo no existe.");
    expect(friendlyError({ code: "42501", message: "Solo un administrador puede anular la eliminación." })).toBe("Solo un administrador puede anular la eliminación.");
  });
  it("los errores internos de la base de datos no revelan detalles", () => {
    expect(friendlyError({ code: "42P01", message: 'relation "public.secreta" does not exist' })).toBe("Ha ocurrido un error. Inténtalo de nuevo.");
    expect(friendlyError({ code: "42501", message: "new row violates row-level security policy for table \"sales\"" })).toBe("No tienes permisos para realizar esta acción.");
    expect(friendlyError({ code: "23514", message: 'new row for relation "sales" violates check constraint "x"' })).toBe("Los datos no son válidos.");
    expect(friendlyError({ code: "23514", message: 'violates check constraint "sales_label_path_own_folder"' })).toBe("La etiqueta no corresponde a esta venta.");
  });
  it("errores sin código (red, almacén) siguen igual", () => {
    expect(friendlyError({ message: "fetch failed" })).toMatch(/No se puede conectar/);
    expect(friendlyError(null)).toBe("Ha ocurrido un error.");
  });
});
