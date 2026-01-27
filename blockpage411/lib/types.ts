// Blockpage411 v3: User profile and donation types
export interface DonationRequest {
  platform: string; // e.g. 'Gitcoin', 'OpenCollective', etc.
  url: string;
  description?: string;
  active: boolean;
  expiresAt?: string | number;
  // Optional extras used by the richer donation UI
  goal?: number;
  raised?: number;
  recentDonors?: Array<{ name?: string; amount?: string }>; 
}

export interface Fundraiser {
  id: string;
  title: string;
  description?: string;
  target: number;
  raised?: number;
  walletAddress: string;
  owner: string; // owner address
  createdAt: string | number | Date;
  expiresAt?: string | number | Date;
  active?: boolean;
  privacy?: 'public' | 'circle';
  circle?: string[]; // list of addresses or emails included in circle
}

export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

export interface UserProfile {
  address: string;
  displayName?: string;
  avatarUrl?: string;
  udDomain?: string;
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
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    telegram?: string;
    whatsapp?: string;
    discord?: string;
    verified?: Record<string, boolean>;
    trustScore?: number;
  };
  featuredCharityId?: string;
  activeEventId?: string;
  donationLink?: string;
  donationWidgetEmbed?: {
    widgetId?: string;
    charityId?: string;
  };
  nftAvatarUrl?: string;
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

  // Optional enrichment fields (best-effort, may be omitted)
  fromLabel?: string;
  toLabel?: string;
  counterparty?: string;
  counterpartyLabel?: string;
  counterpartyType?: 'CEX' | 'DEX' | 'Wallet' | 'Other' | 'Provider' | 'Exchange';
}
