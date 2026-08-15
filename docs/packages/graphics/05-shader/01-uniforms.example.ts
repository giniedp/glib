import { Color, createDevice, Device, PlatformId, TaskContext } from '@gglib/graphics'

export default async function run(canvas: HTMLCanvasElement, _: any, platform: PlatformId) {
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

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    const program = shader.program

    // Move the triangle along a circle. `uOffset` is not part of any vertex
    // - it is a single value shared by every vertex and pixel of this draw
    // call, recomputed every frame on the CPU.
    const t = ctx.time / 1000
    program.set('uOffset', { x: Math.cos(t) * 0.5, y: Math.sin(t) * 0.5 })

    // Cycle the fill color independently of the position.
    program.set('uColor', {
      x: 0.5 + 0.5 * Math.sin(t * 2),
      y: 0.5 + 0.5 * Math.sin(t * 2 + 2),
      z: 0.5 + 0.5 * Math.sin(t * 2 + 4),
    })

    // `set` only stages the values on the CPU side. `commit` uploads them
    // to the GPU. Always commit after the last `set` call and before the
    // draw call that depends on the new values.
    program.commit()

    pass.setVertexBuffer(vertices)
    pass.setProgram(program)
    pass.draw(3)
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
