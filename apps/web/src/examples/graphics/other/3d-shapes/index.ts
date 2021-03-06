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
  source: '/assets/textures/uvgrids/UV_Grid_Sm.jpg',
})

// The mesh variable. It will be rendered once it has been built.
let mesh: ModelMeshPart = null
let linesMesh: ModelMeshPart = null

// The mesh rotation state
const meshRotation = {
  update: {
    dx: 0,
    dy: 0,
  }
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
  mesh = ModelBuilder
    .begin()
    .append(builderFunctions[name], builderFunctionOptions[name])
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
TweakUi.mount('#tweak-ui', (ui) => {
  buildMesh('Cube')

  ui.collapsible('Rotation', () => {
    ui.point(meshRotation, 'update', {
      label: '',
      keys: ['dx', 'dy'],
      xRange: [-1, 1],
      yRange: [-1, 1],
      reset: [0, 0]
    })
  })
  ui.accordion(() => {
    ui.group('Cube', () => {
      ui.slider(builderFunctionOptions.Cube, 'size', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Cube') })
      ui.slider(builderFunctionOptions.Cube, 'tesselation', { min: 0, max: 12, step: 1, onChange: () => buildMesh('Cube')})
      ui.button('Show', { onClick: () => buildMesh('Cube') })
    })

    ui.group('Cylinder', () => {
      ui.slider(builderFunctionOptions.Cylinder, 'height', { min: 0, max: 2, step: 0.1, onChange: () => buildMesh('Cylinder') })
      ui.slider(builderFunctionOptions.Cylinder, 'offset', { min: -1, max: 1, step: 0.1, onChange: () => buildMesh('Cylinder') })
      ui.slider(builderFunctionOptions.Cylinder, 'radius', { min: 0, max: 1, step: 0.1, onChange: () => buildMesh('Cylinder') })
      ui.slider(builderFunctionOptions.Cylinder, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Cylinder') })
      ui.button('Show', { onClick: () => buildMesh('Cylinder') })
    })

    ui.group('Cone', () => {
      ui.slider(builderFunctionOptions.Cone, 'upperRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Cone') })
      ui.slider(builderFunctionOptions.Cone, 'lowerRadius', { min: 0.0, max: 2, step: 0.1, onChange: () => buildMesh('Cone') })
      ui.slider(builderFunctionOptions.Cone, 'height', { min: -1, max: 1, step: 0.1, onChange: () => buildMesh('Cone') })
      ui.slider(builderFunctionOptions.Cone, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Cone') })
      ui.button('Show', { onClick: () => buildMesh('Cone') })
    })

    ui.group('Disc', () => {
      ui.slider(builderFunctionOptions.Disc, 'innerRadius', { min: 0.0, max: 2, step: 0.1, onChange: () => buildMesh('Disc')})
      ui.slider(builderFunctionOptions.Disc, 'outerRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Disc')})
      ui.slider(builderFunctionOptions.Disc, 'offset', { min: -1, max: 1, step: 0.1, onChange: () => buildMesh('Disc')})
      ui.slider(builderFunctionOptions.Disc, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Disc')})
      ui.button('Show', { onClick: () => buildMesh('Disc') })
    })

    ui.group('Plane', () => {
      ui.slider(builderFunctionOptions.Plane, 'size', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Plane')})
      ui.slider(builderFunctionOptions.Plane, 'tesselation', { min: 1, max: 32, step: 1, onChange: () => buildMesh('Plane')})
      ui.button('Show', { onClick: () => buildMesh('Plane') })
    })

    ui.group('Sphere', () => {
      ui.slider(builderFunctionOptions.Sphere, 'radius', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Sphere')})
      ui.slider(builderFunctionOptions.Sphere, 'tesselation', { min: 3, max: 32, step: 1, onChange: () => buildMesh('Sphere')})
      ui.button('Show', { onClick: () => buildMesh('Sphere') })
    })

    ui.group('Octahedron', () => {
      ui.slider(builderFunctionOptions.Octahedron, 'radius', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Octahedron')})
      ui.slider(builderFunctionOptions.Octahedron, 'tesselation', { min: 0, max: 5, step: 1, onChange: () => buildMesh('Octahedron')})
      ui.button('Show', { onClick: () => buildMesh('Octahedron') })
    })

    ui.group('Icosahedron', () => {
      ui.slider(builderFunctionOptions.Icosahedron, 'radius', { min: 0.5, max: 2, step: 0.1, onChange: () => buildMesh('Icosahedron')})
      ui.slider(builderFunctionOptions.Icosahedron, 'tesselation', { min: 0, max: 5, step: 1, onChange: () => buildMesh('Icosahedron')})
      ui.button('Show', { onClick: () => buildMesh('Icosahedron') })
    })

    ui.group('Torus', () => {
      ui.slider(builderFunctionOptions.Torus, 'innerRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Torus')})
      ui.slider(builderFunctionOptions.Torus, 'outerRadius', { min: 0.1, max: 2, step: 0.1, onChange: () => buildMesh('Torus')})
      ui.slider(builderFunctionOptions.Torus, 'tesselation', { min: 3, max: 32, step: 1, onChange: () => buildMesh('Torus')})
      ui.button('Show', { onClick: () => buildMesh('Torus') })
    })
  })

})

// Allocate state variables
let world = Mat4.createIdentity()
let view = Mat4.createIdentity()
let proj = Mat4.createIdentity()

// Begin render loop
loop((time, dt) => {

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
  world.preRotateX(meshRotation.update.dy * dt * 0.001)
  world.preRotateY(meshRotation.update.dx * dt * 0.001)
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
