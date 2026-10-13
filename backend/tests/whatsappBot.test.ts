import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Interpretacion } from "../src/services/interpreteVentas.service";
import {
  ProductoDescontinuadoError,
  StockInsuficienteError,
} from "../src/services/movimientos.service";
import { type ProductoBot, crearBot } from "../src/services/whatsappBot.service";

const ABUELA = "573001112233";
const MAMA = "573004445566";

const LAPIZ = 1;
const CUADERNO = 2;
const BORRADOR = 3;
const CARTULINA = 4;

const PRECIOS: Record<number, number> = { [LAPIZ]: 1000, [CUADERNO]: 1500, [BORRADOR]: 500 };

let productos: ProductoBot[];
let interpretacion: Interpretacion;
let interpretar: ReturnType<typeof vi.fn>;
let registrarVenta: ReturnType<typeof vi.fn>;
let bot: ReturnType<typeof crearBot>;

function venta(...items: Array<[productoId: number, cantidad: number]>): Interpretacion {
  return {
    esVenta: true,
    items: items.map(([productoId, cantidad]) => ({ productoId, cantidad })),
    noReconocidos: [],
  };
}

const NO_ES_VENTA: Interpretacion = { esVenta: false, items: [], noReconocidos: [] };

const INICIO = new Date("2026-10-12T10:00:00Z");

function enviar(texto: string, minutosDespues = 0, telefono = ABUELA) {
  return bot.procesarMensaje({
    telefono,
    texto,
    fecha: new Date(INICIO.getTime() + minutosDespues * 60_000),
  });
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  productos = [
    { id: LAPIZ, nombre: "Lápiz", stock: 10, descontinuado: false },
    { id: CUADERNO, nombre: "Cuaderno", stock: 2, descontinuado: false },
    { id: BORRADOR, nombre: "Borrador", stock: 0, descontinuado: false },
    { id: CARTULINA, nombre: "Cartulina", stock: 5, descontinuado: true },
  ];
  interpretacion = NO_ES_VENTA;
  interpretar = vi.fn(async () => interpretacion);
  registrarVenta = vi.fn(async ({ productoId, cantidad }) => ({
    movimiento: { total: PRECIOS[productoId] * cantidad },
  }));
  bot = crearBot({ listarProductos: async () => productos, interpretar, registrarVenta });
});

describe("proponer y confirmar una venta", () => {
  it("pide confirmación y no registra nada hasta recibir el sí", async () => {
    interpretacion = venta([LAPIZ, 3], [CUADERNO, 1]);

    const respuesta = await enviar("hoy vendí 3 lápices y un cuaderno");

    expect(respuesta).toBe("Voy a registrar: 3 Lápiz, 1 Cuaderno. ¿Confirmas? (sí/no)");
    expect(registrarVenta).not.toHaveBeenCalled();
  });

  it("con sí registra cada producto con registrarVenta y responde el total", async () => {
    interpretacion = venta([LAPIZ, 3], [CUADERNO, 1]);
    await enviar("hoy vendí 3 lápices y un cuaderno");

    const respuesta = await enviar("sí", 1);

    expect(registrarVenta).toHaveBeenCalledTimes(2);
    expect(registrarVenta).toHaveBeenCalledWith({ productoId: LAPIZ, cantidad: 3 });
    expect(registrarVenta).toHaveBeenCalledWith({ productoId: CUADERNO, cantidad: 1 });
    expect(respuesta).toBe("Listo, registré la venta: 3 Lápiz, 1 Cuaderno. Total: $4.500.");
  });

  it.each(["Sí", "si", "SII", "Sí.", "si señor", "Sí señora", "confirmo", "dale", "listo", "ok", "👍 ok"])(
    'acepta "%s" como sí',
    async (texto) => {
      interpretacion = venta([LAPIZ, 1]);
      await enviar("vendí un lápiz");

      await enviar(texto, 1);

      expect(registrarVenta).toHaveBeenCalledTimes(1);
    },
  );

  it.each(["no", "No.", "cancelar", "cancela"])('con "%s" cancela sin registrar', async (texto) => {
    interpretacion = venta([LAPIZ, 1]);
    await enviar("vendí un lápiz");

    const respuesta = await enviar(texto, 1);

    expect(respuesta).toBe("Listo, no registré nada.");
    expect(registrarVenta).not.toHaveBeenCalled();
    expect(await enviar("sí", 2)).toContain("No tengo ninguna venta por confirmar");
    expect(registrarVenta).not.toHaveBeenCalled();
  });

  it("un segundo sí no registra la venta dos veces", async () => {
    interpretacion = venta([LAPIZ, 1]);
    await enviar("vendí un lápiz");

    const [primera, segunda] = await Promise.all([enviar("sí", 1), enviar("sí", 1)]);

    expect(registrarVenta).toHaveBeenCalledTimes(1);
    expect(primera).toContain("Listo, registré la venta");
    expect(segunda).toContain("No tengo ninguna venta por confirmar");
  });

  it("sí o no sin nada pendiente no registra ni llama a la IA", async () => {
    expect(await enviar("sí")).toContain("No tengo ninguna venta por confirmar");
    expect(await enviar("no")).toContain("No tengo ninguna venta por confirmar");
    expect(registrarVenta).not.toHaveBeenCalled();
    expect(interpretar).not.toHaveBeenCalled();
  });

  it("suma las cantidades si el mismo producto aparece dos veces", async () => {
    interpretacion = venta([LAPIZ, 2], [LAPIZ, 3]);

    expect(await enviar("2 lápices y después otros 3 lápices")).toBe(
      "Voy a registrar: 5 Lápiz. ¿Confirmas? (sí/no)",
    );
  });

  it("cada número tiene su propia venta por confirmar", async () => {
    interpretacion = venta([LAPIZ, 1]);
    await enviar("vendí un lápiz", 0, ABUELA);

    expect(await enviar("sí", 1, MAMA)).toContain("No tengo ninguna venta por confirmar");
    expect(registrarVenta).not.toHaveBeenCalled();

    await enviar("sí", 2, ABUELA);
    expect(registrarVenta).toHaveBeenCalledTimes(1);
  });
});

