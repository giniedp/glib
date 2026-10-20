---
order: 0
---

# Overview

`@gglib/render` is a high level renderer on top of `@gglib/graphics`. It takes a scene description, collects what is visible and executes a configurable pipeline of render passes.
It does not own a scene graph. Any data structure can be rendered as long as it provides render items.

## Renderer

The `Renderer` is the entry point. Each frame, `update` advances the frame time and `render` draws a scene into all of its views.
It holds global render inputs like ambient light and fog, which are passed to every material.

## Scene, Views and Items

- A `RenderScene` lists the views to render and collects render items for a camera. Culling is up to the scene.
- A `RenderView` combines a camera, a viewport and a pipeline. Multiple views can be rendered side by side or into textures, for example for split screen or a minimap.
- A `RenderItem` is a plain record with a type, a transform, layer and flags, and the data to draw. Built in types are models, meshes, mesh parts and instance batches.

Layer masks on views and cameras decide which items are picked up.

## Render Lists

Passes request render lists for a mode, for example opaque or transparent. A list contains only matching items and is sorted by state or depth.
Items that share geometry and material are batched and drawn with instancing.

## Pipeline and Passes

A `RenderPipeline` is a list of `RenderPass` objects. Built in passes cover opaque and transparent geometry. Post processing passes like bloom, tonemap, FXAA, pixelate and vignette can be appended.
Custom passes are written as plain objects with `setup`, `render` and `cleanup`, or with helpers like `FunctionPass` and `GroupPass`.

## Frame Graph

During `setup`, each pass declares which render channels it reads and writes, for example color or depth.
The `FrameGraph` uses this to track dependencies, cull passes that do not contribute to the view output and allocate render targets only for as long as they are needed. Passes still execute in the order they were added.
Render targets are pooled and reused across passes and frames. Unused targets are evicted after a number of frames.

## Presentation

After all views are rendered, their output channels are composed onto the screen or into a target texture.
