import React from 'react';

const GIVINGBLOCK_BASE_URL = process.env.NEXT_PUBLIC_GIVINGBLOCK_BASE_URL || process.env.GIVINGBLOCK_BASE_URL || '';

// Use implicit Any props to avoid conflicting with Next.js generated PageProps type
export default function GivingBlockEmbedPage(props: any) {
  const widgetId = props?.params?.widgetId as string | undefined;
  const charityIdParam = props?.searchParams?.charityId as string | string[] | undefined;
  const charityId = Array.isArray(charityIdParam) ? charityIdParam[0] : charityIdParam;

  if (!GIVINGBLOCK_BASE_URL || !widgetId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-6 py-4 max-w-md text-center">
          <h1 className="text-lg font-semibold mb-2">Donation widget unavailable</h1>
          <p className="text-sm text-slate-300">The donation widget configuration is incomplete. Please contact support.</p>
        </div>
      </div>
    );
  }

  const safeWidgetId = encodeURIComponent(widgetId);
  const query = new URLSearchParams();
  query.set('widgetId', safeWidgetId);
  if (charityId) {
    query.set('charityId', String(charityId));
  }

  const src = `${GIVINGBLOCK_BASE_URL.replace(/\/$/, '')}/widget?${query.toString()}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-3xl aspect-[4/3] bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <iframe
          src={src}
          title="Giving Block Donation Widget"
          className="w-full h-full border-0"
          allow="payment *; clipboard-write;"
        />
      </div>
    </div>
  );
}
