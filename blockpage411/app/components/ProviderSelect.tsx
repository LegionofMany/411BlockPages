"use client";
import React, { useEffect, useRef, useState } from 'react';
import Portal from './Portal';

type Provider = {
  _id?: string;
  name: string;
  aliases?: string[];
  website?: string;
  rank?: number;
  reportsCount?: number;
};

export default function ProviderSelect({ value: _value, onChange }:{ value?: Provider | null; onChange: (p: Provider | null) => void }){
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);
  const [rect, setRect] = useState<{left:number; top:number; width:number; bottom:number} | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{
    // if a value is provided (selected provider), show its name in the input
    if (_value && _value.name) setQ(_value.name);
    let canceled = false;
    async function fetchList(){
      setLoading(true);
      try{
        const url = q ? `/api/providers?q=${encodeURIComponent(q)}` : '/api/providers';
        const r = await fetch(url);
        const json = await r.json();
        if (!canceled) setOpts(json || []);
      }catch(err){
        console.error(err);
      }finally{ setLoading(false); }
    }
    const t = setTimeout(fetchList, 200);
    return ()=>{ canceled = true; clearTimeout(t); };
  }, [q, _value]);

  useEffect(()=>{
    function updateRect(){
      try{
        const el = inputRef.current;
        if (!el) { setRect(null); return; }
        const r = el.getBoundingClientRect();
        setRect({ left: r.left, top: r.top, width: r.width, bottom: r.bottom });
      }catch(e){ setRect(null); }
    }
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return ()=>{ window.removeEventListener('resize', updateRect); window.removeEventListener('scroll', updateRect, true); };
  }, []);

  // close dropdown when clicking outside input or dropdown (so buttons on the page remain clickable)
  useEffect(()=>{
    function onDocMouseDown(e: MouseEvent){
      try{
        const target = e.target as Node | null;
        if (!target) return;
        if (inputRef.current && inputRef.current.contains(target)) return;
        if (dropdownRef.current && dropdownRef.current.contains(target)) return;
        // clicked outside -> close
        setFocused(false);
      }catch(e){ /* ignore */ }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return ()=> document.removeEventListener('mousedown', onDocMouseDown);
  }, []);

  // listen for global close event so external buttons can force-close the dropdown
  useEffect(()=>{
    function onCloseEvent(){ setFocused(false); }
    document.addEventListener('close-dropdowns', onCloseEvent as EventListener);
    return ()=> document.removeEventListener('close-dropdowns', onCloseEvent as EventListener);
  }, []);

  return (
    <div className="w-full relative">
      <input
        ref={inputRef}
        aria-label="Search provider"
        className="input"
        placeholder="Search provider"
        value={q}
        onChange={(e)=>setQ(e.target.value)}
        onFocus={()=>setFocused(true)}
        onBlur={()=>{ /* keep dropdown visible briefly to allow click selection; rely on portal click */ setTimeout(()=>setFocused(false), 150); }}
      />

      {/* render dropdown in a body-level portal so it can't be overlapped by footer */}
      { (focused || opts.length > 0 || loading) && rect && (
        <Portal>
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', left: rect.left, top: rect.bottom + 6, width: rect.width, zIndex: 1200, pointerEvents: 'auto' }}
            className="max-h-48 overflow-auto bg-white shadow rounded border border-gray-200"
          >
            {loading && <div className="p-2 text-sm text-gray-500">Loading…</div>}
            {!loading && opts.length === 0 && <div className="p-2 text-sm">No providers found — you can add a new one.</div>}
            {opts.map((p)=> (
              <button key={p._id || p.name} onMouseDown={(e)=>{ e.preventDefault(); onChange(p); }} className="w-full text-left p-2 hover:bg-gray-50">
                <div className="font-medium truncate">
                  {p.name} {p.rank ? <span className="text-xs text-gray-400">#{p.rank}</span> : null}
                  {p.reportsCount && p.reportsCount >= 10 ? <span title="Many reports" className="ml-2 text-yellow-600">⚠️</span> : null}
                </div>
                <div className="text-xs text-gray-500 truncate">{p.website || (p.aliases && p.aliases.join(', '))}</div>
              </button>
            ))}
            <div className="p-2 border-t">
              <button onMouseDown={(e)=>{ e.preventDefault(); onChange({ name: q || 'Other', aliases: [], website: '' }); }} className="text-sm text-blue-600">Add new provider: “{q || 'Other'}”</button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
