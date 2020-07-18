import {
  buildCone,
  buildCube,
  buildCylinder,
  buildDisc,
  buildIcosahedron,
  buildLines,
  buildOctahedron,
  buildPlane,
  buildSphere,
  buildTorus,
  CullState,
  DepthState,
  DeviceGL,
  ModelBuilder,
  ModelMeshPart,
  PrimitiveType,
  createDevice,
} from '@gglib/graphics'

import { Mat4 } from '@gglib/math'
import { loop } from '@gglib/utils'
import * as TweakUi from 'tweak-ui'

// Create the graphics device and pass the existing canvas element from the DOM.
const device = createDevice({
  canvas: document.getElementById('canvas') as HTMLCanvasElement,
})

// Create a shader program with vertex and fragment shaders coming from script tags
const program = device.createProgram({
  vertexShader: document.getElementById('vertex-shader').textContent,
  fragmentShader: document.getElementById('fragment-shader').textContent,
})

const linesProgram = device.createProgram({
  vertexShader: document.getElementById('vertex-shader-lines').textContent,
  fragmentShader: document.getElementById('fragment-shader-lines').textContent,
})

// Create a texture
const texture = device.createTexture({
  data: '/assets/textures/uvgrids/UV_Grid_Sm.jpg',
})

// The mesh variable. It will be rendered once it has been built.
let mesh: ModelMeshPart = null
let linesMesh: ModelMeshPart = null

// The mesh rotation state
const meshRotation = {
  yaw: 0,
  pitch: 0.25,
  roll: 0,
}

function destroyMesh() {
  if (mesh != null) {
    mesh.destroy()
    mesh = null
  }
}

// Builds the mesh using the specified formula.
function buildMesh(name: string) {
  destroyMesh()
  mesh = ModelBuilder.begin().append((b) => {
    const fn = builderFunctions[name]
    const options = builderFunctionOptions[name]
    fn(b, options)
  })
  .endMeshPart(device)

  linesMesh = ModelBuilder.begin({
    layout: ['position', 'color'],
  }).append((b) => {
    buildLines(b, mesh.vertexBuffer)
  }).endMeshPart(device, {
    primitiveType: PrimitiveType.LineList,
  })
}

const builderFunctions = {
  Cone: buildCone,
  Cube: buildCube,
  Cylinder: buildCylinder,
  Disc: buildDisc,
  Icosahedron: buildIcosahedron,
  Octahedron: buildOctahedron,
  Plane: buildPlane,
  Sphere: buildSphere,
  Torus: buildTorus,
}
const builderFunctionOptions = {
  Cube: {
    size: 1,
    tesselation: 1,
  },
  Disc: {
    offset: 0,
    innerRadius: 0.25,
    outerRadius: 0.5,
    tesselation: 32,
  },
  Cone: {
    height: 1,
    upperRadius: 0.25,
    lowerRadius: 0.5,
    tesselation: 32,
  },
  Cylinder: {
    height:  1.0,
    offset: -0.5,
    radius: 0.5,
    tesselation: 32,
  },
  Plane: {
    size: 1,
    tesselation: 1,
  },
  Sphere: {
    radius: 0.5,
    tesselation: 32,
  },
  Torus: {
    outerRadius: 0.5,
    innerRadius: 0.25,
    tesselation: 32,
  },
  Octahedron: {
    radius: 0.5,
    tesselation: 0,
  },
  Icosahedron: {
    radius: 0.5,
    tesselation: 0,
  },
}

