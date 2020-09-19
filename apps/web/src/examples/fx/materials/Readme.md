# Materials

---

The fx-materials package implements various shader snippets which are combined in a single Ubershader.

## defaultProgram

To create the Ubershader the `defaultProgram` function must be called with an object
that is interpreted as a set of `#define` statements. Based on these statements features
will be activated or deactivated.

These example demonstrate how `defaultProgram` can be used to create common shading effects.

## AutoMaterial

The `AutoMaterial` class uses the `defaultProgram` under the hood but gives a
more object oriented way to interact with or create the Ubershader.
