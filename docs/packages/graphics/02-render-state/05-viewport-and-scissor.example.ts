import { Color, createDevice, Device, PlatformId, TaskContext } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
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

  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: { byteOffset: 0, elementCount: 3, elementType: 'float32' },
        vColor: { byteOffset: 12, elementCount: 3, elementType: 'float32' },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.7, -0.7, 0.0, 1, 0, 0,
         0.7, -0.7, 0.0, 0, 1, 0,
         0.0,  0.7, 0.0, 0, 0, 1,
      ]),
    },
  ])

  const settings = {
    scissor: true,
  }
  mountUi(tools, (ui) => {
    ui.bool(settings, 'scissor', { label: 'Scissor (inset clip rect)' })
  })

  const world = Mat4.createIdentity()
  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    // Clear the whole canvas once, before restricting the viewport to any
    // of the four quadrants below.
    pass.setViewportState(0, 0, device.output.width, device.output.height)
    pass.setScissorState(null)
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    world.initRotationZ(ctx.time / 1000)
    const program = shader.program
    program.set('uWorld', world)
    program.commit()

    pass.setProgram(program)
    pass.setVertexBuffer(vertices)

    // The viewport maps clip space (-1..1) to a region of the render
    // target - drawing the same triangle into 4 different viewports
    // renders 4 independent, identically-sized copies of it.
    const w = device.output.width / 2
    const h = device.output.height / 2
    const quadrants: Array<[number, number]> = [
      [0, 0],
      [w, 0],
      [0, h],
      [w, h],
    ]
    for (const [x, y] of quadrants) {
      pass.setViewportState(x, y, w, h)
      if (settings.scissor) {
        // The scissor rect clips pixels regardless of the viewport
        // transform above - shrinking it below the viewport size cuts the
        // triangle off at a hard edge, independent of its rotation.
        const margin = 0.18
        pass.setScissorState(x + w * margin, y + h * margin, w * (1 - 2 * margin), h * (1 - 2 * margin))
      } else {
        pass.setScissorState(null)
      }
      pass.draw(3)
    }

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
  in vec3 vPosition;
  in vec3 vColor;
  uniform mat4 uWorld;
  out vec3 vertexColor;
  void main(void) {
    vertexColor = vColor;
    gl_Position = uWorld * vec4(vPosition, 1.0);
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
  @group(0) @binding(0) var<uniform> uWorld : mat4x4<f32>;

  struct VertexInput {
    @location(0) vPosition : vec3<f32>,
    @location(1) vColor : vec3<f32>,
  };

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
    @location(0) vertexColor : vec3<f32>,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = uWorld * vec4<f32>(input.vPosition, 1.0);
    output.vertexColor = input.vColor;
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(input.vertexColor, 1.0);
  }
`
