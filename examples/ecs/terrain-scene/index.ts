// tslint:disable:max-classes-per-file

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
  ModelComponent,
  OnAdded,
  OnInit,
  OnRemoved,
  OnUpdate,
  TransformComponent,
} from '@gglib/ecs'

import { ContentManager } from '@gglib/content'
import { AutoMaterial, TerrainMaterial } from '@gglib/effects'
import { buildSphere, Device, flipWindingOrder, ModelBuilder, Texture } from '@gglib/graphics'
import { BTTRoot, HeightMap } from '@gglib/terrain'
import * as TweakUi from 'tweak-ui'

class SkyComponent implements OnAdded, OnRemoved, OnInit, OnUpdate {

  public name = 'Sky'
  public entity: Entity
  public transform: TransformComponent
  public renderable: ModelComponent

  public onAdded(entity: Entity) {
    this.entity = entity
    entity.root.addService(SkyComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.root.removeService(SkyComponent)
    this.entity = null
  }

  public onInit(entity: Entity) {

    const device = entity.root.getService(Device)

    this.transform = entity.getService(TransformComponent)
    this.renderable = entity.getService(ModelComponent)

    entity.root.getService(ContentManager).load('/assets/textures/Grey_Sky.png', Texture).then((texture) => {

      const material = new AutoMaterial(device)
      material.DiffuseMap = texture
      material.ShadeFunction = 'shadeNone'
      material.LightCount = 0

      this.renderable.model = ModelBuilder.begin()
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
    const camera = this.entity.root.children.find((it) => it.name === 'Camera')
    this.transform.setPosition(camera.getService(TransformComponent).position)
    this.transform.setScaleUniform(camera.getService(CameraComponent).far - 1)
  }
}

class TerrainComponent implements OnAdded, OnRemoved, OnInit, OnUpdate {

  public name = 'Terrain'
  public entity: Entity

  public heightmap: HeightMap = null
  public transform: TransformComponent
  public renderable: ModelComponent
  public bttRoot: BTTRoot

  public onAdded(entity: Entity) {
    this.entity = entity
    entity.root.addService(TerrainComponent, this)
  }

  public onRemoved(entity: Entity) {
    entity.root.removeService(TerrainComponent)
    this.entity = null
  }

  public onInit(entity: Entity) {

    const device = entity.root.getService(Device)

    this.transform = entity.getService(TransformComponent)
    this.renderable = entity.getService(ModelComponent)

    entity.root.getService(ContentManager).loadBatch({
      heightmap: ['/assets/heightmaps/heightmap1.png', Image],
    }).then((res) => {

      const heightmap = HeightMap.fromImage(res.heightmap).smooth().calculateNormals()
      const material = new TerrainMaterial(device)
      material.SplatMap = device.createTexture({ data: '/assets/heightmaps/heightmap1-splat.png' })
      material.DiffuseMap = device.createTexture({ data: '/assets/textures/terrain/grass.jpg' })
      material.DiffuseMapR = device.createTexture({ data: '/assets/textures/terrain/mud.jpg' })
      material.DiffuseMapG = device.createTexture({ data: '/assets/textures/terrain/earth.jpg' })
      material.DiffuseMapB = device.createTexture({ data: '/assets/textures/terrain/dirt.jpg' })
      material.DiffuseMapSlope = device.createTexture({ data: '/assets/textures/terrain/rock2.jpg' })

      material.FogStart = 0
      material.FogEnd = 100
      material.FogColor = [1, 1, 1]
      // material.NormalMap = device.createTexture({ data: '/assets/textures/prototype/proto_gray_n.png' })
      // material.NormalMapA = material.NormalMap
      // material.NormalMapR = material.NormalMap
      // material.NormalMapG = material.NormalMap
      // material.NormalMapB = material.NormalMap
      // material.NormalMapSlope = material.NormalMap

      material.ShadeFunction = 'shadeOptimized'
      material.LightCount = 0

      this.bttRoot = new BTTRoot(device, {
        heightMap: heightmap,
        materials: [material],
      })
      this.renderable.model = this.bttRoot.model

      material.parameters.Tiling = 32
      material.parameters.Brightness = 1
      material.parameters.Saturation = 1
      material.parameters.Pertubation = 0.25
      material.parameters.SlopeStrength = 1

      TweakUi.build('#tweak-ui', (q) => {
        q.slider(material.parameters, 'Tiling', { min: 1, max: 128, step: 1 })
        q.slider(material.parameters, 'Brightness', { min: 0.1, max: 2, step: 0.01 })
        q.slider(material.parameters, 'Saturation', { min: 0.1, max: 2, step: 0.01 })
        q.slider(material.parameters, 'Pertubation', { min: 0.1, max: 2, step: 0.01 })
        q.slider(material.parameters, 'SlopeStrength', { min: 0.1, max: 1, step: 0.01 })
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

// class BillboardComponent {

//   public enable = true
//   public visible = true
//   public entity: Entity

//   public setup() {
//     // listen to event when terrain is loaded and only then load own content
//     this.entity.find('/Terrain').once('terrain-loaded', () => {
//       this.loadContent()
//     })
//   }

//   public loadContent() {
//     this.entity.root.getService('Assets').loadBatch({
//       material: ['/assets/materials/billboard.ggmat', Material],
//       texture: ['/assets/textures/billboard_tree.png', Image],
//     }).then((res) => {
//       // find the terrain component
//       const terrain: TerrainComponent = this.entity.find('/*:TerrainComponent')
//       const material = res.material
//       const image = res.texture
//       const builder = new ModelBuilder()

//       const w = terrain.bttRoot.heightMap.width
//       const h = terrain.bttRoot.heightMap.height
//       for (let i = 0; i < 1000; i++) {
//         const x = Math.floor(Math.random() * w)
//         const z = Math.floor(Math.random() * h)
//         const y = terrain.bttRoot.heightMap.heightAt(x, z)
//         builder.addVertex({ position: [x, y, z], texture: [0, 0] })
//         builder.addVertex({ position: [x, y, z], texture: [1, 0] })
//         builder.addVertex({ position: [x, y, z], texture: [0, 1] })
//         builder.addVertex({ position: [x, y, z], texture: [1, 1] })
//         builder.addIndex(i * 4 + 0)
//         builder.addIndex(i * 4 + 1)
//         builder.addIndex(i * 4 + 2)
//         builder.addIndex(i * 4 + 1)
//         builder.addIndex(i * 4 + 3)
//         builder.addIndex(i * 4 + 2)
//       }

//       const device = this.entity.root.getService('Device')
//       this.entity.getService('Renderable').model = builder.endModel(device, {
//         materials: [material],
//       })
//     })
//   }
// }

const game = createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
  autorun: true,
}, addBasicRenderer)
.createChild(addCamera, addWASD, (e) => {
  e.name = 'Camera'
  e.getService(CameraComponent).activate()
  e.getService(TransformComponent).translateXYZ(0, 256, 0)
})
.createChild(addTransform, addDirectionalLight, (e) => {
  e.name = 'Light'
  e.getService(TransformComponent).rotateYawPitchRoll(0, -Math.PI / 2, 0)
})
.createChild(addModel, (e) => {
  e.name = 'Sky'
  e.addComponent(new SkyComponent())
})
.createChild(addModel, (e) => {
  e.name = 'Terrain'
  e.addComponent(new TerrainComponent())
})
// .buildEntity(['Model'], (e) => {
//   e.name = 'Trees'
//   e.addComponent(new BillboardComponent())
// })
