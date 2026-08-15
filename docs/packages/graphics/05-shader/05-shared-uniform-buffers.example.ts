import { Color, createDevice, Device, PlatformId, TaskContext } from '@gglib/graphics'

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
        -0.2, -0.2, 0.0,
         0.2, -0.2, 0.0,
         0.0,  0.2, 0.0,
      ]),
    },
  ])

  const programs = [
    shader.program.clone({ sharedBlocks: ['global'] }),
    shader.program.clone({ sharedBlocks: ['global'] }),
    shader.program.clone({ sharedBlocks: ['global'] }),
  ]

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }

    const t = ctx.time / 1000
    shader.program.set('global.time', t)
    shader.program.commit()
    for (let i = 0; i < programs.length; i++) {
      const program = programs[i]
      program.set('material.offset', (2 * Math.PI * i) / programs.length)
      program.set('material.color', {
        x: 0.5 + 0.5 * Math.sin(t * 2),
        y: 0.5 + 0.5 * Math.sin(t * 2 + 2),
        z: 0.5 + 0.5 * Math.sin(t * 2 + 4),
      })
      program.commit()

      pass.setVertexBuffer(vertices)
      pass.setProgram(program)
      pass.draw(3)
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
  precision highp float;

  // @block global
  layout(std140) uniform GlobalBlock {
    float time;
  } global;

  // @block material
  layout(std140) uniform MaterialBlock {
    vec3 color;
    float offset;
  } mtl;

  // @alias position
  in vec3 vPosition;

  void main(void) {
    gl_Position = vec4(
      vPosition.xy + vec2(
        cos(global.time + mtl.offset),
        sin(global.time + mtl.offset)
      ) * 0.5,
      vPosition.z,
      1.0
    );
  }
`

const glslFS = /*glsl*/ `
  #version 300 es
  precision highp float;

  // @block material
  layout(std140) uniform MaterialBlock {
    vec3 color;
    float offset;
  } mtl;

  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(mtl.color, 1.0);
  }
`

const wgslShader = /*wgsl*/ `
  struct GlobalBlock {
    time:  f32,
  };

  struct MaterialBlock {
    color:   vec3f,
    offset:  f32,
  };

  struct VertexInput {
    // @alias position
    @location(0) vPosition : vec3f
  };

  struct VertexOutput {
    @builtin(position) Position : vec4f,
  };

  // @block global
  @group(0) @binding(0) var<uniform> global: GlobalBlock;
  // @block material
  @group(0) @binding(1) var<uniform> mtl: MaterialBlock;

  @vertex
  fn vs(input : VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.Position = vec4f(
      input.vPosition.xy + vec2f(
        cos(global.time + mtl.offset),
        sin(global.time + mtl.offset),
      ) * 0.5,
      input.vPosition.z,
      1.0,
    );
    return output;
  }

  @fragment
  fn fs() -> @location(0) vec4f {
    return vec4f(mtl.color, 1.0);
  }
`
