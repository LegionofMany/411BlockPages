import React, { useState } from 'react';
import axios from 'axios';

interface StarRatingProps {
  address: string;
  chain: string;
  initialRating: number;
  disabled?: boolean;
  onRated?: (score: number, text?: string) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ address, chain, initialRating, disabled, onRated }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number>(initialRating);

  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (score: number) => {
    if (disabled || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await axios.post('/api/ratings', { address, chain, score, text: reviewText });
      setSelected(score);
      setSuccess(true);
      if (onRated) onRated(score, reviewText);
    } catch (e: unknown) {
      if (
        e &&
        typeof e === 'object' &&
        'response' in e &&
        e.response &&
        typeof e.response === 'object' &&
        'data' in e.response &&
        e.response.data &&
        typeof e.response.data === 'object' &&
        'message' in e.response.data &&
        typeof (e.response as { data: { message?: string } }).data.message === 'string'
      ) {
        setError((e.response as { data: { message?: string } }).data.message || 'Error submitting rating');
      } else {
        setError('Error submitting rating');
      }
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-row gap-1">
        {[1,2,3,4,5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-3xl transition-all duration-150 ${
              (hovered ?? selected) >= star ? 'text-yellow-400' : 'text-blue-900'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-125'}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => setSelected(star)}
            disabled={disabled || submitting}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
      {!disabled && (
        <form
          className="flex flex-col items-center gap-2 mt-1 w-full"
          onSubmit={e => {
            e.preventDefault();
            handleSubmit(selected);
          }}
        >
          <textarea
            className="w-full min-w-[200px] max-w-[320px] px-2 py-1 rounded border border-blue-700 bg-blue-950 text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={2}
            maxLength={300}
            placeholder="Write a review (optional, max 300 chars)"
            value={reviewText}
            onChange={e => setReviewText(e.target.value)}
            disabled={submitting}
          />
          <button
            type="submit"
            className="px-4 py-1 rounded bg-yellow-500 text-darkbg font-bold shadow hover:bg-yellow-400 disabled:opacity-60"
            disabled={submitting || !selected}
          >Submit</button>
        </form>
      )}
      {error && <span className="text-red-400 text-xs mt-1">{error}</span>}
      {success && <span className="text-green-400 text-xs mt-1">Thank you for rating!</span>}
    </div>
  );
};

export default StarRating;