describe("tiempo para confirmar", () => {
  it("un sí después de 10 minutos no registra nada", async () => {
    interpretacion = venta([LAPIZ, 1]);
    await enviar("vendí un lápiz");

    const respuesta = await enviar("sí", 11);

    expect(respuesta).toBe("Pasó mucho tiempo y no registré nada. Escríbeme la venta otra vez.");
    expect(registrarVenta).not.toHaveBeenCalled();
    expect(await enviar("sí", 12)).toContain("No tengo ninguna venta por confirmar");
  });

  it("un sí dentro de los 10 minutos sí registra", async () => {
    interpretacion = venta([LAPIZ, 1]);
    await enviar("vendí un lápiz");

    await enviar("sí", 9);

    expect(registrarVenta).toHaveBeenCalledTimes(1);
  });
});

describe("respuestas que no son sí ni no", () => {
  it("si corrige la venta, la nueva reemplaza a la anterior", async () => {
    interpretacion = venta([LAPIZ, 3]);
    await enviar("vendí 3 lápices");

    interpretacion = venta([LAPIZ, 2]);
    expect(await enviar("no, eran 2 lápices", 1)).toBe(
      "Voy a registrar: 2 Lápiz. ¿Confirmas? (sí/no)",
    );

    await enviar("sí", 2);
    expect(registrarVenta).toHaveBeenCalledTimes(1);
    expect(registrarVenta).toHaveBeenCalledWith({ productoId: LAPIZ, cantidad: 2 });
  });

  it("si no se entiende, repite la pregunta y conserva la venta por confirmar", async () => {
    interpretacion = venta([LAPIZ, 3]);
    await enviar("vendí 3 lápices");

    interpretacion = NO_ES_VENTA;
    expect(await enviar("mmm espera", 1)).toBe(
      "No te entendí. Voy a registrar: 3 Lápiz. ¿Confirmas? (sí/no)",
    );

    await enviar("sí", 2);
    expect(registrarVenta).toHaveBeenCalledWith({ productoId: LAPIZ, cantidad: 3 });
  });

  it("una venta nueva con problemas descarta la que estaba por confirmar", async () => {
    interpretacion = venta([LAPIZ, 3]);
    await enviar("vendí 3 lápices");

    interpretacion = venta([CUADERNO, 5]);
    expect(await enviar("mejor 5 cuadernos", 1)).toContain("No registré nada");

    expect(await enviar("sí", 2)).toContain("No tengo ninguna venta por confirmar");
    expect(registrarVenta).not.toHaveBeenCalled();
  });
});

