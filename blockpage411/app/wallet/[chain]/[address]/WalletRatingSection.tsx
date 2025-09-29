import React, { useState } from "react";
import StarRating from "../../../components/starrating2";
import RatingBreakdown from "../../../components/ratingbreakdown2";

interface WalletRatingSectionProps {
  address: string;
  chain: string;
  ratings: Array<{ score: number; text?: string; date: string }>;
  userRating?: number;
  verificationScore?: number;
  onRate: (score: number, text: string) => Promise<void>;
}

const WalletRatingSection: React.FC<WalletRatingSectionProps> = ({ address, chain, ratings, userRating, verificationScore, onRate }) => {
  const [rateValue, setRateValue] = useState<number | string>("");
  const [rateText, setRateText] = useState("");
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string|null>(null);
  const [rateSuccess, setRateSuccess] = useState(false);

  const handleRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateValue) return;
    setRateLoading(true);
    setRateError(null);
    setRateSuccess(false);
    try {
      await onRate(Number(rateValue), rateText);
      setRateSuccess(true);
      setRateText("");
    } catch (err) {
      if (err instanceof Error) {
        setRateError(err.message);
      } else {
        setRateError("Failed to rate wallet");
      }
    } finally {
      setRateLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full text-left">
      <h3 className="text-cyan-300 font-semibold mb-2">Rate This Wallet</h3>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-cyan-200">Average Rating:</span>
        <span className="font-bold text-yellow-400">{verificationScore ? verificationScore.toFixed(2) : "N/A"}</span>
        <span className="text-xs text-cyan-400">(out of 5)</span>
        <StarRating address={address} chain={chain} initialRating={Number(userRating || 0)} disabled={false} onRated={() => {}} />
      </div>
      {ratings && ratings.length > 0 && (
        <RatingBreakdown ratings={ratings} />
      )}
      <form className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2 mt-4" onSubmit={handleRate}>
        <div className="flex items-center gap-2">
          <label htmlFor="rateValue" className="text-cyan-200">Your Rating:</label>
          <select id="rateValue" className="px-2 py-1 rounded border border-yellow-400" value={rateValue} onChange={e => setRateValue(Number(e.target.value))} required>
            <option value="">Select</option>
            {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <textarea className="px-2 py-1 rounded border border-blue-400 w-full md:w-64" placeholder="Leave a comment (optional)" value={rateText} onChange={e => setRateText(e.target.value)} rows={2} />
        <button type="submit" className="px-3 py-1 rounded bg-yellow-500 text-white font-bold" disabled={rateLoading || !rateValue}>{rateLoading ? "Submitting..." : "Rate"}</button>
        {rateError && <span className="text-red-400 text-xs ml-2">{rateError}</span>}
        {rateSuccess && <span className="text-green-400 text-xs ml-2">Thank you for rating!</span>}
      </form>
      <div className="mt-4">
        <h4 className="text-cyan-200 font-semibold mb-2">Recent Ratings</h4>
        <ul className="space-y-2">
          {ratings && ratings.length > 0 ? (
            ratings.slice(-5).reverse().map((r, i) => (
              <li key={i} className="bg-gray-900 border border-yellow-700 rounded-lg p-2">
                <span className="font-bold text-yellow-400">{r.score} / 5</span>
                {r.text && <span className="ml-2 text-cyan-100">{r.text}</span>}
                <span className="ml-2 text-xs text-cyan-400">{new Date(r.date).toLocaleString()}</span>
              </li>
            ))
          ) : (
            <li className="text-cyan-400">No ratings yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default WalletRatingSection;
