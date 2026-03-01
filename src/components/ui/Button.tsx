interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-accent text-white hover:bg-accent/85 active:scale-[0.98] shadow-sm shadow-accent/25 hover:shadow-md hover:shadow-accent/20",
    secondary: "bg-surface text-text-primary border border-border hover:bg-surface-alt hover:border-border active:scale-[0.98]",
    ghost: "text-text-secondary hover:text-text-primary hover:bg-surface-alt/80 active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-sm gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-7 py-3 text-base gap-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