// Build the ui to allow formula options to be changed
TweakUi.build('#tweak-ui', (q: TweakUi.Builder) => {
  buildMesh('Cube')

  q.group('Rotation', { open: true }, (g) => {
    g.slider(meshRotation, 'yaw', { min: -1, max: 1, step: 0.01 })
    g.slider(meshRotation, 'pitch', { min: -1, max: 1, step: 0.01 })
    g.slider(meshRotation, 'roll', { min: -1, max: 1, step: 0.01 })
  })

  q.group('Cube', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Cube, 'size', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Cube') })
    g.slider(builderFunctionOptions.Cube, 'tesselation', { min: 0, max: 12, step: 1, onChange: () => buildMesh('Cube')})
    g.button('show', { onClick: () => buildMesh('Cube') })
  })

  q.group('Cylinder', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Cylinder, 'height', { min: 0, max: 2, step: 0.1, onChange: () => buildMesh('Cylinder') })
    g.slider(builderFunctionOptions.Cylinder, 'offset', { min: -1, max: 1, step: 0.1, onChange: () => buildMesh('Cylinder') })
    g.slider(builderFunctionOptions.Cylinder, 'radius', { min: 0, max: 1, step: 0.1, onChange: () => buildMesh('Cylinder') })
    g.slider(builderFunctionOptions.Cylinder, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Cylinder') })
    g.button('show', { onClick: () => buildMesh('Cylinder') })
  })

  q.group('Cone', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Cone, 'upperRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Cone') })
    g.slider(builderFunctionOptions.Cone, 'lowerRadius', { min: 0.0, max: 2, step: 0.1, onChange: () => buildMesh('Cone') })
    g.slider(builderFunctionOptions.Cone, 'height', { min: -1, max: 1, step: 0.1, onChange: () => buildMesh('Cone') })
    g.slider(builderFunctionOptions.Cone, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Cone') })
    g.button('show', { onClick: () => buildMesh('Cone') })
  })

  q.group('Disc', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Disc, 'innerRadius', { min: 0.0, max: 2, step: 0.1, onChange: () => buildMesh('Disc')})
    g.slider(builderFunctionOptions.Disc, 'outerRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Disc')})
    g.slider(builderFunctionOptions.Disc, 'offset', { min: -1, max: 1, step: 0.1, onChange: () => buildMesh('Disc')})
    g.slider(builderFunctionOptions.Disc, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Disc')})
    g.button('show', { onClick: () => buildMesh('Disc') })
  })

  q.group('Plane', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Plane, 'size', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Plane')})
    g.slider(builderFunctionOptions.Plane, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Plane')})
    g.button('show', { onClick: () => buildMesh('Plane') })
  })

  q.group('Sphere', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Sphere, 'radius', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Sphere')})
    g.slider(builderFunctionOptions.Sphere, 'tesselation', { min: 3, max: 32, step: 1, onChange: () => buildMesh('Sphere')})
    g.button('show', { onClick: () => buildMesh('Sphere') })
  })

  q.group('Octahedron', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Octahedron, 'radius', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Octahedron')})
    g.slider(builderFunctionOptions.Octahedron, 'tesselation', { min: 0, max: 5, step: 1, onChange: () => buildMesh('Octahedron')})
    g.button('show', { onClick: () => buildMesh('Octahedron') })
  })

  q.group('Icosahedron', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Icosahedron, 'radius', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Icosahedron')})
    g.slider(builderFunctionOptions.Icosahedron, 'tesselation', { min: 0, max: 5, step: 1, onChange: () => buildMesh('Icosahedron')})
    g.button('show', { onClick: () => buildMesh('Icosahedron') })
  })

  q.group('Torus', { open: true }, (g) => {
    g.slider(builderFunctionOptions.Torus, 'innerRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Torus')})
    g.slider(builderFunctionOptions.Torus, 'outerRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Torus')})
    g.slider(builderFunctionOptions.Torus, 'tesselation', { min: 3, max: 32, step: 1, onChange: () => buildMesh('Torus')})
    g.button('show', { onClick: () => buildMesh('Torus') })
  })
})

// Allocate state variables
let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()

// Begin render loop
loop(() => {

  // prepare render state
  device.resize()
  device.cullState = CullState.CullNone
  device.depthState = DepthState.Default
  device.clear(0xff222222, 1.0)

  // Skip rendering while the mesh has not been built
  if (mesh == null) {
    return
  }

  // Update World/View transforms
  world.initYawPitchRoll(meshRotation.yaw * Math.PI, meshRotation.pitch * Math.PI, meshRotation.roll * Math.PI)
  view.initTranslation(0, 0, -1.5)
  proj.initPerspectiveFieldOfView(Math.PI / 2, device.drawingBufferAspectRatio, 0.1, 10)

  // Set shader variables
  program.setUniform('texture', texture)
  program.setUniform('world', world)
  program.setUniform('view', view)
  program.setUniform('projection', proj)

  // Render the mesh
  mesh.draw(program)

  // Set shader variables
  linesProgram.setUniform('world', world)
  linesProgram.setUniform('view', view)
  linesProgram.setUniform('projection', proj)
  // Render the mesh
  linesMesh.draw(linesProgram)
})
