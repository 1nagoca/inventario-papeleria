import "./QuantityStepper.css";

interface Props {
  valor: number;
  onChange: (valor: number) => void;
  min?: number;
  max?: number;
}

export function QuantityStepper({ valor, onChange, min = 1, max }: Props) {
  function decrementar() {
    onChange(Math.max(min, valor - 1));
  }

  function incrementar() {
    onChange(max !== undefined ? Math.min(max, valor + 1) : valor + 1);
  }

  function manejarInput(e: React.ChangeEvent<HTMLInputElement>) {
    const n = Number(e.target.value);
    if (!Number.isFinite(n)) return;
    const acotado = max !== undefined ? Math.min(max, n) : n;
    onChange(Math.max(min, Math.trunc(acotado)));
  }

  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__boton"
        onClick={decrementar}
        disabled={valor <= min}
        aria-label="Restar una unidad"
      >
        −
      </button>
      <input
        className="stepper__input"
        type="number"
        inputMode="numeric"
        value={valor}
        onChange={manejarInput}
        min={min}
        max={max}
        aria-label="Cantidad"
      />
      <button
        type="button"
        className="stepper__boton"
        onClick={incrementar}
        disabled={max !== undefined && valor >= max}
        aria-label="Sumar una unidad"
      >
        +
      </button>
    </div>
  );
}
