import {
  boxGeometry,
  Color,
  createDevice,
  CullState,
  cylinderGeometry,
  DepthState,
  Device,
  Geometry,
  icosahedronGeometry,
  planeGeometry,
  PlatformId,
  sphereGeometry,
  TaskContext,
  torusGeometry,
} from '@gglib/graphics'
import { DEGREE_TO_RAD, Mat4, Vec3 } from '@gglib/math'
import { mountUi } from 'tweak-ui'

const BUILDERS: Record<string, (device: Device) => Geometry> = {
  Box: (device) => boxGeometry(device, { size: 1, segments: 1 }),
  Sphere: (device) =>
    sphereGeometry(device, {
      radius: 0.65,
      slices: 32,
      stacks: 16,
      angleStart: 0,
      angleSweep: Math.PI * 2,
      latitudeStart: 0,
      latitudeSweep: Math.PI,
    }),
  Cylinder: (device) =>
    cylinderGeometry(device, {
      topRadius: 0.5,
      bottomRadius: 0.5,
      heightSegments: 1,
      radialSegments: 32,
      angleStart: 0,
      angleSweep: Math.PI * 2,
      closeTop: true,
      closeBottom: true,
    }),
  Torus: (device) =>
    torusGeometry(device, {
      radius: 0.5,
      tubeRadius: 0.22,
      radialSegments: 16,
      tubularSegments: 32,
      angleStart: 0,
      angleSweep: Math.PI * 2,
      tubeAngleStart: 0,
      tubeAngleSweep: Math.PI * 2,
    }),
  Icosahedron: (device) => icosahedronGeometry(device, { radius: 0.5, subdivisions: 2 }),
  Plane: (device) => planeGeometry(device, { size: 1, segments: 1 }),
}

export default async function run(canvas: HTMLCanvasElement, tools: HTMLElement, platform: PlatformId) {
  const device: Device = await createDevice({ canvas, platform, autosize: true }).ready

  const settings = { shape: 'Box' }
  let geometry = BUILDERS[settings.shape](device)
  mountUi(tools, (ui) => {
    ui.select(settings, 'shape', {
      options: Object.keys(BUILDERS),
      onchange: () => {
        geometry.dispose()
        geometry = BUILDERS[settings.shape](device)
      },
    })
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

    pass.setDepthState(DepthState.LessEqual)
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
