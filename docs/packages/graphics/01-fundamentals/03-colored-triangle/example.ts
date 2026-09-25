import { Color, createDevice, Device, PlatformId } from '@gglib/graphics'
import { glslFS, glslVS } from './shader.glsl'
import { wgslShader } from './shader.wgsl'

export default async (canvas: HTMLCanvasElement, _: any, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const shader = device.createShaderModule({
    wgsl: {
      source: wgslShader,
    },
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  // This time each vertex carries two attributes: a position and a color.
  // Both live in the same buffer, interleaved per vertex.
  const vertices = device.createVertexBuffer([
    {
      // The shader declares one two attributes
      // - `vPosition`
      // - `vColor`
      layout: {
        vPosition: {
          byteOffset: 0,
          type: 'float32x3',
        },
        vColor: {
          byteOffset: 3 * 4, // offset by 3 floats, each is 4 bytes
          type: 'float32x3',
        },
      },
      // Each row below is one vertex: 3 floats for position, then 3 floats
      // for color (r, g, b). The layout above tells the GPU how to slice
      // this flat array back into the two attributes.
      // prettier-ignore
      data: new Float32Array([
        /* position */ -0.5, -0.5, 0.0, /* color */ 1, 0, 0,
        /* position */  0.5, -0.5, 0.0, /* color */ 0, 1, 0,
        /* position */  0.0,  0.5, 0.0, /* color */ 0, 0, 1,
      ]),
    },
  ])

  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    pass.setVertexBuffer(vertices)
    pass.setProgram(shader.program)
    pass.draw(3)
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
