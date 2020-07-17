import {
  CameraComponent,
  createGame,
  LightComponent,
  ModelComponent,
  PerspectiveCameraComponent,
  RendererComponent,
  TransformComponent,
  WebXRComponent,
} from '@gglib/components'

import { ContentManager } from '@gglib/content'
import { Entity, Inject, OnInit, OnUpdate, Component } from '@gglib/ecs'
import { Model, LightType } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import * as TweakUi from 'tweak-ui'

@Component({
  install: [
    WebXRComponent,
    RendererComponent,
  ]
})
class MyGame implements OnInit, OnUpdate {

  public name = 'MyGame'

  @Inject(WebXRComponent)
  public readonly xr: WebXRComponent

  @Inject(RendererComponent)
  public readonly renderer: RendererComponent

  @Inject(CameraComponent, { from: '/Camera' })
  public readonly camera: PerspectiveCameraComponent

  private refSpace: any

  public onInit() {
    const scene = this.renderer.scene
    scene.views.push({
      disabled: true,
      camera: {
        projection: Mat4.createIdentity(),
        view: Mat4.createIdentity(),
        viewProjection: Mat4.createIdentity(),
        world: Mat4.createIdentity()
      },
      viewport: { x: 0, y: 0, width: 1, height: 1 },

    })
    scene.views.push({
      disabled: true,
      camera: {
        projection: Mat4.createIdentity(),
        view: Mat4.createIdentity(),
        viewProjection: Mat4.createIdentity(),
        world: Mat4.createIdentity()
      },
      viewport: { x: 0, y: 0, width: 1, height: 1 }
    })
    scene.camera = this.camera

    this.xr.onSessionStart(async () => {
      TweakUi.redraw()
      this.refSpace = await this.xr.session.requestReferenceSpace('local')
    })
    this.xr.onSessionEnd(() => {
      this.refSpace = null
      TweakUi.redraw()
    })
    WebXRComponent.isSessionSupported('immersive-vr').then((supported) => {
      vrSupported = supported
      TweakUi.redraw()
    })

    const xr = this.xr
    let vrSupported = false
    TweakUi.build('#tweak-ui', (q) => {
      q.button('Enter VR', {
        get text() {
          return vrSupported ? !xr.session ? 'Enter VR' : 'Exit VR' : 'vr not supported'
        },
        set text(v: string) {
          //
        },
        get disabled() {
          return !vrSupported
        },
        set disabled(v: boolean) {
          //
        },
        onClick: () => {
          if (xr.session) {
            xr.session.end()
            return
          }
          xr.startSession('immersive-vr')
        }
      })
    })

  }

  public onUpdate() {
    const session = this.xr.session
    const scene = this.renderer.scene
    this.camera.aspect = scene.views[0].viewport.aspect
    if (session && this.refSpace) {
      scene.views[0].disabled = true
      scene.views[1].disabled = false
      scene.views[2].disabled = false
      const pose = this.xr.frame.getViewerPose(this.refSpace)
      this.xr.applyPoseToView(pose, scene.views[1], scene.views[2])
    } else {
      scene.views[0].disabled = false
      scene.views[1].disabled = true
      scene.views[2].disabled = true
    }
  }
}

@Component({
  install: [
    ModelComponent,
    TransformComponent,
  ]
})
class CubeComponent implements OnInit, OnUpdate {

  public name = 'Cube'

  @Inject(ModelComponent)
  public renderable: ModelComponent

  @Inject(TransformComponent)
  public transform: TransformComponent

  @Inject(ContentManager, { from: 'root' })
  public content: ContentManager

  public async onInit() {
    this.renderable.model = await this.content.load('/assets/models/obj/cube.obj', Model)
  }

  public onUpdate(dt: number) {
    this.transform.rotateAxisAngle(0, 1, 0, dt / 2000)
  }
}

function buildCube(e: Entity, x: number, y: number, z: number) {
  e.install(ModelComponent)
  e.install(CubeComponent)
  e.get(TransformComponent).setPosition(x, y, z)
  return e
}

createGame({
  device: { canvas: document.getElementById('canvas') as HTMLCanvasElement, contextAttributes: {
    xrCompatible: true
  } as any },
  autorun: true,
}, (e) => {
  e.install(MyGame)
})
.createChild((e) => {
  e.name = 'Camera'
  e.install(PerspectiveCameraComponent)
})
.createChild((e) => {
  e.name = 'Light'
  e.install(LightComponent, { type: LightType.Directional })
  e.get(TransformComponent).setRotationAxisAngle(1, 0, 0, -1)
})
.createChild((e) => {
  buildCube(e, 0, 0, -10)
  e.createChild((e) => {
    buildCube(e, 0, 3, 0)
    e.createChild((e) => {
      buildCube(e, 0, 3, 0)
    })
  })

  e.createChild((e) => {
    buildCube(e, 0, -3, 0)
    e.createChild((e) => {
      buildCube(e, 0, -3, 0)
    })
  })

  e.createChild((e) => buildCube(e, 3, 0, 0))
  e.createChild((e) => buildCube(e, -3, 0, 0))
})
