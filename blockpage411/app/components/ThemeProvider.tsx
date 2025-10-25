"use client";
import React, { useEffect } from 'react';
import theme from '../../styles/theme';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply tokens to document root so CSS variables are available
    const root = document.documentElement;
    Object.entries(theme.tokens).forEach(([k, v]) => root.style.setProperty(k, String(v)));
  }, []);

  return <>{children}</>;
}
