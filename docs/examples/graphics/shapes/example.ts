import { createDevice, cubeGeometry, basicProgram, planeGeometry, sphereGeometry, cylinderGeometry, BuildCubeOptions, BuildSphereOptions, BuildCylinderOptions } from '@gglib/graphics'
import { loop } from '@gglib/utils'
import { Mat4, DEGREE_TO_RAD } from '@gglib/math'
import * as TweakUi from 'tweak-ui'

export default (canvas: HTMLCanvasElement, tools: HTMLElement) => {
  const device = createDevice({
    canvas,
  })

  const world = Mat4.createIdentity()
  const view = Mat4.createIdentity()
  const projection = Mat4.createIdentity()
  const viewProjection = Mat4.createIdentity()

  const program = basicProgram(device)
  const texture = device.createTexture({
    image: {
      source: '/assets/textures/prototype/proto_red.png',
    }
  })
  let geometry = cubeGeometry(device, {
    size: 1,
  })

  TweakUi.mount(tools, (ui)=> {
    ui.collapsible('Cube', (g) => {
      const options: BuildCubeOptions = {
        size: 1,
        tesselation: 1
      }
      function update() {
        geometry.dispose()
        geometry = cubeGeometry(device, options)
      }
      g.slider(options, 'size', { min: 0, max: 2, step: 0.1, onInput: update })
      g.slider(options, 'tesselation', { min: 1, max: 64, step: 1, onInput: update })
    })

    ui.collapsible('Sphere', (g) => {

      const options: BuildSphereOptions = {
        radius: 0.5,
        tesselation: 8,
      }
      function update() {
        geometry.dispose()
        geometry = sphereGeometry(device, options)
      }
      g.slider(options, 'radius', { min: 0, max: 2, step: 0.1, onInput: update })
      g.slider(options, 'tesselation', { min: 1, max: 64, step: 1, onInput: update })
    })

    ui.collapsible('Cylinder', (g) => {
      const options: BuildCylinderOptions = {
        radius: 0.5,
        tesselation: 8,
      }
      function update() {
        geometry.dispose()
        geometry = cylinderGeometry(device, options)
      }
      g.slider(options, 'radius', { min: 0, max: 2, step: 0.1, onInput: update })
      g.slider(options, 'tesselation', { min: 1, max: 64, step: 1, onInput: update })
    })
  })

  function render(_, dt: number) {
    device.resize()
    device.clear(0xff2e2620, 1)
    if (!program.isReady) {
      // wait for shader compilation
      return
    }

    world.rotateY(10 * DEGREE_TO_RAD * dt / 1000)
    view.initTranslation(0, 0, -2)
    projection.initPerspectiveFieldOfView(60 * DEGREE_TO_RAD, device.canvas.width / device.canvas.height, 0.1, 100)
    Mat4.multiply(projection, view, viewProjection)

    program.setUniform('texture', texture)
    program.setUniform('world', world)
    program.setUniform('view', view)
    program.setUniform('projection', projection)
    geometry.draw(program)
  }

  return loop(render).stop
}
