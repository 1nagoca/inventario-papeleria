import { useEffect, useState } from "react";
import { getMovements, getResumenVentas } from "../api/movements";
import { MovimientoCard } from "../components/MovimientoCard";
import { ResumenVentasPeriodo } from "../components/ResumenVentasPeriodo";
import type { MovimientoConProducto, ResumenVentas, TipoMovimiento } from "../types/movimiento";
import "./Historial.css";

type Filtro = "TODOS" | TipoMovimiento;

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "VENTA", etiqueta: "Ventas" },
  { valor: "ENTRADA", etiqueta: "Entradas" },
];

// El backend trae como mucho esta cantidad por página. Si una página llega
// completa, asumimos que puede haber más y mostramos "Ver más antiguos".
const TAMANO_PAGINA = 30;

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | {
      tipo: "listo";
      movimientos: MovimientoConProducto[];
      resumen: ResumenVentas;
      hayMasAntiguos: boolean;
      cargandoMas: boolean;
    };

export function Historial() {
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    cargar(filtro);
  }, [filtro]);

  function cargar(f: Filtro) {
    setEstado({ tipo: "cargando" });
    Promise.all([getMovements({ tipo: f === "TODOS" ? undefined : f }), getResumenVentas()])
      .then(([movimientos, resumen]) =>
        setEstado({
          tipo: "listo",
          movimientos,
          resumen,
          hayMasAntiguos: movimientos.length === TAMANO_PAGINA,
          cargandoMas: false,
        }),
      )
      .catch(() => setEstado({ tipo: "error" }));
  }

  function cargarMasAntiguos() {
    if (estado.tipo !== "listo" || estado.movimientos.length === 0) return;
    const masAntiguo = estado.movimientos[estado.movimientos.length - 1];

    setEstado({ ...estado, cargandoMas: true });
    getMovements({
      tipo: filtro === "TODOS" ? undefined : filtro,
      antesDe: masAntiguo.fecha,
    })
      .then((nuevos) => {
        setEstado((actual) =>
          actual.tipo === "listo"
            ? {
                ...actual,
                movimientos: [...actual.movimientos, ...nuevos],
                hayMasAntiguos: nuevos.length === TAMANO_PAGINA,
                cargandoMas: false,
              }
            : actual,
        );
      })
      .catch(() => {
        setEstado((actual) => (actual.tipo === "listo" ? { ...actual, cargandoMas: false } : actual));
      });
  }

  return (
    <>
      <h1 className="page-titulo">Historial</h1>
      <p className="page-subtitulo">Estos son los movimientos del inventario.</p>

      {estado.tipo === "listo" && <ResumenVentasPeriodo resumen={estado.resumen} />}

      <div className="filtro-historial" role="group" aria-label="Filtrar movimientos">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            className={`filtro-historial__boton${
              filtro === f.valor ? " filtro-historial__boton--activo" : ""
            }`}
            onClick={() => setFiltro(f.valor)}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {estado.tipo === "cargando" && <p>Cargando movimientos...</p>}

      {estado.tipo === "error" && (
        <div role="alert">
          <p>No se pudo cargar el historial. Revisa tu conexión.</p>
          <button
            type="button"
            className="boton boton--secundario"
            onClick={() => cargar(filtro)}
          >
            Reintentar
          </button>
        </div>
      )}

      {estado.tipo === "listo" && estado.movimientos.length === 0 && (
        <p className="page-subtitulo">Todavía no hay movimientos registrados.</p>
      )}

      {estado.tipo === "listo" && estado.movimientos.length > 0 && (
        <ul style={{ margin: 0, padding: 0 }}>
          {estado.movimientos.map((m) => (
            <MovimientoCard key={m.id} movimiento={m} onAnulado={() => cargar(filtro)} />
          ))}
        </ul>
      )}

      {estado.tipo === "listo" && estado.hayMasAntiguos && (
        <button
          type="button"
          className="boton boton--secundario"
          style={{ marginTop: "0.5rem" }}
          onClick={cargarMasAntiguos}
          disabled={estado.cargandoMas}
        >
          {estado.cargandoMas ? "Cargando..." : "Ver más antiguos"}
        </button>
      )}
    </>
  );
}
