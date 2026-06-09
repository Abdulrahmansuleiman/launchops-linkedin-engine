import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "#2563eb", color: "white", border: "none" },
    secondary: {
      background: "var(--input-bg)",
      color: "var(--foreground)",
      border: "1px solid var(--input-border)",
    },
    ghost: { background: "transparent", color: "var(--muted)", border: "none" },
    danger: { background: "#dc2626", color: "white", border: "none" },
  };

  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-11 px-5 text-sm",
  };

  return (
    <button
      className={cn(base, sizes[size], className)}
      style={variants[variant]}
      {...props}
    >
      {children}
    </button>
  );
}
