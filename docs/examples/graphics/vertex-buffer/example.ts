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

  // Create the vertex buffer
  const vertices = device.createVertexBuffer([
    {
      layout: {
        // The layout of `vPosition` stays unchanged
        vPosition: { type: 'float32', offset: 0, elements: 3 },
        // The `vColor` is now defined as a 4 ubyte element.
        vColor: {
          offset: 12,
          elements: 4, // 4 elements
          type: 'uint8', // of unsigned byte type
          packed: true, // but all 4 are packed in a single 32bit value
          // this indicates that a byte value should be normalized
          // into [0:1] range before it is utilized in the vertex shader stage
          normalize: true,
        },
      },

      // Each color attribute is now a 32bit color value in RGBA format.
      dataType: 'float32',
      data: [
        -0.5, -0.5, 0.0, 0xff0000ff, 0.5, -0.5, 0.0, 0xff00ff00, -0.5, 0.5, 0.0, 0xffff0000, 0.5, 0.5, 0.0, 0xffffffff,
      ],
    },
  ])

  // Create the index buffer.
  const indices = device.createIndexBuffer({
    dataType: 'uint16',
    data: [0, 2, 1, 1, 2, 3],
  })

  function render() {
    // resize (if needed) and clear the screen
    device.resize()
    device.clear(0xff222222)

    // set the drawing state
    device.program = program
    device.vertexBuffer = vertices
    device.indexBuffer = indices
    // and render.
    device.drawIndexedPrimitives('TriangleList', 0, 6)
  }

  return loop(render).stop
}
