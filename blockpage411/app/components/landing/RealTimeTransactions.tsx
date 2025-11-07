"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiZap, FiLoader } from "react-icons/fi";
import { ethers } from "ethers";
import { Connection, LogsCallback } from "@solana/web3.js";

type Tx = {
  hash: string;
  from: string | null;
  to: string | null;
  value: string;
};

const NETWORKS: Record<string, { name: string; type?: "evm" | "solana" | "bitcoin"; wss?: string; rpc?: string; symbol: string; explorer?: string }> = {
  ethereum: {
    name: "Ethereum Mainnet",
    type: "evm",
    wss: `wss://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
    // HTTP RPC fallback (uses Alchemy HTTP so the same key works)
    rpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
    symbol: "ETH",
    explorer: "https://etherscan.io/tx/",
  },
  polygon: {
    name: "Polygon",
    type: "evm",
    wss: `wss://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
    rpc: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`,
    symbol: "MATIC",
    explorer: "https://polygonscan.com/tx/",
  },
  bnb: {
    name: "BNB Smart Chain",
    type: "evm",
    // Public community wss endpoints can be unreliable; consider QuickNode for production
    wss: "wss://bsc-ws-node.nariox.org:443",
    // public HTTP RPC fallback — accessible client-side without API key
    rpc: "https://bsc-dataseed.binance.org",
    symbol: "BNB",
    explorer: "https://bscscan.com/tx/",
  },
  solana: {
    name: "Solana Mainnet",
    type: "solana",
    // Prefer explicit QuickNode/Helius RPC URL if provided, fallback to Helius key
    rpc: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_KEY}`,
    symbol: "SOL",
    explorer: "https://explorer.solana.com/tx/",
  },
  bitcoin: {
    name: "Bitcoin Mainnet",
    type: "bitcoin",
    // Use mempool.space WebSocket (open, stable)
    wss: "wss://mempool.space/api/v1/ws",
    symbol: "BTC",
    explorer: "https://blockstream.info/tx/",
  },
};

