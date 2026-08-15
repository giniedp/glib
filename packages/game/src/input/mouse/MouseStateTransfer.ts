import type { MouseState, MouseStateProvider } from './MouseState'

export interface MouseStateTransferOptions {
  /**
   * The host where to send and receive post messages from
   */
  host?: Window | Worker
  /**
   * If true, will listen for
   */
  type: 'sender' | 'receiver'
}

const supportsSharedBuffer = typeof SharedArrayBuffer !== 'undefined'
export class MouseStateTransfer implements MouseStateProvider {
  private buffer: SharedArrayBuffer
  private data: DataView
  private state: MouseState = {
    timestamp: 0,
    buttons: 0,
    wheel: 0,
    x: 0,
    y: 0,
    xNormalized: 0,
    yNormalized: 0,
  }

  private host: Window | Worker
  private isSender: boolean

  public constructor(options: MouseStateTransferOptions) {
    const byteLength = 8 * 4
    if (supportsSharedBuffer) {
      this.buffer = new SharedArrayBuffer(byteLength)
      this.data = new DataView(this.buffer)
    }
    this.host = options?.host ?? self
    this.isSender = options?.type === 'sender'
    this.host.addEventListener('message', this.onMessage)
  }

  private readState(out: MouseState) {
    out.timestamp = this.data.getFloat64(0, true)
    out.x = this.data.getFloat32(8, true)
    out.y = this.data.getFloat32(12, true)
    out.xNormalized = this.data.getFloat32(16, true)
    out.yNormalized = this.data.getFloat32(20, true)
    out.wheel = this.data.getFloat32(24, true)
    out.buttons = this.data.getUint32(28, true)
  }

  private writeState(state: MouseState) {
    this.data.setFloat64(0, state.timestamp, true)
    this.data.setFloat32(8, state.x, true)
    this.data.setFloat32(12, state.y, true)
    this.data.setFloat32(16, state.xNormalized, true)
    this.data.setFloat32(20, state.yNormalized, true)
    this.data.setFloat32(24, state.wheel, true)
    this.data.setUint32(28, state.buttons, true)
  }

  /**
   * Gets the captured state and updates the given output object
   */
  public getState(out?: MouseState): MouseState {
    out ||= {} as MouseState
    if (this.buffer) {
      this.readState(out)
    } else {
      Object.assign(out, this.state)
    }
    return out
  }

  /**
   * Uses the given state and updates internal capture buffer
   */
  public setState(state: MouseState) {
    Object.assign(this.state, state)
    if (this.buffer) {
      this.writeState(state)
    }
  }

  /**
   * Sends the shared state buffer to the given target via `postMessage`
   */
  public emit(): void {
    if (this.buffer) {
      this.host.postMessage({
        type: MOUSE_STATE_BUFFER_MSG,
        buffer: this.buffer,
      } satisfies MouseStateBufferMessage)
    } else {
      this.host.postMessage({
        type: MOUSE_STATE_BUFFER_MSG,
        buffer: this.buffer,
      } satisfies MouseStateBufferMessage)
    }
  }

  /**
   * Sends a state request message
   */
  public request(): void {
    this.host.postMessage({
      type: MOUSE_STATE_REQUEST_MSG,
    } satisfies MouseStateRequestMessage)
  }

  public dispose(): void {
    this.host.removeEventListener('message', this.onMessage)
  }

  private readonly onMessage = (e: Event | MessageEvent): void => {
    if (!('data' in e)) {
      return
    }
    if (isMouseStateRequestMessage(e.data)) {
      if (this.isSender) {
        this.emit()
      }
    }
    if (isMouseStateBufferMessage(e.data)) {
      if (!this.isSender) {
        this.buffer = e.data.buffer
        this.data = new DataView(this.buffer)
      }
    }
    if (isMouseStateObjectMessage(e.data)) {
      if (!this.isSender) {
        this.setState(e.data.state)
      }
    }
  }
}

const MOUSE_STATE_REQUEST_MSG = 'mouse-state-request'
const MOUSE_STATE_BUFFER_MSG = 'mouse-state-buffer'
const MOUSE_STATE_OBJECT_MSG = 'mouse-state-object'

interface MouseStateBufferMessage {
  type: typeof MOUSE_STATE_BUFFER_MSG
  buffer: SharedArrayBuffer
}

interface MouseStateObjectMessage {
  type: typeof MOUSE_STATE_OBJECT_MSG
  state: MouseState
}

interface MouseStateRequestMessage {
  type: typeof MOUSE_STATE_REQUEST_MSG
}

function isMouseStateBufferMessage(data: unknown): data is MouseStateBufferMessage {
  if (data == null || typeof data !== 'object') {
    return false
  }

  const msg = data as MouseStateBufferMessage
  if (msg.type !== MOUSE_STATE_BUFFER_MSG) {
    return false
  }

  if (!(msg.buffer instanceof SharedArrayBuffer)) {
    return false
  }

  return true
}

function isMouseStateObjectMessage(data: unknown): data is MouseStateObjectMessage {
  if (data == null || typeof data !== 'object') {
    return false
  }

  const msg = data as MouseStateObjectMessage
  if (msg.type !== MOUSE_STATE_OBJECT_MSG) {
    return false
  }

  return !!msg.state
}

function isMouseStateRequestMessage(data: unknown): data is MouseStateRequestMessage {
  if (data == null || typeof data !== 'object') {
    return false
  }

  const msg = data as MouseStateRequestMessage
  return msg.type === MOUSE_STATE_REQUEST_MSG
}
