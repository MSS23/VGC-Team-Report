interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`bg-surface rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-border-subtle transition-all duration-300 ${className}`}>
      {children}
    </div>
  );
}
