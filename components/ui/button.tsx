import * as React from "react";

type Variant = "default" | "secondary" | "ghost" | "outline";
type Size = "default" | "sm";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  default: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
  ghost: "bg-transparent hover:bg-slate-100",
  outline: "border border-slate-300 hover:bg-slate-50",
};

const sizeClasses: Record<Size, string> = {
  default: "h-10 px-4 rounded-xl text-sm",
  sm: "h-8 px-3 rounded-lg text-sm",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const cls = [
      "inline-flex items-center justify-center",
      "transition-colors",
      variantClasses[variant],
      sizeClasses[size],
      className,
    ].join(" ");
    return <button ref={ref} className={cls} {...props} />;
  }
);
Button.displayName = "Button";
