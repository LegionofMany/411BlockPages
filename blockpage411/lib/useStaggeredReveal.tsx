"use client";
import { useEffect, useRef } from 'react';

export function useStaggeredReveal(selector = '.reveal', rootMargin = '0px 0px -10% 0px') {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!els.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          const delay = parseFloat(el.dataset['revealDelay'] || el.dataset['delay'] || '0') || 0;
          const dur = parseInt(el.dataset['duration'] || '420', 10) || 420;
          el.style.transition = `opacity ${dur}ms cubic-bezier(.2,.9,.2,1) ${delay}ms, transform ${dur}ms cubic-bezier(.2,.9,.2,1) ${delay}ms`;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          observer.unobserve(el);
        }
      });
    }, { root: null, rootMargin });

    els.forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
      if (!el.dataset['revealDelay'] && !el.dataset['delay']) el.dataset['revealDelay'] = String(i * 70);
      if (!el.dataset['duration']) el.dataset['duration'] = '420';
      observer.observe(el);
    });

    observerRef.current = observer;
    return () => { observer.disconnect(); };
  }, [selector, rootMargin]);
}
