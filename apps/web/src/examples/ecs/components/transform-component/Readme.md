## TransformComponent

The `TranformComponent` provides access to the position rotation and translation of an entity
and calculates the final world transform matrix when these properties have changed.
In an entity tree each `TransformComponent` will be affected by the
`TransformComponent` of its parent entity.

