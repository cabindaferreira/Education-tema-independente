---
name: ImageMagick PGM output
description: A format detail to check when converting raster artwork for vector tracing.
---

When ImageMagick 7 writes a PGM for thresholded image tracing, inspect its header before choosing a parser. The default output here was ASCII P2, not binary P5, even with 8-bit depth and compression disabled.

**Why:** Assuming P5 caused a parser mismatch during logo tracing in this environment.

**How to apply:** Check the PGM magic token and support P2 integer samples as well as P5 binary samples before tracing contours.
