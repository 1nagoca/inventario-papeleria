import type { Product } from "../types/product";
import { calcularEstado } from "../utils/estadoProducto";
import { formatPrecio } from "../utils/format";
import { EstadoBadge } from "./EstadoBadge";
import "./ProductCard.css";

export function ProductCard({ producto }: { producto: Product }) {
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
      </div>
    </li>
  );
}
