"use client";
import React, { useEffect, useState } from 'react';

type Props = React.HTMLAttributes<HTMLDivElement> & {
  children?: React.ReactNode;
  // allow any motion props but keep them optional
  whileHover?: any;
  animate?: any;
  initial?: any;
  variants?: any;
  transition?: any;
};

const MOTION_PROP_KEYS = new Set([
  'animate',
  'initial',
  'variants',
  'transition',
  'whileHover',
  'whileTap',
  'whileFocus',
  'whileDrag',
]);

export default function ClientOnlyMotion(props: Props) {
  const { children, ...rest } = props as Props;
  const [MotionDiv, setMotionDiv] = useState<React.ComponentType<any> | null>(null);
  const [isHover, setIsHover] = useState(false);

  useEffect(() => {
    let mounted = true;
    import('framer-motion')
      .then((mod) => {
        if (!mounted) return;
        setMotionDiv(() => (mod.motion && mod.motion.div) || null);
      })
      .catch(() => {
        setMotionDiv(() => null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // If motion is available, forward all props so motion works as expected
  if (MotionDiv) {
    const Comp: any = MotionDiv;
    return <Comp {...rest}>{children}</Comp>;
  }

  // Server/client-fallback: strip motion-specific props before spreading to DOM
  const safeProps: Record<string, any> = {};
  Object.entries(rest).forEach(([k, v]) => {
    if (!MOTION_PROP_KEYS.has(k)) safeProps[k] = v;
  });

  // Provide a small JS hover fallback if `whileHover` was provided
  const hasWhileHover = (rest as any).whileHover !== undefined;
  const hoverStyle = hasWhileHover && isHover ? { transform: 'translateY(-6px)' } : {};

  return (
    <div
      {...safeProps}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={{ ...(safeProps.style || {}), ...hoverStyle }}
    >
      {children}
    </div>
  );
}
