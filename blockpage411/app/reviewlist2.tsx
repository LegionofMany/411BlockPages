import React from 'react';

export interface Review {
  user: string;
  score: number;
  text: string;
  date: string;
}

interface ReviewListProps {
  reviews: Review[];
}

const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (!reviews.length) return <div className="text-cyan-400">No reviews yet.</div>;
  return (
    <ul className="flex flex-col gap-4 mt-2">
      {reviews.map((r, i) => (
        <li key={i} className="bg-blue-950 border border-blue-800 rounded-lg p-3 shadow">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-400 text-lg">{'★'.repeat(r.score)}{'☆'.repeat(5 - r.score)}</span>
            <span className="text-cyan-200 font-mono text-xs">{r.user.slice(0, 8)}...{r.user.slice(-4)}</span>
            <span className="text-blue-300 text-xs ml-auto">{new Date(r.date).toLocaleString()}</span>
          </div>
          <div className="text-cyan-100 text-sm">{r.text}</div>
        </li>
      ))}
    </ul>
  );
};

export default ReviewList;
