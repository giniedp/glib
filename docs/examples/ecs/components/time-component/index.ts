import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererSystem,
  TimeComponent,
  TransformComponent,
  WASDComponent,
} from '@gglib/ecs-components'

import { ContentManager } from '@gglib/content'
import { Component, Entity, Inject, OnAdded, OnInit, OnSetup, OnUpdate } from '@gglib/ecs'
import { Color, LightType, Model } from '@gglib/graphics'
import { BasicRenderPass } from '@gglib/render'
import * as TweakUi from 'tweak-ui'

@Component({
  install: [RendererSystem],
})
class MyGame implements OnAdded, OnInit, OnUpdate {
  @Inject(RendererSystem)
  public readonly renderer: RendererSystem

  @Inject(CameraComponent, { from: '/Camera' })
  public readonly camera: PerspectiveCameraComponent

  @Inject(TimeComponent, { from: 'root' })
  public readonly time: TimeComponent

  public onAdded(entity: Entity) {
    entity
      .createChild((e) => {
        e.name = 'Camera'
        e.install(PerspectiveCameraComponent)
        e.install(WASDComponent)
        e.install(LightComponent, { type: LightType.Directional })
      })
      .createChild((e) => {
        e.name = 'Cube1'
        e.install(ModelComponent)
        e.install(CubeComponent, { timeKey: 'time1' })
        e.get(TransformComponent).translate(-2, 0, -5)
      })
      .createChild((e) => {
        e.name = 'Cube2'
        e.install(ModelComponent)
        e.install(CubeComponent, { timeKey: 'time2' })
        e.get(TransformComponent).translate(2, 0, -5)
      })
  }

  public onInit() {
    this.renderer.scene.camera = this.camera
    const step = this.renderer.scene.steps[0] as BasicRenderPass
    step.clearColor = Color.CornflowerBlue.rgba

    this.time.getOrCreate('time1')
    this.time.getOrCreate('time2')
  }

  public onUpdate() {
    this.camera.aspect = this.renderer.view.viewport.aspect
  }
}

@Component({
  install: [ModelComponent, TransformComponent],
})
class CubeComponent implements OnInit, OnUpdate, OnSetup<{ timeKey: string }> {
  @Inject(TimeComponent, { from: 'root' })
  public readonly time: TimeComponent

  @Inject(ContentManager, { from: 'root' })
  public readonly content: ContentManager

  @Inject(ModelComponent)
  public readonly model: ModelComponent

  @Inject(TransformComponent)
  public readonly transform: TransformComponent

  private timeKey: string

  public onSetup(options?: { timeKey: string }) {
    this.timeKey = options?.timeKey ?? this.timeKey
  }

  public async onInit() {
    this.model.model = await this.content.load('/assets/models/obj/cube.obj', Model)
  }

  public onUpdate() {
    const dt = this.time.getOrCreate(this.timeKey).elapsedMs
    this.transform.rotateYawPitchRoll(dt / 2000, dt / 4000, dt / 8000)
  }
}

const game = createGame(
  {
    device: { canvas: document.getElementById('canvas') as HTMLCanvasElement },
    autorun: true,
  },
  (e) => {
    e.name = 'Root'
    e.install(MyGame)
  },
)

TweakUi.mount('#tweak-ui', (ui) => {
  ui.group('Time 1', () => {
    const t = game.get(TimeComponent).getOrCreate('time1')
    ui.slider(t, 'factor', { min: -10, max: 10, step: 0.1 })
  })
  ui.group('Time 2', () => {
    const t = game.get(TimeComponent).getOrCreate('time2')
    ui.slider(t, 'factor', { min: -10, max: 10, step: 0.1 })
  })
})
