---
order: 0
---

# Overview

`@gglib/content` loads assets from URLs and turns them into runtime objects like textures, materials and models.
It defines the loading pipeline but contains only a few formats. Most file formats live in `@gglib/loaders`.

## ContentLoader

The `ContentLoader` is the entry point. It is bound to a `Device` and loads assets with `load(type, url)` or the shorthands `loadTexture`, `loadMaterial` and `loadModel`.
Loaded instances are cached by URL, so repeated calls return the same instance.

## Asset Types

An `AssetType` names what is loaded and couples an options type with an instance type.
Built in types are `AssetType.Texture`, `AssetType.Material` and `AssetType.Model`. Custom types can be added.

## Loading Pipeline

Loading happens in two steps.

1. **Load.** An `AssetLoader` reads a file and returns an `AssetContainer`. A container can hold multiple assets of multiple types, addressed by type and index.
2. **Create.** The container produces plain options for one asset. A creator function turns the options into an instance, for example a `Texture` or a `Model`.

Splitting both steps makes it possible to swap the instance type without touching the file format, for example to replace the default material.

## Loaders

Loaders are registered by file extension or MIME type, either globally on `ContentLoader` or per instance.
If the type cannot be found from the URL, a `HEAD` request is used to detect it.
Common browser image formats are supported out of the box. Formats like glTF, OBJ, STL, DDS, KTX, TGA and HDR are provided by `@gglib/loaders`.

## Dependencies

Assets often reference other assets, for example a model referencing materials and textures.
Relative URIs are resolved against the referencing file. A custom resolver can rewrite URLs.
`ResourceGraph` helps loaders to describe such dependencies and build them in the right order.

## Resource Lifetime

Loaded instances integrate with resource scopes of `@gglib/graphics`. Pass a `scope` on load to tie the instance to that scope.
Loading the same asset in multiple scopes returns one shared instance, owned by all of them. Once it is released, it is removed from the cache.
