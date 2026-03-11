interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none group min-h-[36px]">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[24px] w-[42px] items-center rounded-full transition-all duration-300 flex-shrink-0 ${
          checked ? "bg-accent shadow-md shadow-accent/30" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-all duration-300 ${
            checked ? "translate-x-[20px] scale-110" : "translate-x-[3px]"
          }`}
        />
      </button>
      <span className="text-xs font-semibold text-text-secondary group-hover:text-text-primary transition-colors hidden sm:inline uppercase tracking-wider">{label}</span>
    </label>
  );
}
