import { Color, createDevice, Device, PlatformId } from '@gglib/graphics'
import { glslFS, glslVS } from './shader.glsl'
import { wgslShader } from './shader.wgsl'

export default async (canvas: HTMLCanvasElement, _: any, platform: PlatformId) => {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  // A `ShaderModule` compiles the given source(s) into a GPU program.
  // Because gglib supports both WebGL2 and WebGPU, most examples provide
  // both a `glsl` and a `wgsl` source. Only the one matching the active
  // `platform` is actually compiled.
  const shader = device.createShaderModule({
    wgsl: {
      source: wgslShader,
    },
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  // Vertex data lives in a `VertexBuffer`. `createVertexBuffer` accepts an
  // array of buffer descriptors - here just one - each with a `vertexLayout`
  // describing the attributes contained in `data`.
  const vertices = device.createVertexBuffer([
    {
      layout: {
        // The shader declares one single attribute called `vPosition`.
        // The name here must match the attribute name used in the shader.
        vPosition: {
          byteOffset: 0,
          type: 'float32x3',
        },
      },
      // Three vertices, three floats (x, y, z) each, forming a triangle in
      // clip space (-1 to 1 on both axes).
      // prettier-ignore
      data: new Float32Array([
        -0.5, -0.5, 0.0, // vertex 1 (bottom left)
         0.5, -0.5, 0.0, // vertex 2 (bottom right)
         0.0,  0.5, 0.0, // vertex 3 (top)
      ]),
    },
  ])

  const pass = device.renderPass
  function frame() {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    // Shader compilation happens asynchronously. Until it is done there is
    // no program to draw with, so simply skip the frame.
    if (!shader.isValid) {
      return
    }

    // Assign the buffer and program to the pass, then issue the draw call.
    // `draw(3)` submits 3 vertices, interpreted as a `triangle-list`
    // (one triangle per 3 vertices) by default.
    pass.setVertexBuffer(vertices)
    pass.setProgram(shader.program)
    pass.draw(3)
    // we skip .submit() here, since it is ensured by .flush()
    pass.flush()
  }

  device.schedule(frame)
  return () => {
    device.dispose()
  }
}
