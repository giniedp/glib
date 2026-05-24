import { GameSystem, GameWorld } from '@gglib/ecs'
import { Device, WebglDevice } from '@gglib/graphics'
import { type IRect, Mat4 } from '@gglib/math'

import { RenderView } from '@gglib/render'
import { eventSource } from '@gglib/utils'
import { GameLoop } from '../systems/GameLoop'

function isSupported() {
  return 'xr' in navigator
}

function isSessionSupported(mode: XRSessionMode) {
  const xr = navigator['xr']
  return Promise.resolve(xr?.isSessionSupported(mode) || false)
}

async function requestSession(mode: XRSessionMode, options?: any): Promise<XRSession> {
  const xr = navigator['xr']
  return Promise.resolve(() => {
    return isSessionSupported(mode)
  }).then((supported) => {
    if (supported) {
      return xr.requestSession(mode, options)
    }
    return null
  })
}

export class WebXRSystem extends GameSystem {
  public static readonly isSupported = isSupported
  public static readonly isSessionSupported = isSessionSupported
  public static readonly requestSession = requestSession

  public looper: GameLoop
  public device: WebglDevice

  public get session() {
    return this.xrSession
  }

  public get frame() {
    return this.xrFrame
  }

  private xrSession: XRSession
  private xrFrame: XRFrame

  public readonly onSessionStart = eventSource<XRSession>()
  public readonly onSessionEnd = eventSource<XRSession>()

  public override initialize(world: GameWorld): void {
    this.looper = world.getSystem(GameLoop)
    this.device = world.getSystem(Device) as WebglDevice
    if (!(this.device instanceof WebglDevice)) {
      throw new Error('WebXRSystem requires a WebGL device')
    }
  }

  public override update(time: number, dt: number): void {
    //
  }

  public override destroy(): void {
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
        return null
      })
      .then((session) => {
        if (session) {
          this.onSessionStarted(session)
        }
      })
  }

  public applyPoseToView(pose: XRViewerPose, ...views: RenderView[]) {
    for (let i = 0; i < pose.views.length; i++) {
      const poseView = pose.views[i]
      const view = views[i]
      if (!view) {
        continue
      }
      const vp = this.session.renderState.baseLayer.getViewport(poseView)
      Object.assign<IRect, Partial<IRect>>(view.viewport, {
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
          reversedZ: false,
          near: 0.1,
          far: 1000,
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
      this.onSessionStart.emit(session)
      this.installAnimationFrame(session)
    })
  }

  private onSessionEnded(session: XRSession) {
    this.xrSession = null
    this.uninstallBackbuffer(session)
    this.looper.uninstallAnimationFrame()
    this.onSessionEnd.emit(session)
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
    // TODO:
    throw new Error('not implemented')
    // if (frameBuffer != null && !this.device.backBuffer) {
    //   this.device.backBuffer = new FrameBufferGL(this.device, {
    //     resource: frameBuffer,
    //   })
    // }
  }

  private uninstallBackbuffer(session: XRSession) {
    const frameBuffer = session.renderState.baseLayer.framebuffer
    // TODO:
    throw new Error('not implemented')
    // if (frameBuffer != null && this.device.backBuffer?.resource === frameBuffer) {
    //   const buffer = this.device.backBuffer
    //   this.device.backBuffer = null
    //   buffer.destroy()
    // }
  }
}
