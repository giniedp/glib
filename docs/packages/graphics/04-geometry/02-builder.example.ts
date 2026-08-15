import {
  Color,
  createDevice,
  CullState,
  DepthState,
  Device,
  GeometryBuilder,
  PlatformId,
  TaskContext,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  // Start a geometry builder with a desired vertex layout.
  // For the basic material we need at least position, normal and texture
  const builder = new GeometryBuilder({
    layout: [['position', 'normal', 'texture']],
  })

  // Add individual vertices. Any missing attribute will be filled with a
  // default value. We don't pass texture coordinates here, so they all will
  // be 0. That's fine for this demo, as we don't render textures.
  builder.addVertex({ position: [-0.5, -0.5, -0.5] })
  builder.addVertex({ position: [0.5, -0.5, -0.5] })
  builder.addVertex({ position: [0.5, 0.5, -0.5] })
  builder.addVertex({ position: [-0.5, 0.5, -0.5] })
  builder.addVertex({ position: [-0.5, -0.5, 0.5] })
  builder.addVertex({ position: [0.5, -0.5, 0.5] })
  builder.addVertex({ position: [0.5, 0.5, 0.5] })
  builder.addVertex({ position: [-0.5, 0.5, 0.5] })
  // prettier-ignore
  builder.addIndices(
    4, 5, 6, 4, 6, 7, // front  (+Z)
    1, 0, 3, 1, 3, 2, // back   (-Z)
    0, 4, 7, 0, 7, 3, // left   (-X)
    5, 1, 2, 5, 2, 6, // right  (+X)
    3, 7, 6, 3, 6, 2, // top    (+Y)
    0, 1, 5, 0, 5, 4, // bottom (-Y)
  )

  // Normals can be either passed during addVertex step or optionally
  // calculated afterwards
  builder.calculateNormals()

  // Finish the geometry
  const geometry = builder.buildGeometry(device, {
    name: 'cube',
    primitiveType: 'TriangleList',
  })

  const shader = device.createShaderModule({
    glsl: { vertex: glslVS, fragment: glslFS },
    wgsl: { source: wgsl },
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const cameraPosition = Vec3.create(0, 1, 2)

  const pass = device.renderPass
  function frame(ctx: TaskContext) {
    pass.setClearColor(0, Color.CornflowerBlue)
    pass.clear()

    if (!shader.isValid) {
      return
    }
    world.initIdentity().rotateY((ctx.time / 1000) * 25 * DEGREE_TO_RAD)
    view.initLookAt(cameraPosition, Vec3.Zero, Vec3.UnitY).invert()
    projection.initPerspectiveFieldOfView(50 * DEGREE_TO_RAD, device.output.aspectRatio, 0.1, 100, device.ndcMinZ)

    shader.program.set('uWorld', world)
    shader.program.set('uView', view)
    shader.program.set('uProjection', projection)
    shader.program.commit()

    pass.setCullState(CullState.CullBack)
    pass.setProgram(shader.program)
    pass.render(geometry)

    pass.resolve()
    pass.submit()
    pass.flush()
  }

  device.scheduler.schedule(frame)
  return () => {
    device.dispose()
    geometry.dispose()
  }
}

const glslVS = /*glsl*/ `
  #version 300 es
  in vec3 position;
  out vec3 color;
  uniform mat4 uWorld;
  uniform mat4 uView;
  uniform mat4 uProjection;

  void main(void) {
    color = position + vec3(0.5);
    gl_Position = uProjection * uView * uWorld * vec4(position, 1.0);
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

const wgsl = /*wgsl*/ `

  @group(0) @binding(0) var<uniform> uWorld : mat4x4f;
  @group(0) @binding(1) var<uniform> uView : mat4x4f;
  @group(0) @binding(2) var<uniform> uProjection : mat4x4f;

  struct VertexInput {
    @location(0) position : vec3f,
  };
  struct VertexOutput {
    @builtin(position) Position : vec4f,
    @location(0) color : vec3f,
  };

  @vertex
  fn vs(input: VertexInput) -> VertexOutput {
    var output : VertexOutput;
    output.color = input.position + vec3f(0.5);
    output.Position = uProjection * uView * uWorld * vec4f(input.position, 1.0);
    return output;
  }

  @fragment
  fn fs(input: VertexOutput) -> @location(0) vec4<f32> {
    return vec4f(input.color, 1.0);
  }
`
