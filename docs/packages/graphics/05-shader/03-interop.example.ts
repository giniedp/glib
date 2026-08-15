import { Color, createDevice, Device, PlatformId, TaskContext } from '@gglib/graphics'
import { mountUi } from 'tweak-ui'

const settings = {
  instances: true,
  instantSubmit: false,
}

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  mountUi(tools, (ui) => {
    ui.bool(settings, 'instances', { label: 'Instanced' })
    ui.bool(settings, 'instantSubmit', { label: 'Instant submit' })
  })

  const shader = device.createShaderModule({
    wgsl: { source: wgslShader },
    glsl: { vertex: glslVS, fragment: glslFS },
  })

  // The same old triangle
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        // but we use 'position' as attribute name in js world
        // and 'vPosition' in the shader world, see shader code at the bottom
        position: {
          byteOffset: 0,
          elementCount: 3,
          elementType: 'float32',
        },
      },
      // prettier-ignore
      data: new Float32Array([
        -0.2, -0.2, 0.0,
         0.2, -0.2, 0.0,
         0.0,  0.2, 0.0,
      ]),
    },
  ])

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    const t = ctx.time / 1000
    const program = shader.program
    // use aliased names, 'offset' and 'color'
    program.set('offset', {
      x: Math.cos(t) * 0.5,
      y: Math.sin(t) * 0.5,
    })
    program.set('color', {
      x: 0.5 + 0.5 * Math.sin(t * 2),
      y: 0.5 + 0.5 * Math.sin(t * 2 + 2),
      z: 0.5 + 0.5 * Math.sin(t * 2 + 4),
    })
    program.commit()

    pass.setVertexBuffer(vertices)
    pass.setProgram(program)
    pass.draw(3)

    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  // @alias position
  in vec3 vPosition;
  // @alias offset
  uniform vec2 uOffset;
  void main(void) {
    gl_Position = vec4(vPosition.xy + uOffset, vPosition.z, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  // @alias color
  uniform vec3 uColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(uColor, 1.0);
  }
`

const wgslShader = /*wgsl*/ `
  // @block offset
  @group(0) @binding(0) var<uniform> uOffset : vec2f;
  // @block color
  @group(0) @binding(1) var<uniform> uColor : vec3f;

  struct VertexOutput {
    @builtin(position) Position : vec4f,
  };

  @vertex
  fn vs(
    // @alias position
    @location(0) vPosition : vec3f
  ) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4f(vPosition.xy + uOffset, vPosition.z, 1.0);
    return output;
  }

  @fragment
  fn fs() -> @location(0) vec4f {
    return vec4f(uColor, 1.0);
  }
`
