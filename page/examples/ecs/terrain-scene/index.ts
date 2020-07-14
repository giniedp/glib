import {
  CameraComponent,
  createGame,
  KeyboardComponent,
  LightComponent,
  MeshComponent,
  OccTree,
  PerspectiveCameraComponent,
  RendererComponent,
  SpatialCullVisitor,
  SpatialSystemComponent,
  TimeComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/components'

import { Entity, Inject, OnInit, OnUpdate, Service } from '@gglib/ecs'

import { ContentManager } from '@gglib/content'
import { AutoMaterial, TerrainMaterial } from '@gglib/effects'
import { buildSphere, Device, flipWindingOrder, ModelBuilder, Texture } from '@gglib/graphics'
import { Vec3 } from '@gglib/math'
import { BasicRenderStep } from '@gglib/render'
import { BTTRoot, HeightMap } from '@gglib/terrain'
import * as TweakUi from 'tweak-ui'

class MyGame implements OnInit, OnUpdate {
  public name = 'MyGame'

  @Inject(Entity)
  public entity: Entity

  @Inject(RendererComponent)
  public renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  private camera1: PerspectiveCameraComponent

  @Inject(CameraComponent, { from: '/Camera2' })
  private camera2: PerspectiveCameraComponent

  public onInit() {
    this.renderer.scene.views = [
      {
        camera: this.camera1,
        viewport: { type: 'normalized', x: 0.0, y: 0.0, width: 1, height: 1 },
      }, {
        camera: this.camera2,
        viewport: { type: 'normalized', x: 0.75, y: 0.0, width: 0.25, height: 0.25 },
      }
    ]
  }

  public onUpdate() {
    this.camera1.aspect = this.renderer.scene.views[0].viewport.aspect
    this.camera2.aspect = this.renderer.scene.views[1].viewport.aspect
  }
}

@Service()
class SkyComponent implements OnInit, OnUpdate {

  public name = 'Sky'

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(MeshComponent)
  public renderable: MeshComponent

  @Inject(Device, { from: 'root' })
  public device: Device

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  @Inject(TimeComponent, { from: 'root' })
  public time: TimeComponent

  @Inject(CameraComponent, { from: '/Camera' })
  public camera: PerspectiveCameraComponent

  public onInit() {
    this.content.load('/assets/textures/Grey_Sky.png', Texture.Texture2D).then((texture) => {
      const material = new AutoMaterial(this.device)
      material.DiffuseMap = texture
      material.ShadeFunction = 'shadeNone'
      material.LightCount = 0

      this.renderable.material = material
      this.renderable.mesh = ModelBuilder.begin()
        .tap((b) => {
          buildSphere(b, { radius: 1, tesselation: 32 })
          b.calculateBoundings()
          flipWindingOrder(b.indices)
        })
        .endMesh(this.device)
    })
  }

  public onUpdate() {
    const camera = this.camera
    this.transform.setPositionV(camera.world.getTranslation())
    this.transform.setScaleUniform(camera.far - 1)
    this.transform.setRotationAxisAngle(0, 1, 0, Math.PI / 180 * this.time.game.totalMs / 1000)
  }
}

@Service({ on: 'root' })
class TerrainComponent implements OnInit, OnUpdate {

  public name = 'Terrain'

  @Inject(Device, { from: 'root' })
  public device: Device

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  @Inject(Entity)
  public entity: Entity

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
      /* material.DiffuseMapSlope = device.createTexture({ data: '/assets/textures/terrain/adesert_mntn4_d.jpg' }) */

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

      this.bttRoot.model.meshes.forEach((mesh) => {
        this.entity.createChild((e) => {
          MeshComponent.ensure(e)
          const mc = e.getService(MeshComponent)
          mc.mesh = mesh
          mc.material = material
        })
      })

      material.parameters.Tiling = 32
      material.parameters.Brightness = 1.5
      material.parameters.Saturation = 1.5
      material.parameters.Perturbation = 0.25
      material.parameters.SlopeStrength = 1

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
        q.group('Terrain', (t) => {
          t.slider(material, 'Tiling', { min: 1, max: 128, step: 1 })
          t.slider(material, 'Brightness', { min: 0.1, max: 2, step: 0.01 })
          t.slider(material, 'Saturation', { min: 0.1, max: 2, step: 0.01 })
          t.slider(material, 'Perturbation', { min: 0.1, max: 2, step: 0.01 })
          t.slider(material, 'SlopeStrength', { min: 0.1, max: 1, step: 0.01 })
        })
      })

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

createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, (e) => {
  e.name = 'Root'
  e.addComponent(new KeyboardComponent())
  e.addComponent(new SpatialSystemComponent({
    system: OccTree.create(Vec3.create(-1024, -1024, -1024), Vec3.create(1024, 1024, 1024), 6),
  }))
  e.addComponent(new RendererComponent({
    cullVisitor: new SpatialCullVisitor(),
  }))
  e.addComponent(new MyGame())
})
  .createChild((e) => {
    e.name = 'Camera'
    PerspectiveCameraComponent.ensure(e)
    WASDComponent.ensure(e)
    e.getService(TransformComponent)
      .setPosition(512, 256, 512)
      .lookAt(Vec3.Zero)

  })
  .createChild((e) => {
    e.name = 'Camera2'
    PerspectiveCameraComponent.ensure(e)
    e.getService(TransformComponent)
      .setPosition(512, 256, 1024)
      .lookAt(Vec3.Zero)
  })
  .createChild((e) => {
    e.name = 'Light'
    LightComponent.addDirectionalLight(e)
    e.getService(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
  })
  .createChild((e) => {
    e.name = 'Sky'
    MeshComponent.ensure(e)
    e.addComponent(new SkyComponent())
  })
  .createChild((e) => {
    e.name = 'Terrain'
    e.addComponent(new TerrainComponent())
  })
