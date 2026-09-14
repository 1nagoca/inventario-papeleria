export type TipoMovimiento = "VENTA" | "ENTRADA";

export interface Movimiento {
  id: number;
  productoId: number;
  tipo: TipoMovimiento;
  cantidad: number;
  precioUnitario: number;
  total: number;
  cancelado: boolean;
  fecha: string;
  createdAt: string;
}

export interface MovimientoConProducto extends Movimiento {
  producto: { nombre: string };
}

export interface TotalPeriodo {
  pesos: number;
  unidades: number;
}

export interface ResumenVentas {
  ultimos15Dias: TotalPeriodo;
  esteMes: TotalPeriodo;
}
