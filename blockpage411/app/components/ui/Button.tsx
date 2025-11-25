"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  leftIcon?: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  className,
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed";

  const variants: Record<string, string> = {
    primary:
      "bg-gradient-to-r from-amber-300 via-amber-400 to-indigo-500 text-slate-950 shadow-md shadow-amber-300/30 hover:from-amber-200 hover:via-amber-300 hover:to-indigo-400",
    secondary:
      "border border-slate-700 bg-slate-900/60 text-slate-50 hover:border-cyan-400 hover:text-cyan-200",
    ghost:
      "text-slate-300 hover:bg-slate-900/60",
  };

  const sizes: Record<string, string> = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {leftIcon && <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">{leftIcon}</span>}
      <span>{children}</span>
    </button>
  );
}
