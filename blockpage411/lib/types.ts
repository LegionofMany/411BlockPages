// Blockpage411 v3: User profile and donation types
export interface DonationRequest {
  platform: string; // e.g. 'Gitcoin', 'OpenCollective', etc.
  url: string;
  description?: string;
  active: boolean;
  expiresAt?: string | number;
}

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  address: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  telegram?: string;
  twitter?: string;
  discord?: string;
  website?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  phoneApps?: string[];
  kycStatus?: KycStatus;
  kycRequestedAt?: string;
  kycVerifiedAt?: string;
  donationRequests?: DonationRequest[];
  verificationScore?: number;
  createdAt?: string;
  updatedAt?: string;
}
export interface Flag {
  _id: string;
  reason: string;
  user: string;
  date: string;
  flaggedBy?: string;
}

export interface Vout {
  scriptpubkey_address: string;
  value: number;
}

export interface Transaction {
  txid?: string;
  status?: {
    block_height: number;
  };
  vout?: Vout[];
  hash?: string;
  from?: string;
  to?: string;
  value?: string;
  date?: string | number;
}
