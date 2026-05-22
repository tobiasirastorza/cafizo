"use client";

type NumPadProps = {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onDot?: () => void;
  allowDecimal?: boolean;
  disabled?: boolean;
};

export default function NumPad({
  onDigit,
  onBackspace,
  onDot,
  allowDecimal = false,
  disabled = false,
}: NumPadProps) {
  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

  return (
    <div className="grid grid-cols-3 gap-2 select-none">
      {digits.map((d) => (
        <button
          key={d}
          type="button"
          disabled={disabled}
          onClick={() => onDigit(d)}
          className="h-14 rounded-md border border-border bg-background-card text-2xl font-semibold text-foreground transition-colors duration-100 active:bg-background-active disabled:opacity-50"
        >
          {d}
        </button>
      ))}
      <button
        type="button"
        disabled={disabled || !allowDecimal}
        onClick={() => onDot?.()}
        className="h-14 rounded-md border border-border bg-background-card text-2xl font-semibold text-foreground transition-colors duration-100 active:bg-background-active disabled:opacity-30"
      >
        .
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onDigit("0")}
        className="h-14 rounded-md border border-border bg-background-card text-2xl font-semibold text-foreground transition-colors duration-100 active:bg-background-active disabled:opacity-50"
      >
        0
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        aria-label="Borrar"
        className="h-14 rounded-md border border-border bg-background-muted text-2xl font-semibold text-foreground transition-colors duration-100 active:bg-background-active disabled:opacity-50"
      >
        ⌫
      </button>
    </div>
  );
}
