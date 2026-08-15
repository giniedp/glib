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
    wgsl: {
      source: wgslShader,
    },
    glsl: {
      vertex: glslVS,
      fragment: glslFS,
    },
  })

  // The same static triangle as before - its vertex buffer never changes.
  const vertices = device.createVertexBuffer([
    {
      vertexLayout: {
        vPosition: {
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

  // create program instances, one for each object
  const program1 = shader.program.clone()
  const program2 = shader.program.clone()
  //
  const instanced = [program1, program2]
  const notInstanced = [program1, program1]

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    const t = ctx.time / 1000
    const programs = settings.instances ? instanced : notInstanced
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i]
      const offset = i * Math.PI
      program.set('uOffset', {
        x: Math.cos(t + offset) * 0.5,
        y: Math.sin(t + offset) * 0.5,
      })
      program.set('uColor', {
        x: 0.5 + 0.5 * Math.sin(t * 2),
        y: 0.5 + 0.5 * Math.sin(t * 2 + 2),
        z: 0.5 + 0.5 * Math.sin(t * 2 + 4),
      })
      program.commit()

      pass.setVertexBuffer(vertices)
      pass.setProgram(program)
      pass.draw(3)

      // submitting instantly after calling .draw(), makes webGPU consume the
      // latest applied uniform values and render as expected, even with a single
      // program instance. This however comes with the cost of performance.
      if (settings.instantSubmit) {
        pass.submit() // this is a no-op for WebGL
      }
    }

    // late submission is preferred for WebGPU so that draw calls sent as a batch
    // to the GPU and gives us huge performance gain when rendering large amount of objects
    if (!settings.instantSubmit) {
      pass.submit() // this is a no-op for WebGL
    }
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
  uniform vec2 uOffset;
  void main(void) {
    gl_Position = vec4(vPosition.xy + uOffset, vPosition.z, 1.0);
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision mediump float;
  uniform vec3 uColor;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(uColor, 1.0);
  }
`

const wgslShader = /*wgsl*/ `
  @group(0) @binding(0) var<uniform> uOffset : vec2<f32>;
  @group(0) @binding(1) var<uniform> uColor : vec3<f32>;

  struct VertexOutput {
    @builtin(position) Position : vec4<f32>,
  };

  @vertex
  fn vs(@location(0) vPosition : vec3<f32>) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4<f32>(vPosition.xy + uOffset, vPosition.z, 1.0);
    return output;
  }

  @fragment
  fn fs() -> @location(0) vec4<f32> {
    return vec4<f32>(uColor, 1.0);
  }
`
