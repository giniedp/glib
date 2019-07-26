// # Terrain Scene
//
// ---
//

import {
  addBasicRenderer,
  addCamera,
  addDirectionalLight,
  addModel,
  addTransform,
  addWASD,
  CameraComponent,
  createGame,
  Entity,
  Inject,
  ModelComponent,
  OnAdded,
  OnInit,
  OnRemoved,
  OnUpdate,
  PerspectiveCameraComponent,
  RendererComponent,
  Service,
  TimeComponent,
  TransformComponent,
} from '@gglib/ecs'

import { ContentManager } from '@gglib/content'
import { AutoMaterial, TerrainMaterial } from '@gglib/effects'
import { buildSphere, Device, flipWindingOrder, ModelBuilder, Texture } from '@gglib/graphics'
import { Vec3 } from '@gglib/math'
import { BTTRoot, HeightMap } from '@gglib/terrain'
import * as TweakUi from 'tweak-ui'

class MyGame implements OnInit, OnUpdate {
  public name = 'MyGame'

  @Inject(Entity)
  public entity: Entity

  @Inject(RendererComponent)
  public renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  private camera: PerspectiveCameraComponent

  public onInit() {
    const scene = this.renderer.manager.scenes.get(0)
    scene.camera = this.camera
  }

  public onUpdate() {
    const scene = this.renderer.manager.scenes.get(0)
    this.camera.aspect = scene.viewport.aspect
  }
}

// tslint:disable-next-line: max-classes-per-file
class SkyComponent implements OnAdded, OnRemoved, OnInit, OnUpdate {

  public name = 'Sky'
  public entity: Entity
  public time: TimeComponent
  public transform: TransformComponent

  public onAdded(e: Entity) {
    this.entity = e
    e.root.addService(SkyComponent, this)
  }

  public onRemoved(e: Entity) {
    e.root.removeService(SkyComponent)
    this.entity = null
  }

  public onInit(entity: Entity) {
    this.time = entity.root.getService(TimeComponent)
    this.transform = entity.getService(TransformComponent)

    const device = entity.root.getService(Device)
    const content = entity.root.getService(ContentManager)
    const renderable = entity.getService(ModelComponent)

    content.load('/assets/textures/Grey_Sky.png', Texture).then((texture) => {

      const material = new AutoMaterial(device)
      material.DiffuseMap = texture
      material.ShadeFunction = 'shadeNone'
      material.LightCount = 0

      renderable.model = ModelBuilder.begin()
        .tap((b) => {
          buildSphere(b, {
            radius: 1,
            tesselation: 32,
          })
          flipWindingOrder(b.indices)
        })
        .endModel(device, {
          materials: [material],
        })
    })
  }

  public onUpdate() {
    const camera = this.entity.find('/Camera')
    this.transform.setPosition(camera.getService(TransformComponent).position)
    this.transform.setScaleUniform(camera.getService<PerspectiveCameraComponent>(CameraComponent).far - 1)
    this.transform.setRotationXYZAngle(0, 1, 0, Math.PI / 180 * this.time.gameTimeTotalMs / 1000)
  }
}

// tslint:disable-next-line: max-classes-per-file
@Service({ on: 'root' })
class TerrainComponent implements OnInit, OnUpdate {

  public name = 'Terrain'

  @Inject(Device, { from: 'root' })
  public device: Device

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  @Inject(Entity)
  public entity: Entity

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(ModelComponent)
  public renderable: ModelComponent

  public bttRoot: BTTRoot
  public heightmap: HeightMap = null

