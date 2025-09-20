export interface Flag {
  reason: string;
  user: string;
  date: string;
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
}
