import { useState } from "react";
import { ApiError } from "../api/client";
import { crearProducto } from "../api/products";
import type { Product } from "../types/product";
import "./ProductoForm.css";

interface Props {
  onCancelar: () => void;
  onCreado: (producto: Product) => void;
}

export function ProductoCrearForm({ onCancelar, onCreado }: Props) {
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [stockMinimo, setStockMinimo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    const precioNum = Number(precio);

    if (!nombre.trim()) {
      setError("Escribe el nombre del producto.");
      return;
    }
    if (!Number.isInteger(precioNum) || precioNum <= 0) {
      setError("El precio debe ser un número mayor a 0.");
      return;
    }

    setError(null);
    setEnviando(true);
    try {
      const producto = await crearProducto({
        nombre: nombre.trim(),
        precio: precioNum,
        stock: stock === "" ? 0 : Number(stock),
        stockMinimo: stockMinimo === "" ? undefined : Number(stockMinimo),
      });
      onCreado(producto);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo crear el producto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="producto-form">
      <div className="campo">
        <label className="campo__etiqueta" htmlFor="nuevo-nombre">
          Nombre
        </label>
        <input
          id="nuevo-nombre"
          className="campo__input"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Tajalápiz"
        />
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="nuevo-precio">
          Precio
        </label>
        <input
          id="nuevo-precio"
          className="campo__input"
          type="number"
          inputMode="numeric"
          min={1}
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          placeholder="Ej: 500"
        />
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="nuevo-stock">
          Cantidad inicial
        </label>
        <input
          id="nuevo-stock"
          className="campo__input"
          type="number"
          inputMode="numeric"
          min={0}
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          placeholder="0"
        />
      </div>

      <div className="campo">
        <label className="campo__etiqueta" htmlFor="nuevo-minimo">
          Stock mínimo
        </label>
        <input
          id="nuevo-minimo"
          className="campo__input"
          type="number"
          inputMode="numeric"
          min={1}
          value={stockMinimo}
          onChange={(e) => setStockMinimo(e.target.value)}
          placeholder="5"
        />
        <p className="campo__ayuda">
          Cuando queden estas unidades o menos, el producto se marcará como "pocas unidades".
        </p>
      </div>

      {error && (
        <div className="mensaje-error" role="alert">
          {error}
        </div>
      )}

      <div className="producto-form__acciones">
        <button type="button" className="boton boton--primario" disabled={enviando} onClick={guardar}>
          {enviando ? "Guardando..." : "Guardar producto"}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
