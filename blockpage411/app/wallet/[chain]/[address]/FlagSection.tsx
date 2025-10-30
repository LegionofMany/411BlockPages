import React from "react";
import type { Flag } from "../../../../lib/types";

interface FlagSectionProps {
  flags?: Array<Flag & { _id: string; flaggedBy?: string }>;
  onDismiss: (flagId: string) => void;
}

const FlagSection: React.FC<FlagSectionProps> = ({ flags, onDismiss }) => {
  if (!flags || flags.length === 0) return null;
  return (
    <div className="mt-6">
      <h3 className="text-amber-200 font-semibold mb-4">Flags</h3>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flags.map(flag => (
          <li key={flag._id} className="rounded-2xl p-4" style={{ background: 'linear-gradient(180deg, rgba(255,245,220,0.02), rgba(6,8,15,0.5))', border: '1px solid rgba(29,78,216,0.12)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-amber-100">{flag._id}</span>
                  {flag.reason && <span className="text-xs px-2 py-0.5 rounded-full text-amber-800 bg-amber-200/8">{flag.reason}</span>}
                </div>
                {flag.date && <div className="text-xs text-amber-200 mt-2">{new Date(flag.date).toLocaleString()}</div>}
                {flag.flaggedBy && <div className="text-xs text-amber-200">Flagged By: {flag.flaggedBy}</div>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <button className="px-3 py-1 rounded-md bg-red-700/80 text-white hover:bg-red-700" onClick={() => onDismiss(flag._id)}>Dismiss</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FlagSection;
