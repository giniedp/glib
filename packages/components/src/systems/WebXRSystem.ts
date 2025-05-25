import { GameProvider, GameSystem } from '@gglib/ecs'
import { Device, DeviceGL, FrameBufferGL } from '@gglib/graphics'
import { Mat4 } from '@gglib/math'
import { SceneView, ViewportArea } from '@gglib/render'
import { simpleObservable } from '@gglib/utils'
import { GameLoop } from '../systems/GameLoop'

function isSupported() {
  return 'xr' in navigator
}

function isSessionSupported(mode: XRSessionMode) {
  const xr = navigator['xr'] as XR
  return Promise.resolve(xr?.isSessionSupported(mode) || false)
}

async function requestSession(mode: XRSessionMode, options?: any): Promise<XRSession> {
  const xr = navigator['xr'] as XR
  return Promise.resolve(() => {
    return isSessionSupported(mode)
  }).then((supported) => {
    if (supported) {
      return xr.requestSession(mode, options)
    }
  })
}

export class WebXRSystem implements GameSystem {
  public static readonly isSupported = isSupported
  public static readonly isSessionSupported = isSessionSupported
  public static readonly requestSession = requestSession

  public looper: GameLoop
  public device: DeviceGL

  public get session() {
    return this.xrSession
  }

  public get frame() {
    return this.xrFrame
  }

  private xrSession: XRSession
  private xrFrame: XRFrame

  public readonly onSessionStart = simpleObservable<XRSession>()
  public readonly onSessionEnd = simpleObservable<XRSession>()

  public initialize(container: GameProvider): void {
    this.looper = container.get(GameLoop)
    this.device = container.get(Device) as DeviceGL
    if (!(this.device instanceof DeviceGL)) {
      throw new Error('WebXRSystem requires a WebGL device')
    }
  }

  public destroy(): void {
    //
  }

  public async startSession(mode: XRSessionMode, options?: any) {
    return Promise.resolve()
      .then(() => this.xrSession?.end())
      .then(() => isSessionSupported(mode))
      .then((supported) => {
        if (supported) {
          return WebXRSystem.requestSession(mode, options)
        }
      })
      .then((session) => {
        if (session) {
          this.onSessionStarted(session)
        }
      })
  }

  public applyPoseToView(pose: XRViewerPose, ...views: SceneView[]) {
    for (let i = 0; i < pose.views.length; i++) {
      const poseView = pose.views[i]
      const view = views[i]
      if (!view) {
        continue
      }
      const vp = this.session.renderState.baseLayer.getViewport(poseView)
      Object.assign<ViewportArea, Partial<ViewportArea>>(view.viewport, {
        x: vp.x,
        y: vp.y,
        width: vp.width,
        height: vp.height,
      })

      if (!view.camera) {
        view.camera = {
          world: Mat4.createIdentity(),
          view: Mat4.createIdentity(),
          projection: Mat4.createIdentity(),
        }
      }

      view.camera.projection.initFromArray(poseView.projectionMatrix)
      view.camera.world.initFromArray(poseView.transform.matrix)
      view.camera.view.initFromArray(poseView.transform.inverse.matrix)
    }
  }

  private onSessionStarted(session: XRSession) {
    this.xrSession = session
    this.session.addEventListener('end', () => this.onSessionEnded(session))
    session.updateRenderState({
      baseLayer: new XRWebGLLayer(session, this.device.context),
    })
    session.requestReferenceSpace('viewer').then((refSpace) => {
      this.onSessionStart.notify(session)
      this.installAnimationFrame(session)
    })
  }

  private onSessionEnded(session: XRSession) {
    this.xrSession = null
    this.uninstallBackbuffer(session)
    this.looper.uninstallAnimationFrame()
    this.onSessionEnd.notify(session)
  }

  private installAnimationFrame(session: XRSession) {
    this.looper.installAnimationFrame({
      cancelAnimationFrame: (handle: number) => session.cancelAnimationFrame(handle),
      requestAnimationFrame: (fn: FrameRequestCallback) => {
        return session.requestAnimationFrame((time: number, frame: XRFrame) => {
          this.xrFrame = frame
          this.installBackbuffer(session)
          return fn(time)
        })
      },
    })
  }

  private installBackbuffer(session: XRSession) {
    const frameBuffer = session.renderState.baseLayer.framebuffer
    if (frameBuffer != null && !this.device.backBuffer) {
      this.device.backBuffer = new FrameBufferGL(this.device, {
        resource: frameBuffer,
      })
    }
  }

  private uninstallBackbuffer(session: XRSession) {
    const frameBuffer = session.renderState.baseLayer.framebuffer
    if (frameBuffer != null && this.device.backBuffer?.resource === frameBuffer) {
      const buffer = this.device.backBuffer
      this.device.backBuffer = null
      buffer.destroy()
    }
  }
}
