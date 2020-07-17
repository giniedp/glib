type EventHandler = any
interface Navigator {
    readonly xr: XR;
}
interface XR extends EventTarget {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
    ondevicechange: EventHandler;
}
declare var XR: XR;
type XRSessionMode = "inline" | "immersive-vr";
interface XRSessionInit {
    requiredFeatures?: Array<any>;
    optionalFeatures?: Array<any>;
}
type XRVisibilityState = "visible" | "visible-blurred" | "hidden";
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
declare var XRSession: XRSession;
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
declare var XRRenderState: XRRenderState;
type XRFrameRequestCallback = (time: DOMHighResTimeStamp, frame: XRFrame) => void;
interface XRFrame {
    readonly session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose;
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose;
}
declare var XRFrame: XRFrame;
interface XRSpace extends EventTarget {
}
declare var XRSpace: XRSpace;
type XRReferenceSpaceType = "viewer" | "local" | "local-floor" | "bounded-floor" | "unbounded";
interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
    onreset: EventHandler;
}
declare var XRReferenceSpace: XRReferenceSpace;
interface XRBoundedReferenceSpace extends XRReferenceSpace {
    readonly boundsGeometry: ReadonlyArray<DOMPointReadOnly>;
}
declare var XRBoundedReferenceSpace: XRBoundedReferenceSpace;
type XREye = "none" | "left" | "right";
interface XRView {
    readonly eye: XREye;
    readonly projectionMatrix: Float32Array;
    readonly transform: XRRigidTransform;
}
declare var XRView: XRView;
interface XRViewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}
declare var XRViewport: XRViewport;
interface XRRigidTransform {
    new (position?: DOMPointInit, orientation?: DOMPointInit);
    readonly position: DOMPointReadOnly;
    readonly orientation: DOMPointReadOnly;
    readonly matrix: Float32Array;
    readonly inverse: XRRigidTransform;
}
declare var XRRigidTransform: XRRigidTransform;
interface XRPose {
    readonly transform: XRRigidTransform;
    readonly emulatedPosition: boolean;
}
declare var XRPose: XRPose;
interface XRViewerPose extends XRPose {
    readonly views: ReadonlyArray<XRView>;
}
declare var XRViewerPose: XRViewerPose;
type XRHandedness = "none" | "left" | "right";
type XRTargetRayMode = "gaze" | "tracked-pointer" | "screen";
interface XRInputSource {
    readonly handedness: XRHandedness;
    readonly targetRayMode: XRTargetRayMode;
    readonly targetRaySpace: XRSpace;
    readonly gripSpace: XRSpace;
    readonly profiles: ReadonlyArray<string>;
}
declare var XRInputSource: XRInputSource;
interface XRInputSourceArray extends Iterable<XRInputSource> {
    readonly length: number;
    (index: number): XRInputSource;
}
declare var XRInputSourceArray: XRInputSourceArray;
type XRWebGLRenderingContext = WebGLRenderingContext | WebGL2RenderingContext;
interface XRWebGLLayerInit {
    antialias?: boolean;
    depth?: boolean;
    stencil?: boolean;
    alpha?: boolean;
    ignoreDepthValues?: boolean;
    framebufferScaleFactor?: number;
}
interface XRWebGLLayer {
    new (session: XRSession, context: XRWebGLRenderingContext, layerInit?: XRWebGLLayerInit);
    readonly antialias: boolean;
    readonly ignoreDepthValues: boolean;
    readonly framebuffer: WebGLFramebuffer;
    readonly framebufferWidth: number;
    readonly framebufferHeight: number;
    getViewport(view: XRView): XRViewport;
    getNativeFramebufferScaleFactor(session: XRSession): number;
}
declare var XRWebGLLayer: XRWebGLLayer;
interface WebGLContextAttributes {
    xrCompatible?: boolean;
}
interface WebGLRenderingContextBase {
    makeXRCompatible(): Promise<void>;
}
interface XRSessionEvent extends Event {
    new (type: string, eventInitDict: XRSessionEventInit);
    readonly session: XRSession;
}
declare var XRSessionEvent: XRSessionEvent;
interface XRSessionEventInit extends EventInit {
    session: XRSession;
}
interface XRInputSourceEvent extends Event {
    new (type: string, eventInitDict: XRInputSourceEventInit);
    readonly frame: XRFrame;
    readonly inputSource: XRInputSource;
}
declare var XRInputSourceEvent: XRInputSourceEvent;
interface XRInputSourceEventInit extends EventInit {
    frame: XRFrame;
    inputSource: XRInputSource;
}
interface XRInputSourcesChangeEvent extends Event {
    new (type: string, eventInitDict: XRInputSourcesChangeEventInit);
    readonly session: XRSession;
    readonly added: ReadonlyArray<XRInputSource>;
    readonly removed: ReadonlyArray<XRInputSource>;
}
declare var XRInputSourcesChangeEvent: XRInputSourcesChangeEvent;
interface XRInputSourcesChangeEventInit extends EventInit {
    session: XRSession;
    added: ReadonlyArray<XRInputSource>;
    removed: ReadonlyArray<XRInputSource>;
}
interface XRReferenceSpaceEvent extends Event {
    new (type: string, eventInitDict: XRReferenceSpaceEventInit);
    readonly referenceSpace: XRReferenceSpace;
    readonly transform: XRRigidTransform;
}
declare var XRReferenceSpaceEvent: XRReferenceSpaceEvent;
interface XRReferenceSpaceEventInit extends EventInit {
    referenceSpace: XRReferenceSpace;
    transform?: XRRigidTransform;
}
