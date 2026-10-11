---
name: Orval parameter exports
description: Orval's split Zod and TypeScript generation can collide on operation parameter names.
---

In this workspace, an OpenAPI GET operation with path or query parameters can produce the same `<OperationName>Params` symbol in the generated Zod API module and generated TypeScript models. The package barrel then fails on duplicate exports. A hand-edited generated barrel is not durable because codegen rewrites it.

**Why:** A room-availability GET contract exposed the collision, and the generated barrel overwrote the initial manual workaround.

**How to apply:** Before adding parameterized GET operations, account for the duplicate export during contract design. For complex availability/filter inputs, a POST body with a distinct component name avoids the collision; then run codegen and the library typecheck.
