# ShaderEffect

This example demonstrates how a shader program can be reused in multiple effects.

A `ShaderEffect` holds a reference to a `ShaderProgram` but has its own set of
parameter values.

In this example multiple `ShaderEffect` instances are referencing the same `ShaderProgram`
but each commits its own parameters when rendering.
