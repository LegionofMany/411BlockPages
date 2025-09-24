import React from 'react';

interface RatingBreakdownProps {
  ratings: { score: number }[];
}

const RatingBreakdown: React.FC<RatingBreakdownProps> = ({ ratings }) => {
  const counts = [1,2,3,4,5].map(star => ratings.filter(r => r.score === star).length);
  const total = ratings.length;
  return (
    <div className="flex flex-col gap-1 mt-2">
      {[5,4,3,2,1].map(star => (
        <div key={star} className="flex items-center gap-2">
          <span className="text-yellow-400">{star}★</span>
          <div className="flex-1 bg-blue-900 rounded h-2 mx-2">
            <div
              className="bg-yellow-400 h-2 rounded"
              style={{ width: total ? `${(counts[star-1]/total)*100}%` : '0%' }}
            />
          </div>
          <span className="text-cyan-200 text-xs">{counts[star-1]}</span>
        </div>
      ))}
    </div>
  );
};

export default RatingBreakdown;