  public onInit() {

    const device = this.device
    this.content.loadBatch({
      heightmap: ['/assets/heightmaps/heightmap_rgb.png', Image],
    }).then((res) => {

      const heightmap = HeightMap.fromImage(res.heightmap).rescale(0.8).smooth().calculateNormals()
      this.heightmap = heightmap

      const material = new TerrainMaterial(device)
      material.SplatMap = device.createTexture({ data: '/assets/heightmaps/heightmap_flow.png' })
      material.DiffuseMap = device.createTexture({ data: '/assets/textures/terrain/savanna_green_d.jpg' })
      material.DiffuseMapR = device.createTexture({ data: '/assets/textures/terrain/ground_dry_d.jpg' })
      material.DiffuseMapG = device.createTexture({ data: '/assets/textures/terrain/ground_mud_d.jpg' })
      material.DiffuseMapB = device.createTexture({ data: '/assets/textures/terrain/savanna_green_d.jpg' })
      // material.DiffuseMapSlope = device.createTexture({ data: '/assets/textures/terrain/adesert_mntn4_d.jpg' })

      material.NormalMap = device.createTexture({ data: '/assets/textures/terrain/savanna_green_n.jpg' })
      material.NormalMapR = device.createTexture({ data: '/assets/textures/terrain/ground_dry_n.jpg' })
      material.NormalMapG = device.createTexture({ data: '/assets/textures/terrain/ground_mud_n.jpg' })
      material.NormalMapB = device.createTexture({ data: '/assets/textures/terrain/savanna_green_n.jpg' })

      material.AmbientColor = [0.1, 0.1, 0.1]

      material.FogType = 2
      material.FogStart = 0
      material.FogEnd = 500
      material.FogColor = [1, 1, 1]
      material.FogDensity = 0.003

      material.ShadeFunction = 'shadeOptimized'
      material.LightCount = 1

      this.bttRoot = new BTTRoot(device, {
        heightMap: heightmap,
        materials: [material],
      })
      this.renderable.model = this.bttRoot.model

      material.parameters.Tiling = 32
      material.parameters.Brightness = 1.5
      material.parameters.Saturation = 1.5
      material.parameters.Perturbation = 0.25
      material.parameters.SlopeStrength = 1

      document.querySelector('#tweak-ui').addEventListener('mousemove', (e) => {
        // e.stopPropagation()
      })
      TweakUi.build('#tweak-ui', (q) => {
        q.group('Fog', (f) => {
          f.color(material, 'FogColor', { format: '[n]rgb' })
          f.slider(material, 'FogStart', { min: 0, max: 1000, step: 0.5 })
          f.slider(material, 'FogEnd', { min: 0, max: 1000, step: 0.5 })
          f.slider(material, 'FogDensity', { min: 0, max: 0.1, step: 0.0001 })
          f.select(material, 'FogType', {
            options: [
              { id: 'off', label: 'Off', value: 0 },
              { id: 'exp', label: 'Exp', value: 1 },
              { id: 'exp2', label: 'Exp2', value: 2 },
              { id: 'linear', label: 'Linear', value: 3 },
            ],
          })
        })
        // q.group('Light', (l) => {
        //   l.color(material, 'AmbientColor', { format: '[n]rgb' })
        //   let angle = -1
        //   l.add({
        //     type: 'slider',
        //     label: 'Angle',
        //     get value() {
        //       return angle
        //     },
        //     set value(v) {
        //       angle = v
        //     },
        //     onInput: () => {
        //       const e = this.entity.root.find('/Light') as Entity
        //       e.getService(TransformComponent).setRotationXYZAngle(1, 0, 0, angle)
        //     },
        //     min: -Math.PI,
        //     max: Math.PI,
        //     step: 0.01,
        //   })
        // })
        q.group('Terrain', (t) => {
          t.slider(material, 'Tiling', { min: 1, max: 128, step: 1 })
          t.slider(material, 'Brightness', { min: 0.1, max: 2, step: 0.01 })
          t.slider(material, 'Saturation', { min: 0.1, max: 2, step: 0.01 })
          t.slider(material, 'Perturbation', { min: 0.1, max: 2, step: 0.01 })
          t.slider(material, 'SlopeStrength', { min: 0.1, max: 1, step: 0.01 })
        })
      })

      // notify that the terrain is loaded and the heightmap is available
      this.entity.trigger('terrain-loaded')
    })
  }

  public onUpdate() {
    const terrain = this.bttRoot
    if (terrain) {
      const camera = this.entity.find('/Camera') as Entity
      const camPosition = camera.getService(TransformComponent).position
      this.bttRoot.updateLod(camPosition)
    }
  }
}

const game = createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, (e) => {
  e.name = 'Root'
  addBasicRenderer(e)
  e.addComponent(new MyGame())
})
.createChild(addCamera, addWASD, (e) => {
  e.name = 'Camera'
  e.getService(TransformComponent)
    .setPositionXYZ(512, 256, 512)
    .lookAt(Vec3.Zero)
})
.createChild(addTransform, addDirectionalLight, (e) => {
  e.name = 'Light'
  e.getService(TransformComponent).setRotationXYZAngle(1, 0, 0, -1)
})
.createChild(addModel, (e) => {
  e.name = 'Sky'
  e.addComponent(new SkyComponent())
})
.createChild(addModel, (e) => {
  e.name = 'Terrain'
  e.addComponent(new TerrainComponent())
})
