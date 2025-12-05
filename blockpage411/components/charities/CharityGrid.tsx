"use client";

import React from "react";
import CharityCard, { CharitySummary } from "./CharityCard";

interface Props {
  charities: CharitySummary[];
}

export default function CharityGrid({ charities }: Props) {
  if (!charities || charities.length === 0) {
    return (
      <div className="mt-8 text-center text-emerald-100/80">
        No charities found. Try adjusting your search.
      </div>
    );
  }

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {charities.map((c) => (
        <CharityCard key={String(c._id || c.givingBlockId || c.charityId || c.name)} charity={c} />
      ))}
    </div>
  );
}
