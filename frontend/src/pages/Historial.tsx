import { useEffect, useState } from "react";
import { getMovements } from "../api/movements";
import { MovimientoCard } from "../components/MovimientoCard";
import type { MovimientoConProducto, TipoMovimiento } from "../types/movimiento";
import "./Historial.css";

type Filtro = "TODOS" | TipoMovimiento;

const FILTROS: { valor: Filtro; etiqueta: string }[] = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "VENTA", etiqueta: "Ventas" },
  { valor: "ENTRADA", etiqueta: "Entradas" },
];

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | { tipo: "listo"; movimientos: MovimientoConProducto[] };

export function Historial() {
  const [filtro, setFiltro] = useState<Filtro>("TODOS");
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    cargar(filtro);
  }, [filtro]);

  function cargar(f: Filtro) {
    setEstado({ tipo: "cargando" });
    getMovements(f === "TODOS" ? undefined : f)
      .then((movimientos) => setEstado({ tipo: "listo", movimientos }))
      .catch(() => setEstado({ tipo: "error" }));
  }

  return (
    <>
      <h1 className="page-titulo">Historial</h1>
      <p className="page-subtitulo">Estos son los movimientos del inventario.</p>

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
            <MovimientoCard key={m.id} movimiento={m} />
          ))}
        </ul>
      )}
    </>
  );
}
