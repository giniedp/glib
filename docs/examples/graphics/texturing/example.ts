import { DeviceGL, createDevice } from '@gglib/graphics'
import { loop } from '@gglib/utils'

const vertexShader = /*glsl*/ `
  precision highp float;
  attribute vec3 vPosition;
  attribute vec2 vTexture;
  varying vec2 texCoord;
  void main(void) {
    texCoord = vTexture;
    gl_Position = vec4(vPosition, 1.0);
  }
`
const fragmentShader = /* glsl*/ `
  precision highp float;
  uniform sampler2D uTexture;
  varying vec2 texCoord;
  void main(void) {
    // Read the color from texture and render the pixel with that color.
    gl_FragColor = vec4(texture2D(uTexture, texCoord).rgb, 1.0);
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
  const vertices = device.createVertexBuffer({
    layout: {
      // The layout of `vPosition` stays unchanged
      vPosition: { type: 'float', offset: 0, elements: 3 },
      // The `vTexture` specifies the layout of the texture coordinates
      vTexture: { type: 'float', offset: 12, elements: 2 },
    },
    data: [-0.5, -0.5, 0.0, 0, 1, 0.5, -0.5, 0.0, 1, 1, -0.5, 0.5, 0.0, 0, 0, 0.5, 0.5, 0.0, 1, 0],
  })

  // Create the index buffer.
  const indices = device.createIndexBuffer({
    dataType: 'ushort',
    data: [0, 1, 2, 1, 2, 3],
  })

  // Create a texture object. We simply pass an URL as `data` option.
  const texture = device.createTexture({
    image: {
      source: '/assets/textures/prototype/proto_red.png',
    }
  })

  function render() {
    // And assign the texture to the shader
    program.setUniform('uTexture', texture)

    // resize (if needed) and clear the screen
    device.resize()
    device.clear(0xff2e2620)

    // set the drawing state
    device.program = program
    device.indexBuffer = indices
    device.vertexBuffer = vertices

    // and render.
    device.drawIndexedPrimitives('TriangleList', 0, 6)
  }
  // Begin render loop
  return loop(render).stop
}
