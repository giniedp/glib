import { Color, createDevice, CullState, Device, PlatformId, TaskContext } from '@gglib/graphics'
import { mountUi } from 'tweak-ui'

const settings = {
  cull: CullState.CullBack,
}
export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const shader = device.createShaderModule({
    wgsl: { source: wgslShader },
    glsl: { vertex: glslVS, fragment: glslFS },
  })

  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        position: { byteOffset: 0, elementCount: 3, elementType: 'float32' },
      },
      // prettier-ignore
      data: new Float32Array([
        -1, -1, 0.0,
         1, -1, 0.0,
        -1,  1, 0.0,
         1,  1, 0.0,
      ]),
    },
  ])

  // Whether a triangle counts as "front" or "back" facing depends on the
  // winding order of its indices as seen on screen
  const indices = device.createIndexBuffer({
    indexType: 'uint16',
    data: new Uint16Array([
      // lower left triangle
      // counter clockwise winding
      // front face is facing the camera
      0, 1, 2,
      // upper right triangle
      // clockwise winding
      // front face is facing away from camera
      1, 2, 3,
    ]),
  })

  mountUi(tools, (ui) => {
    ui.select(settings, 'cull', {
      options: [
        { value: CullState.Disabled, label: 'Disabled' },
        { value: CullState.CullBack, label: 'Cull Back' },
        { value: CullState.CullFront, label: 'Cull Front' },
      ],
    })
  })

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    pass.setCullState(settings.cull)
    pass.setProgram(shader.program)
    pass.setVertexBuffer(vertices)
    pass.setIndexBuffer(indices)
    pass.drawIndexed(indices.elementCount)
    pass.submit()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 position;
  out vec3 vertexColor;
  void main(void) {
    vertexColor = vec3(0.5) + position;
    gl_Position = vec4(position, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  in vec3 vertexColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(vertexColor, 1.0);
  }
`
const wgslShader = /*wgsl*/ `

  struct VertexInput {
    @location(0) position : vec3<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) vertexColor : vec3<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(input.position, 1.0);
    output.vertexColor = vec3f(0.5) + input.position;
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(input.vertexColor, 1.0);
  }
`
