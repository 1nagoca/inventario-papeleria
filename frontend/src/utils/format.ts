export function formatPrecio(valor: number): string {
  return `$${valor.toLocaleString("es-CO")}`;
}

export function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}
