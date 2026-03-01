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
      className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${!color ? "bg-accent-surface text-accent" : ""} ${className}`}
      style={style}
    >
      {children}
    </span>
  );
}
