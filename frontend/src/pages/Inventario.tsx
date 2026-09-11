import { useEffect, useState } from "react";
import { getMovements } from "../api/movements";
import { getProducts } from "../api/products";
import { ProductCard } from "../components/ProductCard";
import { ResumenDashboard } from "../components/ResumenDashboard";
import type { Product } from "../types/product";
import { calcularEstado } from "../utils/estadoProducto";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; productos: Product[]; ventasHoy: number };

function esHoy(fechaIso: string): boolean {
  return new Date(fechaIso).toDateString() === new Date().toDateString();
}

export function Inventario() {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    cargar();
  }, []);

  function cargar() {
    setEstado({ tipo: "cargando" });
    Promise.all([getProducts(), getMovements("VENTA")])
      .then(([productos, ventas]) => {
        const ventasHoy = ventas.filter((v) => esHoy(v.fecha)).length;
        setEstado({ tipo: "listo", productos, ventasHoy });
      })
      .catch(() =>
        setEstado({
          tipo: "error",
          mensaje: "No se pudo cargar el inventario. Revisa tu conexión.",
        }),
      );
  }

  return (
    <>
      <h1 className="page-titulo">Inventario</h1>
      <p className="page-subtitulo">Esto es lo que hay disponible ahora en la papelería.</p>

      {estado.tipo === "cargando" && <p>Cargando productos...</p>}

      {estado.tipo === "error" && (
        <div role="alert">
          <p>{estado.mensaje}</p>
          <button type="button" className="boton boton--secundario" onClick={cargar}>
            Reintentar
          </button>
        </div>
      )}

      {estado.tipo === "listo" && (
        <>
          <ResumenDashboard
            totalProductos={estado.productos.length}
            totalUnidades={estado.productos.reduce((suma, p) => suma + p.stock, 0)}
            ventasHoy={estado.ventasHoy}
            productosBajos={estado.productos.filter((p) => calcularEstado(p) !== "disponible")}
          />
          <ul style={{ margin: 0, padding: 0 }}>
            {estado.productos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
