import type { Product } from "../types/product";
import { calcularEstado } from "../utils/estadoProducto";
import { formatPrecio } from "../utils/format";
import { EstadoBadge } from "./EstadoBadge";
import "./ProductCard.css";
import "./ProductoAdminCard.css";

interface Props {
  producto: Product;
  onEditar: () => void;
  onEliminar: () => void;
}

export function ProductoAdminCard({ producto, onEditar, onEliminar }: Props) {
  const estado = calcularEstado(producto);

  return (
    <li className={`product-card product-card--${estado}`}>
      <div className="product-card__encabezado">
        <span className="product-card__nombre">{producto.nombre}</span>
        <EstadoBadge estado={estado} />
      </div>
      <div className="product-card__datos">
        <div className="product-card__dato">
          <span className="product-card__numero">{producto.stock}</span>
          <span className="product-card__etiqueta">unidades</span>
        </div>
        <div className="product-card__dato">
          <span className="product-card__numero">{formatPrecio(producto.precio)}</span>
          <span className="product-card__etiqueta">precio unidad</span>
        </div>
        <div className="product-card__dato">
          <span className="product-card__numero">{producto.stockMinimo}</span>
          <span className="product-card__etiqueta">stock mínimo</span>
        </div>
      </div>
      <div className="producto-admin-card__acciones">
        <button type="button" className="boton boton--secundario" onClick={onEditar}>
          Editar
        </button>
        <button type="button" className="boton boton--peligro" onClick={onEliminar}>
          Eliminar
        </button>
      </div>
    </li>
  );
}
