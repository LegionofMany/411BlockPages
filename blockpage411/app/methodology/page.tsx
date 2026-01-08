import React from 'react';

export default function Methodology() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">Methodology</h1>
      <p className="mt-4">We compute a deterministic risk score using public flags and on-chain behaviour signals. Scores are not legal determinations.</p>
      <h2 className="mt-4 font-semibold">Scoring</h2>
      <ul className="list-disc pl-6 text-sm">
        <li>OFAC sanctions add significant weight.</li>
        <li>Verified scam/phishing labels add moderate weight.</li>
        <li>Community reports add minor weight.</li>
        <li>Behavioral heuristics add additional exposure signals.</li>
      </ul>
    </div>
  );
}
