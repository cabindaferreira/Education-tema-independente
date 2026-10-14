---
name: Workspace generated types
description: Keep downstream TypeScript checks aligned with regenerated API and schema source.
---

After regenerating API schemas or clients, run `pnpm run typecheck:libs` before typechecking dependent apps and services.

**Why:** Workspace consumers can resolve generated declaration output that remains stale after source codegen, producing false missing-export and missing-column errors.

**How to apply:** Use this between OpenAPI/codegen edits and API-server or frontend typechecks; then verify both consumers.
