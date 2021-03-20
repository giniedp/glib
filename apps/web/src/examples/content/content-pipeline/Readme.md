## Custom Pipeline

The pipeline can be customized by adding `loader` functions.
A `loader` function must be registered with an `input` and `output` type.

In this example we want to load a file with the extension `.pixels` and transform it
into a 3d `Model`. The `.pixels` file format is a made up format for this example.
