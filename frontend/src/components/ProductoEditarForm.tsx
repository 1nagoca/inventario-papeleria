import { useState } from "react";
import { ApiError } from "../api/client";
import { actualizarProducto } from "../api/products";
import type { Product } from "../types/product";
import "./ProductoForm.css";

interface Props {
  producto: Product;
  onCancelar: () => void;
  onGuardado: (producto: Product) => void;
}

export function ProductoEditarForm({ producto, onCancelar, onGuardado }: Props) {
  const [nombre, setNombre] = useState(producto.nombre);
  const [precio, setPrecio] = useState(String(producto.precio));
  const [stockMinimo, setStockMinimo] = useState(String(producto.stockMinimo));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    const precioNum = Number(precio);
    const minimoNum = Number(stockMinimo);

    if (!nombre.trim()) {
      setError("Escribe el nombre del producto.");
      return;
    }
    if (!Number.isInteger(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número mayor a 0.");
      return;
    }
    if (!Number.isInteger(minimoNum) || minimoNum <= 0) {
      setError("El stock mínimo debe ser un número mayor a 0.");
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      const actualizado = await actualizarProducto(producto.id, {
        nombre: nombre.trim(),
        precio: precioNum,
        stockMinimo: minimoNum,
      });
      onGuardado(actualizado);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo guardar el producto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <li className="producto-form producto-form--tarjeta">
      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`editar-nombre-${producto.id}`}>
          Nombre
        </label>
        <input
          id={`editar-nombre-${producto.id}`}
          className="campo__input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`editar-precio-${producto.id}`}>
          Precio
        </label>
        <input
          id={`editar-precio-${producto.id}`}
          className="campo__input"
          type="number"
          inputMode="numeric"
          min={1}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor={`editar-minimo-${producto.id}`}>
          Stock mínimo
        </label>
        <input
          id={`editar-minimo-${producto.id}`}
          className="campo__input"
          type="number"
          inputMode="numeric"
          min={1}
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
        />
        <p className="campo__ayuda">
          Unidades actuales: {producto.stock}. Para cambiarlas, usa Vender o Agregar productos.
        </p>
      </div>

      {error && (
        <div className="mensaje-error" role="alert">
          {error}
        </div>
      )}

      <div className="producto-form__acciones">
        <button type="button" className="boton boton--primario" disabled={enviando} onClick={guardar}>
          {enviando ? "Guardando..." : "Guardar cambios"}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </li>
  );
}
