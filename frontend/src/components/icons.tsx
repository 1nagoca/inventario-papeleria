import type { SVGProps } from "react";

const base: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function IconInventario(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16v13H4z" />
      <path d="M4 7l2-4h12l2 4" />
      <path d="M9 11h6" />
    </svg>
  );
}

export function IconVender(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.7L5 4H2" />
      <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconAgregar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 9l8-5 8 5v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M12 11v5M9.5 13.5h5" />
    </svg>
  );
}

export function IconHistorial(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h16M4 12h16M4 19h10" />
    </svg>
  );
}

export function IconProductos(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 12.5 12.5 3H20a1 1 0 0 1 1 1v7.5L11.5 21z" />
      <circle cx="15.5" cy="7.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  );
}
