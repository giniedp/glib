import {
  bufferField,
  bufferLayout,
  BufferRecorder,
  Color,
  createDevice,
  Device,
  PlatformId,
  TaskContext,
} from '@gglib/graphics'

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

  const layout = bufferLayout([
    bufferField('position', 'vec4f'),
    bufferField('color', 'vec4f'),
    bufferField('params', 'vec4f'),
  ])
  const buffer = device.createBuffer({
    size: 1000 * layout.byteSize,
    type: device.isWebGPU ? 'StorageBuffer' : 'UniformBuffer',
  })
  const writer = new BufferRecorder({
    capacity: 1000,
    autosize: true,
    recordByteSize: layout.byteSize,
  })
  writer.reset()
  for (let i = 0; i < 1000; i++) {
    writer.seek(i)
    writer.writeField(layout.schema.position, {
      x: (Math.random() * 2 - 1) * 0.75,
      y: (Math.random() * 2 - 1) * 0.75,
      z: (Math.random() * 2 - 1) * 0.75,
      w: 0,
    })
    writer.writeField(layout.schema.color, {
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      w: 1,
    })
    writer.writeField(layout.schema.params, {
      x: Math.random() * 0.5 + 0.1, // scale
      y: Math.random() * 0 + 0.1, // radius
      z: Math.random() * 2 * Math.PI, // offset
      w: 1,
    })
  }
  writer.upload(buffer)
  shader.program.get('instances')!.setBuffer(buffer)

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

    pass.setVertexBuffer(vertices)
    pass.setProgram(shader.program)
    pass.draw(3, 1000)

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
  out vec3 color;
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

  in vec3 color;
  out vec4 fragColor;
  void main(void) {
    fragColor = vec4(color, 1.0);
  }
`

const wgslShader = /*wgsl*/ `
  struct GlobalBlock {
    time:  f32,
  };

  struct InstanceData {
    position : vec4f,
    color    : vec4f,
    params   : vec4f,
  };

  struct VertexInput {
    @builtin(instance_index) id: u32,
    // @alias position
    @location(0) vPosition : vec3f
  };

  struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) color          : vec3f
  };

  // @block global
  @group(0) @binding(0) var<uniform> global: GlobalBlock;
  // @block instances
  @group(0) @binding(1) var<storage, read> instances: array<InstanceData, 1>;

  @vertex
  fn vs(input : VertexInput) -> VertexOutput {
    let data = instances[input.id];
    let scale = data.params.x;
    let radius = data.params.y;
    let offset = data.params.z;
    var position = data.position.xy;
        position+= input.vPosition.xy * scale;
        position+= vec2f(
          cos(global.time + offset),
          sin(global.time + offset),
        ) * radius;

    var output : VertexOutput;
    output.Position = vec4f(position, input.vPosition.z, 1.0);
    output.color = data.color.xyz;
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4f {
    return vec4f(input.color, 1.0);
  }
`
