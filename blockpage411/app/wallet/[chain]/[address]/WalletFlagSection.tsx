
import React, { useState } from "react";
interface Flag {
  _id: string;
  user: string;
  reason: string;
  comment?: string;
  date?: string | number | Date;
  flaggedBy?: string;
  hidden?: boolean;
}

const FLAG_REASONS = [
  "Suspicious activity",
  "Phishing",
  "Scam",
  "Fake identity",
  "Money laundering",
  "Spam",
  "Impersonation",
  "Unsolicited contact",
  "Malware",
  "Other"
];

interface WalletFlagSectionProps {
  flags?: Array<Flag & { _id: string; flaggedBy?: string }>;
  onFlag: (reason: string, comment?: string) => void;
}

const WalletFlagSection: React.FC<WalletFlagSectionProps> = ({ flags, onFlag }) => {
  const [flagReason, setFlagReason] = useState("");
  const [flagComment, setFlagComment] = useState("");
  const [flagLoading, setFlagLoading] = useState(false);
  const [flagError, setFlagError] = useState<string|null>(null);
  const [flagSuccess, setFlagSuccess] = useState(false);

  const handleFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagReason) {
      setFlagError("Please select a reason for flagging.");
      return;
    }
    setFlagLoading(true);
    setFlagError(null);
    setFlagSuccess(false);
    try {
      await onFlag(flagReason, flagComment);
      setFlagSuccess(true);
      setFlagReason("");
      setFlagComment("");
    } catch (err) {
      if (err instanceof Error) {
        setFlagError(err.message);
      } else {
        setFlagError("Failed to flag wallet");
      }
    } finally {
      setFlagLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      <h3 className="text-yellow-300 font-semibold mb-2">Flag This Wallet</h3>
      <form className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2" onSubmit={handleFlag}>
        <select className="px-2 py-1 rounded border border-yellow-400 w-full md:w-64" value={flagReason} onChange={e => setFlagReason(e.target.value)} required>
          <option value="">Select reason</option>
          {FLAG_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <input type="text" className="px-2 py-1 rounded border border-blue-400 w-full md:w-64" placeholder="Additional comments (optional)" value={flagComment} onChange={e => setFlagComment(e.target.value)} />
        <button type="submit" className="px-3 py-1 rounded bg-red-700 text-white font-bold" disabled={flagLoading || !flagReason}>{flagLoading ? "Submitting..." : "Flag"}</button>
        {flagError && <span className="text-red-400 text-xs ml-2">{flagError}</span>}
        {flagSuccess && <span className="text-green-400 text-xs ml-2">Flag submitted!</span>}
      </form>
      {flags && flags.length > 0 && (
        <div className="mt-4">
          <h4 className="text-yellow-200 font-semibold mb-2">Existing Flags</h4>
          <ul className="space-y-2">
            {flags.map(flag => (
              <li key={flag._id} className="bg-yellow-900/40 border border-yellow-700 rounded p-3 flex flex-col gap-1">
                <span className="text-yellow-100 text-sm">Flag ID: <span className="font-mono">{flag._id}</span></span>
                {flag.reason && <span className="text-yellow-200 text-xs">Reason: {flag.reason}</span>}
                {flag.comment && flag.comment.length > 0 && !flag.hidden && <span className="text-blue-200 text-xs">Comment: {flag.comment}</span>}
                {flag.hidden && <span className="text-gray-400 text-xs italic">Comment hidden by admin</span>}
                {flag.date && <span className="text-yellow-200 text-xs">Date: {new Date(flag.date).toLocaleString()}</span>}
                {flag.flaggedBy && <span className="text-yellow-200 text-xs">Flagged By: {flag.flaggedBy}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WalletFlagSection;
