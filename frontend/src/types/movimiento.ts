export type TipoMovimiento = "VENTA" | "ENTRADA";

export interface Movimiento {
  id: number;
  productoId: number;
  tipo: TipoMovimiento;
  cantidad: number;
  precioUnitario: number;
  total: number;
  fecha: string;
  createdAt: string;
}

export interface MovimientoConProducto extends Movimiento {
  producto: { nombre: string };
}
