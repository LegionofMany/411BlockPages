"use client";
import React, { useEffect } from 'react';

export default function Toast({ message, onClose }: { message: string; onClose?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed right-4 bottom-6 z-50 bg-slate-900 text-white px-4 py-2 rounded shadow-lg">
      {message}
    </div>
  );
}
