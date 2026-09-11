import { NavLink } from "react-router-dom";
import { IconAgregar, IconHistorial, IconInventario, IconProductos, IconVender } from "./icons";
import "./BottomNav.css";

const ENLACES = [
  { to: "/", label: "Inicio", Icono: IconInventario, fin: true },
  { to: "/vender", label: "Vender", Icono: IconVender, fin: false },
  { to: "/agregar", label: "Agregar", Icono: IconAgregar, fin: false },
  { to: "/historial", label: "Historial", Icono: IconHistorial, fin: false },
  { to: "/productos", label: "Productos", Icono: IconProductos, fin: false },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {ENLACES.map(({ to, label, Icono, fin }) => (
        <NavLink
          key={to}
          to={to}
          end={fin}
          className={({ isActive }) => `bottom-nav__item${isActive ? " bottom-nav__item--activo" : ""}`}
        >
          <Icono className="bottom-nav__icono" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
