import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../api/client";
import { getProducts } from "../api/products";
import { registrarVenta, type RegistrarMovimientoResultado } from "../api/sales";
import { QuantityStepper } from "../components/QuantityStepper";
import type { Product } from "../types/product";
import { formatPrecio } from "../utils/format";
import "./Vender.css";

export function Vender() {
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
  const total = productoSeleccionado ? productoSeleccionado.precio * cantidad : 0;

  function elegirProducto(id: string) {
    setProductoId(id === "" ? "" : Number(id));
    setCantidad(1);
    setError(null);
  }

  async function confirmarVenta() {
    if (!productoSeleccionado) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await registrarVenta({ productoId: productoSeleccionado.id, cantidad });
      setResultado(res);
    } catch (e) {
      if (e instanceof ApiError) {
        const disponibles = e.data?.disponibles;
        setError(
          typeof disponibles === "number"
            ? `${e.message} Quedan ${disponibles} unidades.`
            : e.message,
        );
      } else {
        setError("No se pudo registrar la venta. Intenta de nuevo.");
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
        <h1 className="page-titulo">Venta registrada</h1>
        <div className="mensaje-exito">
          Vendiste {resultado.movimiento.cantidad} {resultado.producto.nombre} por un total de{" "}
          {formatPrecio(resultado.movimiento.total)}.
        </div>
        <button type="button" className="boton boton--primario" onClick={registrarOtra}>
          Registrar otra venta
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
      <h1 className="page-titulo">Registrar venta</h1>
      <p className="page-subtitulo">Elige el producto y cuántas unidades vendiste.</p>

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
                <option key={p.id} value={p.id} disabled={p.stock === 0}>
                  {p.nombre} {p.stock === 0 ? "(agotado)" : ""}
                </option>
              ))}
            </select>
          </div>

          {productoSeleccionado && (
            <>
              <div className="campo">
                <span className="campo__etiqueta">Cantidad</span>
                <QuantityStepper
                  valor={cantidad}
                  onChange={setCantidad}
                  min={1}
                  max={productoSeleccionado.stock}
                />
                <p className="campo__ayuda">Disponibles: {productoSeleccionado.stock} unidades</p>
              </div>

              <div className="resumen-venta">
                <div className="resumen-venta__dato">
                  <span className="resumen-venta__numero">
                    {formatPrecio(productoSeleccionado.precio)}
                  </span>
                  <span className="campo__etiqueta">precio unidad</span>
                </div>
                <div className="resumen-venta__dato">
                  <span className="resumen-venta__numero resumen-venta__numero--total">
                    {formatPrecio(total)}
                  </span>
                  <span className="campo__etiqueta">total</span>
                </div>
              </div>
            </>
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
            onClick={confirmarVenta}
          >
            {enviando ? "Registrando..." : "Confirmar venta"}
          </button>
        </>
      )}
    </>
  );
}
