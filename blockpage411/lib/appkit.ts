// This module initializes Reown's AppKit client-side only.
// It performs dynamic imports so the SDK is not required during SSR
// and exposes a singleton initializer. If an adapter that can create a
// wagmi-compatible connector is available, we attempt to create one and
// store it on the global object as `__blockpage411_reownConnector` so the
// app can include it in the Wagmi connectors array.

type ReownAppKitInstance = {
  appkit?: unknown;
  adapter?: unknown;
};

const G = globalThis as unknown as {
  __blockpage411_reownAppkit?: ReownAppKitInstance | null;
  __blockpage411_reownConnector?: unknown | null;
};

export async function initReownAppKit(): Promise<ReownAppKitInstance | null> {
  if (G.__blockpage411_reownAppkit !== undefined) return G.__blockpage411_reownAppkit || null;

  // Only initialize in browser environments.
  if (typeof window === 'undefined') {
    G.__blockpage411_reownAppkit = null;
    G.__blockpage411_reownConnector = null;
    return null;
  }

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  if (!projectId) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Reown AppKit not initialized: NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID is missing.');
    }
    G.__blockpage411_reownAppkit = null;
    G.__blockpage411_reownConnector = null;
    return null;
  }

  try {
    // Dynamic imports keep the module client-only and avoid SSR bundle issues.
    const appkitMod = await import('@reown/appkit').catch(() => null);
    // Load adapter via a runtime import to avoid build-time resolution errors
    // when the optional adapter package is not installed. This prevents the
    // bundler from failing to resolve a missing optional dependency.
    let adapterMod: any = null;
    try {
      const dynamicImport: any = (mod: string) => (new Function('m', 'return import(m)'))(mod);
      adapterMod = await dynamicImport('@reown/appkit-adapter-wagmi').catch(() => null);
    } catch (_) {
      adapterMod = null;
    }

    if (!appkitMod) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('@reown/appkit module not available; skipping AppKit initialization.');
      }
      G.__blockpage411_reownAppkit = null;
      G.__blockpage411_reownConnector = null;
      return null;
    }

    const instance: ReownAppKitInstance = { appkit: appkitMod, adapter: adapterMod };
    G.__blockpage411_reownAppkit = instance;

    // Try to build a wagmi connector from the adapter if present. The adapter
    // package API may vary between versions; try common export names to be
    // resilient. If we fail, we fallback to the default WalletConnect
    // connector provided by wagmi.
    try {
      if (adapterMod) {
        const factory = (adapterMod as any).createWagmiConnector || (adapterMod as any).createConnector || (adapterMod as any).default;
        if (typeof factory === 'function') {
          // Some adapters expect the appkit module or options; try to call
          // with reasonable arguments but do not crash if it fails.
          const maybeConnector = await (async () => {
            try { return await factory({ projectId, appName: 'Blockpage411', appkit: appkitMod }); } catch (_) {}
            try { return await factory({ projectId, appName: 'Blockpage411' }); } catch (_) {}
            try { return await factory(appkitMod); } catch (_) {}
            try { return factory(); } catch (_) { return null; }
          })();

          if (maybeConnector) {
            G.__blockpage411_reownConnector = maybeConnector;
            if (process.env.NODE_ENV !== 'production') {
              // eslint-disable-next-line no-console
              console.warn('Reown wagmi connector created and registered globally.');
            }
          } else {
            G.__blockpage411_reownConnector = null;
          }
        }
      }
    } catch (err) {
      G.__blockpage411_reownConnector = null;
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('Failed to create Reown wagmi connector from adapter', err);
      }
    }

    return instance;
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('Failed to initialize Reown AppKit', err);
    }
    G.__blockpage411_reownAppkit = null;
    G.__blockpage411_reownConnector = null;
    return null;
  }
}

export function getReownAppKit(): ReownAppKitInstance | null | undefined {
  return G.__blockpage411_reownAppkit;
}

export function getReownWagmiConnector(): unknown | null | undefined {
  return G.__blockpage411_reownConnector;
}

