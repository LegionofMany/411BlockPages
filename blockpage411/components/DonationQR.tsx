"use client";
import React, { useState } from 'react';
import Image from 'next/image';

export default function DonationQR({ address }: { address: string }) {
  const [failed, setFailed] = useState(false);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(address)}`;
  const placeholder = '/icons/charity-placeholder.svg';
  const blurDataURL = 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="100%" height="100%" fill="#0b1220"/></svg>').toString('base64');

  return (
    <div className="flex items-center gap-3">
      {!failed ? (
        <Image
          src={qrUrl}
          alt={`QR for ${address}`}
          width={120}
          height={120}
          onError={() => setFailed(true)}
          placeholder="blur"
          blurDataURL={blurDataURL}
          unoptimized
        />
      ) : (
        <Image src={placeholder} alt="QR placeholder" width={120} height={120} />
      )}
      <div className="text-sm font-mono break-words">{address}</div>
    </div>
  );
}
