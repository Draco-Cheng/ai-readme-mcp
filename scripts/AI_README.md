# AI_README — scripts

Release tooling. `.cjs` because root package.json is `"type": "module"`.

## Version sync
- Version lives in 6 places; `package.json` is source of truth.
- `npm version` auto-runs sync via the `version` script — synced files land in the same commit + tag.
- `claude-plugin/.mcp.json` npx pin breaks users if stale (others only mislabel) → npm publish MUST land before the tag push.
- sync rewrites by regex, not JSON round-trip — round-trip reformats hand-edited files into the diff.

## Release
- npm publish via OIDC trusted publishing — no token, no secret. Needs `id-token: write` + Node >=22.14 + npm >=11.5.1.
- Claude plugin needs NO publish step — marketplace reads the git repo. Push = released.
- Tag push triggers release.yml; tag must match package.json or the job fails.
