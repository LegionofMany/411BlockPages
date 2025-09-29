import React from "react";
import type { Flag } from "../../../../lib/types";

interface FlagSectionProps {
  flags?: Array<Flag & { _id: string; flaggedBy?: string }>;
  onDismiss: (flagId: string) => void;
}

const FlagSection: React.FC<FlagSectionProps> = ({ flags, onDismiss }) => {
  if (!flags || flags.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="text-base font-semibold text-yellow-200 mb-2">Flags</h3>
      <ul className="space-y-2">
        {flags.map(flag => (
          <li key={flag._id} className="bg-yellow-900/40 border border-yellow-700 rounded p-3 flex flex-col gap-1">
            <span className="text-yellow-100 text-sm">Flag ID: <span className="font-mono">{flag._id}</span></span>
            {flag.reason && <span className="text-yellow-200 text-xs">Reason: {flag.reason}</span>}
            {flag.date && <span className="text-yellow-200 text-xs">Date: {new Date(flag.date).toLocaleString()}</span>}
            {flag.flaggedBy && <span className="text-yellow-200 text-xs">Flagged By: {flag.flaggedBy}</span>}
            <button
              className="mt-2 px-3 py-1 rounded bg-yellow-700 text-white font-bold text-xs self-start"
              onClick={() => onDismiss(flag._id)}
            >
              Dismiss Flag
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FlagSection;
