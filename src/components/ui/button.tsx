import * as React from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "outline" | "panel";
  size?: "sm" | "default";
};

export function Button({ className, variant = "default", size = "default", ...props }: ButtonProps) {
  const variants = {
    default: "scanline bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/92",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background/70 hover:bg-accent hover:text-accent-foreground",
    panel: "bg-panel text-panel-foreground hover:bg-panel/92",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-semibold tracking-[-0.01em] transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:translate-y-0 disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 py-2 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
