import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { registrarEntrada } from "../api/entries";
import { getProducts } from "../api/products";
import type { RegistrarMovimientoResultado } from "../api/sales";
import { QuantityStepper } from "../components/QuantityStepper";
import type { Product } from "../types/product";

export function Agregar() {
  const [productos, setProductos] = useState<Product[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);

  const [productoId, setProductoId] = useState<number | "">("");
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<RegistrarMovimientoResultado | null>(null);

  useEffect(() => {
    getProducts()
      .then((datos) => {
        setProductos(datos);
        setCargando(false);
      })
      .catch(() => {
        setErrorCarga(true);
        setCargando(false);
      });
  }, []);

  const productoSeleccionado = productos.find((p) => p.id === productoId) ?? null;

  function elegirProducto(id: string) {
    setProductoId(id === "" ? "" : Number(id));
    setCantidad(1);
    setError(null);
  }

  async function confirmarEntrada() {
    if (!productoSeleccionado) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await registrarEntrada({ productoId: productoSeleccionado.id, cantidad });
      setResultado(res);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("No se pudo registrar la entrada. Intenta de nuevo.");
      }
    } finally {
      setEnviando(false);
    }
  }

  function registrarOtra() {
    setResultado(null);
    setProductoId("");
    setCantidad(1);
    setError(null);
  }

  if (resultado) {
    return (
      <>
        <h1 className="page-titulo">Entrada registrada</h1>
        <div className="mensaje-exito">
          Agregaste {resultado.movimiento.cantidad} {resultado.producto.nombre} al inventario.
          Ahora hay {resultado.producto.stock} unidades.
        </div>
        <button type="button" className="boton boton--primario" onClick={registrarOtra}>
          Registrar otra entrada
        </button>
        <div style={{ height: "0.75rem" }} />
        <Link to="/" className="boton boton--secundario">
          Volver al inicio
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="page-titulo">Agregar productos</h1>
      <p className="page-subtitulo">Elige el producto y cuántas unidades llegaron.</p>

      {cargando && <p>Cargando productos...</p>}
      {errorCarga && <p role="alert">No se pudieron cargar los productos.</p>}

      {!cargando && !errorCarga && (
        <>
          <div className="campo">
            <label className="campo__etiqueta" htmlFor="producto">
              Producto
            </label>
            <select
              id="producto"
              className="campo__select"
              value={productoId}
              onChange={(e) => elegirProducto(e.target.value)}
            >
              <option value="">Selecciona un producto</option>
              {productos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          {productoSeleccionado && (
            <div className="campo">
              <span className="campo__etiqueta">Cantidad</span>
              <QuantityStepper valor={cantidad} onChange={setCantidad} min={1} />
              <p className="campo__ayuda">
                Actualmente hay {productoSeleccionado.stock} unidades
              </p>
            </div>
          )}

          {error && (
            <div className="mensaje-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="button"
            className="boton boton--primario"
            disabled={!productoSeleccionado || enviando}
            onClick={confirmarEntrada}
          >
            {enviando ? "Registrando..." : "Confirmar entrada"}
          </button>
        </>
      )}
    </>
  );
}
