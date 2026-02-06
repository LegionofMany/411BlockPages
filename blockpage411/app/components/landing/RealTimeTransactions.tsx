"use client";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Connection, Logs } from "@solana/web3.js";

type Tx = {
  hash: string;
  from: string | null;
  to: string | null;
  value: string;
  id?: string;
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

type EvmTx = {
  hash: string;
  from: string | null;
  to: string | null;
  value: bigint | string;
};

export default function RealTimeTransactions() {
  const genId = () => {
    try {
      // prefer crypto.randomUUID when available
      // @ts-ignore
      if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') return (crypto as any).randomUUID();
    } catch {}
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  };
  const [network, setNetwork] = useState<string>("ethereum");
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
  // ethers v6 exports provider classes at the top-level (no `providers` namespace)
  let provider: ethers.WebSocketProvider | undefined;
  // holder for cleanup hooks when provider is not available (solana/bitcoin/polling)
  const cleanupHolder: {
    _solanaCleanup?: () => void;
    _bitcoinWs?: WebSocket;
    _pollingCleanup?: () => void;
  } = {};
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
            subId = connection.onLogs("all", (log: Logs) => {
              if (!active) return;
              try {
                // log.signature is the tx signature
                setTransactions((prev) => [
                  {
                    id: genId(),
                    hash: log.signature || "unknown",
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
          } catch (error) {
            console.error("solana subscribe error", error);
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
          } catch (error) {
            console.error("bitcoin ws connect error", error);
            setLoading(false);
            return;
          }

          ws.onopen = () => {
            // mempool.space WebSocket requires a subscription message.
            // Use the low-bandwidth mempool txid feed for a simple "live transactions" list.
            try {
              ws?.send(JSON.stringify({ "track-mempool-txids": true }));
            } catch {
              // ignore
            }
            setLoading(false);
          };

          ws.onmessage = (ev: MessageEvent) => {
            if (!active) return;
            try {
              const data = JSON.parse(ev.data as string) as any;

              // Primary shape (mempool.space docs):
              // { "mempool-txids": { sequence, added: [txid...], removed, mined, replaced } }
              const added: string[] | undefined = data?.['mempool-txids']?.added;
              if (Array.isArray(added) && added.length) {
                setTransactions((prev) => {
                  const next = [
                    ...added.map((txid) => ({ id: genId(), hash: String(txid), from: 'N/A', to: 'N/A', value: net.symbol })),
                    ...prev,
                  ];
                  return next.slice(0, 25);
                });
                return;
              }

              // Fallback shapes for other WS payloads.
              const txid = data?.txid || data?.x?.hash || data?.data?.txid || data?.tx?.hash;
              if (txid) {
                setTransactions((prev) => [
                  { id: genId(), hash: String(txid), from: 'N/A', to: 'N/A', value: net.symbol },
                  ...prev,
                ].slice(0, 25));
              }
            } catch {
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
            const chainId = typeof (net as any).chainId === 'number' ? (net as any).chainId : undefined;
            const name = String(net.name || '').toLowerCase();
            jsonProvider = chainId ? new ethers.JsonRpcProvider(net.rpc, { chainId, name: name || 'unknown' }) : new ethers.JsonRpcProvider(net.rpc);
          } catch (error) {
            console.error("json provider error", error);
            return;
          }

          let last = -1;
          pollingInterval = setInterval(async () => {
            if (!active || !jsonProvider) return;
            try {
              const bn = await jsonProvider.getBlockNumber();
              if (bn === last) return;
              last = bn;
              const block = await jsonProvider.getBlock(bn);
              const txs: EvmTx[] = (block?.transactions || []).slice(0, 5) as unknown as EvmTx[];
              setTransactions((prev) => [
                ...txs.map((tx) => {
                  const raw = tx.value ?? BigInt(0);
                  let valueFormatted = "0";
                  const asBigInt = typeof raw === "string" ? BigInt(raw) : (raw as bigint);
                  valueFormatted = `${ethers.formatEther(asBigInt)} ${net.symbol}`;
                  return {
                    id: genId(),
                    hash: tx.hash,
                    from: tx.from ?? null,
                    to: tx.to ?? null,
                    value: valueFormatted,
                  };
                }),
                ...prev,
              ].slice(0, 25));
              setLoading(false);
            } catch (error: unknown) {
              console.error("polling error", error);
            }
          }, 5000);
        };

        // If the provided WSS is missing or immediately fails, the browser console will
        // log websocket errors; we also attach handlers to switch to polling.
        try {
          (p as { _websocket?: WebSocket })._websocket?.addEventListener?.('error', () => {
            console.warn('websocket error, switching to RPC polling');
            startPolling();
          });
          (p as { _websocket?: WebSocket })._websocket?.addEventListener?.('close', () => {
            console.warn('websocket closed, switching to RPC polling');
            startPolling();
          });
        } catch {
          // ignore attach errors
        }

        p.on("block", async (blockNumber: number) => {
          if (!active) return;
          try {
            const block = await p.getBlock(blockNumber);
            const txs: EvmTx[] = (block?.transactions || []).slice(0, 5) as unknown as EvmTx[];

            setTransactions((prev) => [
              ...txs.map((tx) => {
                const raw = tx.value ?? BigInt(0);
                let valueFormatted = "0";
                const asBigInt = typeof raw === "string" ? BigInt(raw) : (raw as bigint);
                valueFormatted = `${ethers.formatEther(asBigInt)} ${net.symbol}`;

                return {
                  id: genId(),
                  hash: tx.hash,
                  from: tx.from ?? null,
                  to: tx.to ?? null,
                  value: valueFormatted,
                };
              }),
              ...prev,
            ].slice(0, 25));
            setLoading(false);
          } catch (error) {
            console.error("block fetch error", error);
          }
        });
      } catch (error: unknown) {
        console.error("ws connect error", error);
        // If we couldn't connect to the websocket at all, start RPC polling if available
        if (net.rpc) {
          try {
            const chainId = typeof (net as any).chainId === 'number' ? (net as any).chainId : undefined;
            const name = String(net.name || '').toLowerCase();
            const json = chainId ? new ethers.JsonRpcProvider(net.rpc, { chainId, name: name || 'unknown' }) : new ethers.JsonRpcProvider(net.rpc);
            jsonProvider = json;
            let last = -1;
            pollingInterval = setInterval(async () => {
              if (!active || !jsonProvider) return;
              try {
                const bn = await jsonProvider.getBlockNumber();
                if (bn === last) return;
                last = bn;
                const block = await jsonProvider.getBlock(bn);
                const txs: EvmTx[] = (block?.transactions || []).slice(0, 5) as unknown as EvmTx[];
                setTransactions((prev) => [
                  ...txs.map((tx) => {
                    const raw = tx.value ?? BigInt(0);
                    let valueFormatted = "0";
                    const asBigInt = typeof raw === "string" ? BigInt(raw) : (raw as bigint);
                    valueFormatted = `${ethers.formatEther(asBigInt)} ${net.symbol}`;
                    return {
                      id: genId(),
                      hash: tx.hash,
                      from: tx.from ?? null,
                      to: tx.to ?? null,
                      value: valueFormatted,
                    };
                  }),
                  ...prev,
                ].slice(0, 25));
                setLoading(false);
              } catch (error: unknown) {
                console.error("polling error", error);
              }
            }, 5000);
          } catch (error) {
            console.error("polling setup error", error);
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
      } catch {
        try { (provider as { _websocket?: WebSocket })?._websocket?.close?.(); } catch {}
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
    <section className="w-full px-0 mt-4 md:mt-6">
      <div
        className="relative overflow-hidden rounded-2xl px-4 sm:px-6 py-5 sm:py-6"
        style={{
          backgroundColor: "rgba(0,0,0,0.86)",
          boxShadow: "0 22px 64px rgba(0,0,0,0.95)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          border: "none",
        }}
      >
        <div className="absolute inset-x-0 -top-32 h-40 bg-gradient-to-br from-sky-500/20 via-violet-500/10 to-amber-400/0 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-sky-300/80 mb-1">Network Activity</p>
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-50 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live Blockchain Transactions
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              Watch fresh on-chain activity stream in from the networks your community actually uses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Network</span>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="bg-slate-900/80 text-slate-50 px-3 py-2 rounded-lg border border-slate-600/80 text-sm shadow-inner focus:outline-none focus:ring-2 focus:ring-sky-500/60"
            >
              {Object.entries(NETWORKS).map(([key, net]) => (
                <option key={key} value={key}>{net.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <p className="text-slate-400 text-sm mb-3">Connecting to {current.name}...</p>
        )}

        <div className="max-h-96 overflow-y-auto pr-1 mt-2">
          <ul className="space-y-2">
            {transactions.map((tx, i) => (
              <li
                key={tx.id ?? `${tx.hash ?? 'unknown'}-${i}`}
                className="rounded-xl px-3 py-2 text-sm flex flex-col gap-1 bg-slate-900/70 hover:bg-slate-900 transition-colors"
                style={{ border: "none" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-mono text-slate-400 truncate flex-1">{tx.hash}</p>
                  <span className="text-xs font-semibold text-emerald-300 whitespace-nowrap">{tx.value}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-slate-300">
                  <span className="text-slate-500">From</span>
                  <span className="truncate max-w-[8rem] md:max-w-[10rem]">{tx.from ?? "—"}</span>
                  <span aria-hidden="true" className="text-slate-500">
                    e
                  </span>
                  <span className="text-slate-500">To</span>
                  <span className="truncate max-w-[8rem] md:max-w-[10rem]">{tx.to ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <a
                    href={`${current.explorer}${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-sky-400 hover:text-sky-300 underline underline-offset-2"
                  >
                    View on Explorer
                  </a>
                  <span className="text-[10px] text-slate-500 uppercase tracking-[0.18em]">Live</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {transactions.length === 0 && !loading && (
          <p className="text-slate-500 text-sm mt-3">Waiting for transactions...</p>
        )}
      </div>
    </section>
  );
}
