import { DeviceGL, createDevice } from '@gglib/graphics'
import { loop } from '@gglib/utils'
const vertexShader = /*glsl*/ `
  precision highp float;
  // vertex position attribute
  attribute vec3 vPosition;
  // vertex color attribute
  attribute vec3 vColor;
  // color attribute that will be passed to the fragment shader
  varying vec3 vertexColor;
  void main(void) {
    vertexColor = vColor;
    gl_Position = vec4(vPosition, 1.0);
  }
`
const fragmentShader = /*glsl*/ `
  precision highp float;
  // color attribute coming from vertex shader
  varying vec3 vertexColor;
  void main(void) {
    // output pixel color
    gl_FragColor = vec4(vertexColor.rgb, 1.0);
  }
`

export default (canvas: HTMLCanvasElement) => {
  // Create the graphics device and pass the existing canvas element from the DOM.
  const device = createDevice({
    canvas,
  })

  // Create a shader program with vertex and fragment shaders.
  // Here the shader source code is grabbed from the script tags.
  const program = device.createProgram({
    vertexShader,
    fragmentShader,
  })

  // Create the vertex buffer. The layout is still the same
  // as in the triangle example.
  const vertices = device.createVertexBuffer({
    layout: {
      vPosition: { type: 'float', offset: 0, elements: 3 },
      vColor: { type: 'float', offset: 12, elements: 3 },
    },
    // However, the data gets an additional vertex.
    // prettier-ignore
    data: [
    -0.5, -0.5, 0.0,   1,  0,  0, // The red vertex
     0.5, -0.5, 0.0,   0,  1,  0, // The green vertex
    -0.5,  0.5, 0.0,   0,  0,  1, // The blue vertex
     0.5,  0.5, 0.0,   1,  1,  1, // The white vertex
  ],
  })

  // Now create an index buffer. The `dataType` must be either `ushort` or an `uint`
  // which defines the element type of the `data` array.
  const indices = device.createIndexBuffer({
    dataType: 'ushort',
    // The data array defines a triangle list. That means each 3 values
    // describe a triangle by indexing the vertices from the vertex buffer
    // prettier-ignore
    data: [
    0, 2, 1, // first triangle
    1, 2, 3, // second triangle
  ],
  })

  function render() {
    device.resize()
    device.clear(0xff222222)

    // Now prepare the device for rendering as before by
    // setting the program and the vertex buffer
    device.program = program
    device.vertexBuffer = vertices
    // This time also set the index buffer
    device.indexBuffer = indices
    // and call `drawIndexedPrimitives`
    device.drawIndexedPrimitives('TriangleList', 0, 6)
  }
  return loop(render).stop
}
