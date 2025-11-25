"use client";

import type { HTMLAttributes } from "react";
import clsx from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: "section" | "article" | "div";
}

export function Card({ as: Comp = "div", className, ...props }: CardProps) {
  return (
    <Comp
      className={clsx(
        "rounded-2xl border border-slate-800/70 bg-slate-900/70 shadow-lg shadow-slate-950/40 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("p-4 sm:p-5", className)} {...props} />;
}
