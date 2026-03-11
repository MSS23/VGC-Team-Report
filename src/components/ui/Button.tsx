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
  const base = "inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 disabled:opacity-40 disabled:cursor-not-allowed tracking-wide";

  const variants = {
    primary: "bg-accent text-white hover:brightness-110 active:scale-[0.97] shadow-md shadow-accent/30 hover:shadow-lg hover:shadow-accent/25",
    secondary: "bg-surface text-text-primary border-2 border-border hover:border-accent/40 hover:bg-accent-surface active:scale-[0.97]",
    ghost: "text-text-secondary hover:text-accent hover:bg-accent-surface/60 active:scale-[0.97]",
  };

  const sizes = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
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
