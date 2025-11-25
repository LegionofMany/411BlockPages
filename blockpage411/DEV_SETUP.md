# Development troubleshooting & quick fixes

Run the following checks from PowerShell in the project root to diagnose common Windows/Next.js dev issues (SWC native binary, watcher problems).

1) Check Node and SWC binary

```powershell
node scripts/check_env.js
```

2) If Node arch is not `x64`:

- Install 64-bit Node LTS from https://nodejs.org and re-run `npm install`.

3) If SWC native binary is missing or appears corrupted:

```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

4) Start development server on Windows using polling (more reliable watcher):

```powershell
npm run dev:poll
```

Notes:
- `dev:poll` was added to `package.json` and uses `cross-env` to set `WATCHPACK_POLLING=true`.
- If `npm install` continues to download a corrupted SWC binary, try on another network (VPN/off corporate proxy) or temporarily disable antivirus that may intercept binary downloads.
- For long-term stability, consider using WSL2 (recommended) or a Linux-based remote/devcontainer.
