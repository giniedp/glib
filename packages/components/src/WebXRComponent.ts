import { Events } from '@gglib/utils'
import { Component, Inject, OnInit } from '@gglib/ecs'
import { LoopComponent } from './LoopComponent'
import { Device, DeviceGL, FrameBufferGL } from '@gglib/graphics'
import { SceneView, SceneViewport } from '@gglib/render'
import { Mat4 } from '@gglib/math'

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

@Component()
export class WebXRComponent extends Events implements OnInit {
  public static readonly isSupported = isSupported
  public static readonly isSessionSupported = isSessionSupported
  public static readonly requestSession = requestSession

  @Inject(LoopComponent, { from: 'root' })
  public looper: LoopComponent

  @Inject(Device, { from: 'root' })
  public device: DeviceGL

  public get session() {
    return this.xrSession
  }

  public get frame() {
    return this.xrFrame
  }

  private xrSession: XRSession
  private xrFrame: XRFrame
  public async startSession(mode: XRSessionMode, options?: any) {
    return Promise.resolve()
      .then(() => this.xrSession?.end())
      .then(() => isSessionSupported(mode))
      .then((supported) => {
        if (supported) {
          return WebXRComponent.requestSession(mode, options)
        }
      })
      .then((session) => {
        if (session) {
          this.onSessionStarted(session)
        }
      })
  }

  public onInit() {

  }

  public onSessionStart(callback: (session: XRSession) => void) {
    return this.on('session-start', callback)
  }

  public onSessionEnd(callback: (session: XRSession) => void) {
    return this.on('session-end', callback)
  }

  public applyPoseToView(pose: XRViewerPose, ...views: SceneView[]) {
    for (let i = 0; i < pose.views.length; i++) {
      const poseView = pose.views[i]
      const view = views[i]
      if (!view) {
        continue
      }
      const vp = this.session.renderState.baseLayer.getViewport(poseView)
      Object.assign<SceneViewport, Partial<SceneViewport>>(view.viewport, {
        x: vp.x,
        y: vp.y,
        width: vp.width,
        height: vp.height,
        type: 'pixels'
      })

      if (!view.camera) {
        view.camera = {
          world: Mat4.createIdentity(),
          view: Mat4.createIdentity(),
          projection: Mat4.createIdentity(),
          viewProjection: Mat4.createIdentity(),
        }
      }

      view.camera.projection.initFromArray(poseView.projectionMatrix)
      view.camera.world.initFromArray(poseView.transform.matrix)
      view.camera.view.initFromArray(poseView.transform.inverse.matrix)
      Mat4.premultiply(view.camera.view, view.camera.projection, view.camera.viewProjection)
    }
  }

  private onSessionStarted(session: XRSession) {
    this.xrSession = session
    this.session.addEventListener('end', () => this.onSessionEnded(session))
    session.updateRenderState({
      baseLayer: new XRWebGLLayer(session, this.device.context)
    })
    session.requestReferenceSpace('viewer').then((refSpace) => {
      this.trigger('session-start', session)
      this.installAnimationFrame(session)
    });
  }

  private onSessionEnded(session: XRSession) {
    this.xrSession = null
    this.uninstallBackbuffer(session)
    this.looper.uninstallAnimationFrame()
    this.trigger('session-end', session)
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
      }
    })
  }

  private installBackbuffer(session: XRSession) {
    const frameBuffer = session.renderState.baseLayer.framebuffer
    if (frameBuffer != null && !this.device.backBuffer) {
      this.device.backBuffer = new FrameBufferGL(this.device, {
        handle: frameBuffer
      })
    }
  }

  private uninstallBackbuffer(session:XRSession) {
    const frameBuffer = session.renderState.baseLayer.framebuffer
    if (frameBuffer != null && this.device.backBuffer?.handle === frameBuffer) {
      const buffer = this.device.backBuffer
      this.device.backBuffer = null
      buffer.destroy()
    }
  }
}
