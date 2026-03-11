interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = "", glow = false }: CardProps) {
  return (
    <div className={`bg-surface rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300 ${
      glow ? "border-accent/20 hover:border-accent/40 shadow-accent/5" : "hover:border-border"
    } ${className}`}>
      {children}
    </div>
  );
}
