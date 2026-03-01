interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-[22px] w-[40px] items-center rounded-full transition-colors duration-200 ${
          checked ? "bg-accent shadow-sm shadow-accent/30" : "bg-border"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-[20px]" : "translate-x-[3px]"
          }`}
        />
      </button>
      <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">{label}</span>
    </label>
  );
}
