import { createDevice, Device } from '@gglib/graphics'
import { loop } from '@gglib/utils'

const vertexShader = /*glsl*/ `
  attribute vec3 vPosition;
  void main(void) {
    gl_Position = vec4(vPosition, 1.0);
  }
`

const fragmentShader = /*glsl*/ `
  void main(void) {
    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`

export default function run(canvas: HTMLCanvasElement) {
  const device: Device = createDevice({
    canvas,
  })

  const program = device.createProgram({
    vertexShader,
    fragmentShader,
  })

  const vertices = device.createVertexBuffer([
    {
      layout: {
        vPosition: {
          type: 'float',
          offset: 0,
          elements: 3,
        },
      },
      // The `data` is simply a sequence of floats.
      // Each 3 floats define a vertex position
      // prettier-ignore
      data: [
        -0.5, -0.5, 0.0, // vertex 1
         0.5, -0.5, 0.0, // vertex 2
         0.0,  0.5, 0.0, // vertex 3
      ],
    },
  ])

  function frame() {
    if (!program.isReady) {
      // wait for the program to compile
      return
    }

    device.resize()
    device.clear(0xff2e2620)

    device.vertexBuffer = vertices
    device.program = program
    device.drawPrimitives('TriangleList', 0, 3)
  }

  const gameLoop = loop(frame)
  return () => {
    gameLoop.stop()
  }
}
