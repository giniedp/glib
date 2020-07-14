import { Events } from '@gglib/utils'
import { Service, Inject, OnInit } from '@gglib/ecs'
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

@Service()
export class WebXRComponent extends Events implements OnInit {
  public static readonly isSupported = isSupported
  public static readonly isSessionSupported = isSessionSupported
  public static readonly requestSession = requestSession

  @Inject(LoopComponent)
  public looper: LoopComponent

  @Inject(Device)
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

type EventHandler = () => void

interface XR extends EventTarget {
  isSessionSupported(mode: XRSessionMode): Promise<boolean>;
  requestSession(
    mode: XRSessionMode,
    options?: XRSessionInit
  ): Promise<XRSession>;
  ondevicechange: EventHandler;
}
type XRSessionMode =
  | "inline"
  | "immersive-vr"

interface XRSessionInit {
  requiredFeatures?: any[];
  optionalFeatures?: any[];
}
type XRVisibilityState =
  | "visible"
  | "visible-blurred"
  | "hidden"

interface XRSession extends EventTarget {
  readonly visibilityState: XRVisibilityState;
  readonly renderState: XRRenderState;
  readonly inputSources: XRInputSourceArray;
  updateRenderState(state?: XRRenderStateInit): void;
  requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
  requestAnimationFrame(callback: XRFrameRequestCallback): number;
  cancelAnimationFrame(handle: number): void;
  end(): Promise<void>;
  onend: EventHandler;
  onselect: EventHandler;
  oninputsourceschange: EventHandler;
  onselectstart: EventHandler;
  onselectend: EventHandler;
  onvisibilitychange: EventHandler;
}
interface XRRenderStateInit {
  depthNear?: number;
  depthFar?: number;
  inlineVerticalFieldOfView?: number;
  baseLayer?: XRWebGLLayer;
}
interface XRRenderState {
  readonly depthNear: number;
  readonly depthFar: number;
  readonly inlineVerticalFieldOfView: number;
  readonly baseLayer: XRWebGLLayer;
}
export type XRFrameRequestCallback = (
  time: DOMHighResTimeStamp,
  frame: XRFrame
) => void;
interface XRFrame {
  readonly session: XRSession;
  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose;
  getPose(space: XRSpace, baseSpace: XRSpace): XRPose;
}
interface XRSpace extends EventTarget {}
export type XRReferenceSpaceType =
  | "viewer"
  | "local"
  | "local-floor"
  | "bounded-floor"
  | "unbounded"

  interface XRReferenceSpace extends XRSpace {
  getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
  onreset: EventHandler;
}
interface XRBoundedReferenceSpace extends XRReferenceSpace {
  readonly boundsGeometry: ReadonlyArray<DOMPointReadOnly>;
}
export type XREye =
  | "none"
  | "left"
  | "right"

  interface XRView {
  readonly eye: XREye;
  readonly projectionMatrix: Float32Array;
  readonly transform: XRRigidTransform;
}
interface XRViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
export type XRRigidTransform = {
  new (position?: DOMPointInit, orientation?: DOMPointInit): XRRigidTransform;
  readonly position: DOMPointReadOnly;
  readonly orientation: DOMPointReadOnly;
  readonly matrix: Float32Array;
  readonly inverse: XRRigidTransform;
}
interface XRPose {
  readonly transform: XRRigidTransform;
  readonly emulatedPosition: boolean;
}
interface XRViewerPose extends XRPose {
  readonly views: ReadonlyArray<XRView>;
}
export type XRHandedness =
  | "none"
  | "left"
  | "right"
  export type XRTargetRayMode =
  | "gaze"
  | "tracked-pointer"
  | "screen"

  interface XRInputSource {
  readonly handedness: XRHandedness;
  readonly targetRayMode: XRTargetRayMode;
  readonly targetRaySpace: XRSpace;
  readonly gripSpace: XRSpace;
  readonly profiles: ReadonlyArray<string>;
}
interface XRInputSourceArray extends Iterable<XRInputSource> {
  readonly length: number;
  (index: number): XRInputSource;
}
interface XRWebGLLayerInit {
  antialias?: boolean;
  depth?: boolean;
  stencil?: boolean;
  alpha?: boolean;
  ignoreDepthValues?: boolean;
  framebufferScaleFactor?: number;
}
declare class XRWebGLLayer {
  constructor (
    session: XRSession,
    context: WebGLRenderingContext | WebGL2RenderingContext,
    layerInit?: XRWebGLLayerInit
  );
  readonly antialias: boolean;
  readonly ignoreDepthValues: boolean;
  readonly framebuffer: WebGLFramebuffer;
  readonly framebufferWidth: number;
  readonly framebufferHeight: number;
  getViewport(view: XRView): XRViewport;
  getNativeFramebufferScaleFactor(session: XRSession): number;
}
interface WebGLContextAttributes {
  xrCompatible?: boolean;
}
declare class XRSessionEvent extends Event {
  constructor (type: string, eventInitDict: XRSessionEventInit);
  readonly session: XRSession;
}
interface XRSessionEventInit extends EventInit {
  session: XRSession;
}
declare class XRInputSourceEvent extends Event {
  constructor(type: string, eventInitDict: XRInputSourceEventInit);
  readonly frame: XRFrame;
  readonly inputSource: XRInputSource;
}
interface XRInputSourceEventInit extends EventInit {
  frame: XRFrame;
  inputSource: XRInputSource;
}
declare class XRInputSourcesChangeEvent extends Event {
  constructor (type: string, eventInitDict: XRInputSourcesChangeEventInit);
  readonly session: XRSession;
  readonly added: ReadonlyArray<XRInputSource>;
  readonly removed: ReadonlyArray<XRInputSource>;
}
interface XRInputSourcesChangeEventInit extends EventInit {
  session: XRSession;
  added: ReadonlyArray<XRInputSource>;
  removed: ReadonlyArray<XRInputSource>;
}
declare class XRReferenceSpaceEvent extends Event {
  constructor (type: string, eventInitDict: XRReferenceSpaceEventInit);
  readonly referenceSpace: XRReferenceSpace;
  readonly transform: XRRigidTransform;
}
interface XRReferenceSpaceEventInit extends EventInit {
  referenceSpace: XRReferenceSpace;
  transform?: XRRigidTransform;
}
