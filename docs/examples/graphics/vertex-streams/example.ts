import { createDevice } from '@gglib/graphics'
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

  // Create an array of vertex buffers. This time each channel is extracted into
  // its own vertex buffer.
  const vertices = device.createVertexBuffer([
    {
      layout: { vPosition: { type: 'float', offset: 0, elements: 3 } },
      dataType: 'float',
      data: [-0.5, -0.5, 0.0, 0.5, -0.5, 0.0, -0.5, 0.5, 0.0, 0.5, 0.5, 0.0],
    },
    {
      layout: { vColor: { type: 'ubyte', offset: 0, elements: 4, packed: true, normalize: true } },
      dataType: 'uint',
      data: [0xff0000ff, 0xff00ff00, 0xffff0000, 0xffffffff],
    },
  ])

  // Create the index buffer.
  const indices = device.createIndexBuffer({
    dataType: 'ushort',
    data: [0, 2, 1, 1, 2, 3],
  })

  function render() {
    device.resize()
    device.clear(0xff2e2620)

    device.program = program
    device.vertexBuffer = vertices

    // Now set the index buffer and then call `drawIndexedPrimitives`.
    // This is similar to 'drawPrimitives' but utilizes the index buffer.
    device.indexBuffer = indices
    device.drawIndexedPrimitives('TriangleList', 0, 6)
  }

  return loop(render).stop
}
