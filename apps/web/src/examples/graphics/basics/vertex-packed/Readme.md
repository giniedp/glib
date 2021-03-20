## Vertex color as packed attribute

In the previous example the color attribute of a vertex was made of 3 floats.
That is 12 bytes per vertex for the color. We can optimize that down to 4 bytes
per vertex. Again, the code stays for the most part the same.
Only the `layout` and the `data` of the vertex buffer is changed.

