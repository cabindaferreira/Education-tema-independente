---
name: One-off media imports
description: Running temporary import scripts that need both the Academy database and App Storage.
---

For one-off scripts that need the Academy database and App Storage helpers, build the temporary TypeScript script with the API workspace's esbuild as CommonJS, externalizing the Google Cloud Storage package. Run it from the API workspace so its environment and sidecar access are available; then delete the temporary source and bundle.

**Why:** The API workspace has no `tsx` executable, and Node's native TypeScript loader cannot resolve the extensionless directory import used by the workspace database package. Bundling as ESM also failed on dynamic CommonJS `require` calls in the PostgreSQL driver; CommonJS bundling worked.

**How to apply:** Use this only for authorized one-off data imports that must use the existing API database and App Storage stack. Do not change the workspace database imports or add a permanent TypeScript runner solely for a temporary script.
