---
title: Render State
aside: false
order: 20
---

# Render State

Draw calls are not just "shader + geometry" - a handful of fixed-function
switches on the `RenderEncoder` decide how the rasterized pixels are
combined with what's already on screen. This section covers each of them
in isolation.
