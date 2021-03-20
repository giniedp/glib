## Render package examples

The render package provides a `RenderManager` class which when instantiatet
is responsible for managing render target textures and scenes.
An instance of the `RenderManager` must be setup with a list of `RenderStage`s
where each stage is responsible for one particular part of the rendering pipeline.
Also the `RenderManager` instance must be given one or more scenes to work with.

Scenes can be activated and deactivated. Active scenes are always rendered
and inactive scenes are skipped. It is up to the developer or a higher level
logic to activate and deactivate the scenes, as well as attach or detach
cameras and fill the scenes with objects.

The following examples show the usage of the `RenderManager` and how
custom `RenderStage`s can be implemented.
