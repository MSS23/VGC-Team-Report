interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = "", glow = false }: CardProps) {
  return (
    <div className={`bg-surface rounded-2xl border border-border shadow-sm hover:shadow-lg hover:border-border-subtle transition-all duration-300 ${
      glow ? "ring-1 ring-accent/10 hover:ring-accent/20" : ""
    } ${className}`}>
      {children}
    </div>
  );
}
