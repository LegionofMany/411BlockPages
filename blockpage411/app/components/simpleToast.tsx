"use client";
export function showToast(msg: string, duration = 3500) {
  if (typeof document === 'undefined') return;
  const containerId = 'bp411-toast-container';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    // Announce to assistive tech
    container.setAttribute('role', 'status');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.style.position = 'fixed';
    container.style.right = '20px';
    container.style.top = '20px';
  container.style.zIndex = '3000';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.background = 'rgba(17,24,39,0.9)';
  el.style.color = 'white';
  el.style.padding = '8px 12px';
  el.setAttribute('role', 'note');
  el.setAttribute('aria-live', 'polite');
  el.style.marginTop = '8px';
  el.style.borderRadius = '6px';
  el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
  el.style.opacity = '0';
  el.style.transition = 'opacity 200ms ease, transform 200ms ease';
  el.style.transform = 'translateY(-6px)';
  container.appendChild(el);
  requestAnimationFrame(()=>{
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
  setTimeout(()=>{
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(()=>{ el.remove(); if (container && container.childElementCount === 0) container.remove(); }, 220);
  }, duration);
}
