interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  bgColor?: string;
  className?: string;
}

export function Badge({ children, color, bgColor, className = "" }: BadgeProps) {
  const style = color && bgColor
    ? { color, backgroundColor: bgColor }
    : {};

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-bold rounded-md tracking-wide ${!color ? "bg-accent-surface text-accent" : ""} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
