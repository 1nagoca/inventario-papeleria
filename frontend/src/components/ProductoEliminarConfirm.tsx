import { useState } from "react";
import { ApiError } from "../api/client";
import { eliminarProducto } from "../api/products";
import type { Product } from "../types/product";
import "./ProductoForm.css";

interface Props {
  producto: Product;
  onCancelar: () => void;
  onEliminado: () => void;
}

export function ProductoEliminarConfirm({ producto, onCancelar, onEliminado }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      await eliminarProducto(producto.id);
      onEliminado();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo eliminar el producto.");
      setEnviando(false);
    }
  }

  return (
    <li className="producto-form producto-form--tarjeta">
      <p className="producto-form__pregunta">
        ¿Eliminar <strong>{producto.nombre}</strong>? Esta acción no se puede deshacer.
      </p>

      {error && (
        <div className="mensaje-error" role="alert">
          {error}
        </div>
      )}

      <div className="producto-form__acciones">
        <button type="button" className="boton boton--peligro" disabled={enviando} onClick={confirmar}>
          {enviando ? "Eliminando..." : "Sí, eliminar"}
        </button>
        <button type="button" className="boton boton--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </li>
  );
}
