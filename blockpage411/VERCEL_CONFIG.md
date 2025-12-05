Vercel functions configuration

- Use runtime route paths as keys in `vercel.json` under `functions`.
  - Correct: `"api/poller/run": { "memory": 1024 }`
  - Incorrect: `"api/poller/run.ts": { ... }`

Why:
- During build Vercel maps source files to runtime routes. The `functions` map must reference the runtime route (no file extension) so the override applies to the deployed Serverless Function.

Tips:
- If you want to override the memory or maxDuration for a Serverless Function, use the route path that matches your API route (e.g. `api/admin/alerts/retry`).
- Do not include file extensions (like `.ts`) in `vercel.json` keys — those will not match and will cause the build error: "The pattern \"...\" defined in `functions` doesn't match any Serverless Functions.".
- To validate before pushing, run `vercel build` locally (requires Vercel CLI) or push to a non-production branch to test the build.

Example `vercel.json`:

```json
{
  "functions": {
    "api/poller/run": { "memory": 1024, "maxDuration": 60 },
    "api/admin/alerts/retry": { "memory": 512 }
  },
  "crons": [
    { "path": "/api/poller/run", "schedule": "*/15 * * * *" }
  ]
}