export default function RealTimeTransactions() {
  const [network, setNetwork] = useState<string>("ethereum");
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  // ethers v6 exports provider classes at the top-level (no `providers` namespace)
  let provider: ethers.WebSocketProvider | undefined;
  // holder for cleanup hooks when provider is not available (solana/bitcoin/polling)
  const cleanupHolder: any = {};
    let active = true;

    async function subscribe() {
      setLoading(true);
      setTransactions([]);

      const net = NETWORKS[network];
      if (!net) {
        setLoading(false);
        return;
      }

      let pollingInterval: ReturnType<typeof setInterval> | undefined;
      let jsonProvider: ethers.JsonRpcProvider | undefined;

      try {
        // Branch by network type: EVM networks use ethers WebSocketProvider, Solana uses Connection, Bitcoin uses raw WebSocket
        if (net.type === "solana") {
          if (!net.rpc) {
            console.error("solana rpc missing");
            setLoading(false);
            return;
          }

          const connection = new Connection(net.rpc, "confirmed");
          // Subscribe to all logs; this is broad — consider narrowing with programId filters
          let subId: number | undefined;
          try {
            subId = connection.onLogs("all", (log) => {
              if (!active) return;
              try {
                // log.signature is the tx signature
                setTransactions((prev) => [
                  {
                    hash: (log as any).signature || "unknown",
                    from: "Unknown",
                    to: "Unknown",
                    value: net.symbol,
                  },
                  ...prev,
                ].slice(0, 25));
                setLoading(false);
              } catch (e) {
                console.error("solana log handler error", e);
              }
            });
          } catch (e) {
            console.error("solana subscribe error", e);
          }

          // attach cleanup handler to the central holder so outer return can clean it
          cleanupHolder._solanaCleanup = () => {
            try { if (subId) connection.removeOnLogsListener(subId); } catch {}
          };
          setLoading(false);
          return;
        }

        if (net.type === "bitcoin") {
          if (!net.wss) {
            console.error("bitcoin wss missing");
            setLoading(false);
            return;
          }

          let ws: WebSocket | undefined;
          try {
            ws = new WebSocket(net.wss);
          } catch (e) {
            console.error("bitcoin ws connect error", e);
            setLoading(false);
            return;
          }

          ws.onopen = () => {
            // Some bitcoin WS feeds require a subscription message; many will push unprompted
            setLoading(false);
          };

          ws.onmessage = (ev) => {
            if (!active) return;
            try {
              const data = JSON.parse((ev as MessageEvent).data as string);
              // handle several possible shapes
              const txid = data.txid || data.x?.hash || data.data?.txid || data?.tx?.hash;
              if (txid) {
                setTransactions((prev) => [
                  { hash: txid, from: "N/A", to: "N/A", value: net.symbol },
                  ...prev,
                ].slice(0, 25));
              }
            } catch (e) {
              // non-json messages or unexpected shape
            }
          };

          // store ws on cleanupHolder for outer cleanup
          cleanupHolder._bitcoinWs = ws;
          return;
        }

        // Default: EVM
        const p = new ethers.WebSocketProvider(net.wss as string);
        provider = p;

        // If the websocket connection errors or closes, fall back to polling the HTTP RPC
        const startPolling = () => {
          if (!net.rpc) return;
          try {
            jsonProvider = new ethers.JsonRpcProvider(net.rpc);
          } catch (e) {
            console.error("json provider error", e);
            return;
          }

          let last = -1;
          pollingInterval = setInterval(async () => {
            if (!active || !jsonProvider) return;
            try {
              const bn = await jsonProvider.getBlockNumber();
              if (bn === last) return;
              last = bn;
              const block = await (jsonProvider as any).getBlockWithTransactions(bn as any);
              const txs = (block?.transactions || []).slice(0, 5);
              setTransactions((prev) => [
                ...txs.map((tx: any) => {
                  const raw = tx.value ?? 0;
                  let valueFormatted = "0";
                  try {
                    valueFormatted = `${ethers.formatEther(typeof raw === "string" ? BigInt(raw) : raw)} ${net.symbol}`;
                  } catch (e) {
                    valueFormatted = `0 ${net.symbol}`;
                  }
                  return {
                    hash: tx.hash,
                    from: tx.from ?? null,
                    to: tx.to ?? null,
                    value: valueFormatted,
                  };
                }),
                ...prev,
              ].slice(0, 25));
              setLoading(false);
            } catch (err) {
              console.error("polling error", err);
            }
          }, 5000);
        };

        // If the provided WSS is missing or immediately fails, the browser console will
        // log websocket errors; we also attach handlers to switch to polling.
        try {
          (p as any)._websocket?.addEventListener?.('error', () => {
            console.warn('websocket error, switching to RPC polling');
            startPolling();
          });
          (p as any)._websocket?.addEventListener?.('close', () => {
            console.warn('websocket closed, switching to RPC polling');
            startPolling();
          });
        } catch (e) {
          // ignore attach errors
        }

        p.on("block", async (blockNumber: number) => {
          if (!active) return;
          try {
            let block: any;
            if (typeof (p as any).getBlockWithTransactions === "function") {
              block = await (p as any).getBlockWithTransactions(blockNumber as any);
            } else {
              const hex = "0x" + Number(blockNumber).toString(16);
              try {
                block = await p.send("eth_getBlockByNumber", [hex, true]);
              } catch (rpcErr) {
                console.error("rpc fallback error", rpcErr);
                // If the websocket can't fetch the block body, switch to polling
                startPolling();
                return;
              }
            }

            const txs = (block?.transactions || []).slice(0, 5);

            setTransactions((prev) => [
              ...txs.map((tx: any) => {
                const raw = tx.value ?? 0;
                let valueFormatted = "0";
                try {
                  valueFormatted = `${ethers.formatEther(typeof raw === "string" ? BigInt(raw) : raw)} ${net.symbol}`;
                } catch (e) {
                  valueFormatted = `0 ${net.symbol}`;
                }

                return {
                  hash: tx.hash,
                  from: tx.from ?? null,
                  to: tx.to ?? null,
                  value: valueFormatted,
                };
              }),
              ...prev,
            ].slice(0, 25));
            setLoading(false);
          } catch (err) {
            console.error("block fetch error", err);
          }
        });
      } catch (err) {
        console.error("ws connect error", err);
        // If we couldn't connect to the websocket at all, start RPC polling if available
        if (net.rpc) {
          try {
            const json = new ethers.JsonRpcProvider(net.rpc);
            jsonProvider = json;
            let last = -1;
            pollingInterval = setInterval(async () => {
              if (!active || !jsonProvider) return;
              try {
                const bn = await jsonProvider.getBlockNumber();
                if (bn === last) return;
                last = bn;
                const block = await (jsonProvider as any).getBlockWithTransactions(bn as any);
                const txs = (block?.transactions || []).slice(0, 5);
                setTransactions((prev) => [
                  ...txs.map((tx: any) => {
                    const raw = tx.value ?? 0;
                    let valueFormatted = "0";
                    try {
                      valueFormatted = `${ethers.formatEther(typeof raw === "string" ? BigInt(raw) : raw)} ${net.symbol}`;
                    } catch (e) {
                      valueFormatted = `0 ${net.symbol}`;
                    }
                    return {
                      hash: tx.hash,
                      from: tx.from ?? null,
                      to: tx.to ?? null,
                      value: valueFormatted,
                    };
                  }),
                  ...prev,
                ].slice(0, 25));
                setLoading(false);
              } catch (err) {
                console.error("polling error", err);
              }
            }, 5000);
          } catch (e) {
            console.error("polling setup error", e);
          }
        }
      }

      // cleanup for polling interval and jsonProvider
      const cleanup = () => {
        if (pollingInterval) clearInterval(pollingInterval);
        try { jsonProvider = undefined; } catch {}
      };

      // ensure cleanup when effect is torn down
      // append to the existing return by wrapping subscribe usage; the outer return
      // will still destroy provider. We also call cleanup when unmounting.
      // store cleanup on cleanupHolder for access in the outer return.
      cleanupHolder._pollingCleanup = cleanup;
    }

    subscribe();

    return () => {
      active = false;
      try {
        // destroy ethers provider when present
        provider?.destroy?.();
      } catch (e) {
        try { (provider as any)?._websocket?.close?.(); } catch {}
      }

      // run any polling cleanup attached earlier
      try { cleanupHolder._pollingCleanup?.(); } catch {}

      // solana cleanup
      try { cleanupHolder._solanaCleanup?.(); } catch {}

      // bitcoin ws cleanup
      try { cleanupHolder._bitcoinWs?.close?.(); } catch {}
    };
  }, [network]);

  const current = NETWORKS[network];

  return (
    <section className="w-full max-w-3xl mx-auto p-6 bg-gray-900 text-white rounded-2xl shadow-xl border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">🔴 Live Blockchain Transactions</h2>
        <select value={network} onChange={(e) => setNetwork(e.target.value)} className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600">
          {Object.entries(NETWORKS).map(([key, net]) => (
            <option key={key} value={key}>{net.name}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-400">Connecting to {current.name}...</p>}

      <ul className="space-y-3 mt-3">
        {transactions.map((tx) => (
          <li key={tx.hash} className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <p className="text-xs font-mono truncate">{tx.hash}</p>
            <div className="flex gap-2 items-center text-sm mt-1">
              <span className="text-gray-300">From:</span> <span className="truncate">{tx.from ?? '—'}</span>
              <FiArrowRight />
              <span className="text-gray-300">To:</span> <span className="truncate">{tx.to ?? '—'}</span>
            </div>
            <div className="mt-2 text-sm text-green-300 font-semibold">{tx.value}</div>
            <a href={`${current.explorer}${tx.hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline text-sm">View on Explorer</a>
          </li>
        ))}
      </ul>

      {transactions.length === 0 && !loading && <p className="text-gray-400 mt-4">Waiting for transactions...</p>}
    </section>
  );
}