describe("mensajes que no se pueden proponer", () => {
  it("mensaje que no es una venta: explica cómo escribir", async () => {
    const respuesta = await enviar("hola, buenos días");

    expect(respuesta).toContain("No te entendí");
    expect(respuesta).toContain("vendí 3 lápices y 1 cuaderno");
  });

  it("producto que no existe: no propone nada, aunque otro sí se reconozca", async () => {
    interpretacion = { esVenta: true, items: [{ productoId: LAPIZ, cantidad: 3 }], noReconocidos: ["tijeras"] };

    const respuesta = await enviar("vendí 3 lápices y unas tijeras");

    expect(respuesta).toBe(
      'No encontré "tijeras" entre los productos. No registré nada. Escríbeme la venta otra vez.',
    );
    expect(await enviar("sí", 1)).toContain("No tengo ninguna venta por confirmar");
    expect(registrarVenta).not.toHaveBeenCalled();
  });

  it("producto descontinuado", async () => {
    interpretacion = venta([CARTULINA, 1]);

    expect(await enviar("vendí una cartulina")).toBe(
      "Cartulina ya no se vende. No registré nada. Escríbeme la venta otra vez.",
    );
  });

  it("sin unidades suficientes: dice cuántas quedan", async () => {
    interpretacion = venta([CUADERNO, 5]);

    expect(await enviar("vendí 5 cuadernos")).toBe(
      "Solo quedan 2 de Cuaderno. No registré nada. Escríbeme la venta otra vez.",
    );
  });

  it("producto agotado", async () => {
    interpretacion = venta([BORRADOR, 1]);

    expect(await enviar("vendí un borrador")).toBe(
      "No quedan unidades de Borrador. No registré nada. Escríbeme la venta otra vez.",
    );
  });

  it("la suma del mismo producto también respeta el stock", async () => {
    interpretacion = venta([CUADERNO, 2], [CUADERNO, 1]);

    expect(await enviar("2 cuadernos y otro cuaderno")).toContain("Solo quedan 2 de Cuaderno.");
  });

  it.each([0, -2, 1.5])("cantidad %s: no propone nada", async (cantidad) => {
    interpretacion = venta([LAPIZ, cantidad]);

    expect(await enviar("vendí lápices")).toBe(
      "No entendí cuántas unidades de Lápiz vendiste. No registré nada. Escríbeme la venta otra vez.",
    );
  });

  it("mensaje demasiado largo: no llama a la IA", async () => {
    const respuesta = await enviar("vendí ".repeat(200));

    expect(respuesta).toContain("muy largo");
    expect(interpretar).not.toHaveBeenCalled();
  });

  it("mensaje vacío: no llama a la IA", async () => {
    expect(await enviar("   ")).toContain("vendí 3 lápices y 1 cuaderno");
    expect(interpretar).not.toHaveBeenCalled();
  });
});

describe("fallas", () => {
  it("si la IA falla, avisa y no registra nada", async () => {
    interpretar.mockRejectedValueOnce(new Error("sin conexión"));

    expect(await enviar("vendí 3 lápices")).toBe(
      "Tuve un problema y no registré nada. Inténtalo de nuevo en un momento.",
    );
    expect(registrarVenta).not.toHaveBeenCalled();
  });

  it("si la IA devuelve un producto que no está en la lista, avisa y no registra nada", async () => {
    interpretacion = venta([999, 1]);

    expect(await enviar("vendí algo")).toContain("Tuve un problema");
    expect(await enviar("sí", 1)).toContain("No tengo ninguna venta por confirmar");
  });

  it("si un producto falla al registrar, dice qué registró y qué no", async () => {
    interpretacion = venta([LAPIZ, 3], [CUADERNO, 2]);
    await enviar("vendí 3 lápices y 2 cuadernos");
    registrarVenta.mockImplementation(async ({ productoId, cantidad }) => {
      if (productoId === CUADERNO) throw new StockInsuficienteError(1);
      return { movimiento: { total: PRECIOS[productoId] * cantidad } };
    });

    expect(await enviar("sí", 1)).toBe(
      "Registré solo una parte: 3 Lápiz. Total: $3.000. No pude registrar: 2 Cuaderno (solo quedan 1).",
    );
  });

  it("si nada se pudo registrar, lo dice claramente", async () => {
    interpretacion = venta([LAPIZ, 3]);
    await enviar("vendí 3 lápices");
    registrarVenta.mockRejectedValue(new ProductoDescontinuadoError());

    expect(await enviar("sí", 1)).toBe(
      "No registré nada. No pude registrar: 3 Lápiz (ya no se vende).",
    );
  });
});
