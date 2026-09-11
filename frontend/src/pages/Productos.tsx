import { useEffect, useState } from "react";
import { getProducts } from "../api/products";
import { ProductoAdminCard } from "../components/ProductoAdminCard";
import { ProductoCrearForm } from "../components/ProductoCrearForm";
import { ProductoEditarForm } from "../components/ProductoEditarForm";
import { ProductoEliminarConfirm } from "../components/ProductoEliminarConfirm";
import type { Product } from "../types/product";

type Accion = { tipo: "editar" | "eliminar"; productoId: number } | null;

type Estado =
  | { tipo: "cargando" }
  | { tipo: "error" }
  | { tipo: "listo"; productos: Product[] };

export function Productos() {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [accion, setAccion] = useState<Accion>(null);

  useEffect(() => {
    cargar();
  }, []);

  function cargar() {
    setEstado({ tipo: "cargando" });
    getProducts()
      .then((productos) => setEstado({ tipo: "listo", productos }))
      .catch(() => setEstado({ tipo: "error" }));
  }

  function alTerminarAccion() {
    setAccion(null);
    setMostrarCrear(false);
    cargar();
  }

  return (
    <>
      <h1 className="page-titulo">Productos</h1>
      <p className="page-subtitulo">Agrega, edita o elimina los productos de tu papelería.</p>

      {!mostrarCrear && (
        <button
          type="button"
          className="boton boton--primario"
          style={{ marginBottom: "1.5rem" }}
          onClick={() => {
            setAccion(null);
            setMostrarCrear(true);
          }}
        >
          Agregar producto nuevo
        </button>
      )}

      {mostrarCrear && (
        <ProductoCrearForm onCancelar={() => setMostrarCrear(false)} onCreado={alTerminarAccion} />
      )}

      {estado.tipo === "cargando" && <p>Cargando productos...</p>}

      {estado.tipo === "error" && (
        <div role="alert">
          <p>No se pudieron cargar los productos. Revisa tu conexión.</p>
          <button type="button" className="boton boton--secundario" onClick={cargar}>
            Reintentar
          </button>
        </div>
      )}

      {estado.tipo === "listo" && (
        <ul style={{ margin: 0, padding: 0 }}>
          {estado.productos.map((producto) => {
            if (accion?.productoId === producto.id && accion.tipo === "editar") {
              return (
                <ProductoEditarForm
                  key={producto.id}
                  producto={producto}
                  onCancelar={() => setAccion(null)}
                  onGuardado={alTerminarAccion}
                />
              );
            }

            if (accion?.productoId === producto.id && accion.tipo === "eliminar") {
              return (
                <ProductoEliminarConfirm
                  key={producto.id}
                  producto={producto}
                  onCancelar={() => setAccion(null)}
                  onEliminado={alTerminarAccion}
                />
              );
            }

            return (
              <ProductoAdminCard
                key={producto.id}
                producto={producto}
                onEditar={() => {
                  setMostrarCrear(false);
                  setAccion({ tipo: "editar", productoId: producto.id });
                }}
                onEliminar={() => {
                  setMostrarCrear(false);
                  setAccion({ tipo: "eliminar", productoId: producto.id });
                }}
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
