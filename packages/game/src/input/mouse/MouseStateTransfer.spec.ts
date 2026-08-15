import { describe, expect, it, vi } from 'vitest'
import { MouseButton, type MouseState } from './MouseState'
import { MouseStateTransfer } from './MouseStateTransfer'

function createFakeHost() {
  const target = new EventTarget()
  const postMessage = vi.fn((data: unknown) => {
    target.dispatchEvent(new MessageEvent('message', { data }))
  })
  const host = Object.assign(target, { postMessage }) as unknown as Window
  return { host, postMessage }
}

function sampleState(overrides: Partial<MouseState> = {}): MouseState {
  return {
    timestamp: 123456.789,
    x: 100.5,
    y: 200.25,
    xNormalized: 0.5,
    yNormalized: -0.25,
    wheel: -3,
    buttons: MouseButton.Left | MouseButton.Right,
    ...overrides,
  }
}

describe('MouseStateTransfer', () => {
  describe('constructor', () => {
    it('defaults host to self when none is provided', () => {
      const addSpy = vi.spyOn(self, 'addEventListener')
      const transfer = new MouseStateTransfer({ type: 'sender' })
      expect(addSpy).toHaveBeenCalledWith('message', expect.any(Function))
      transfer.dispose()
      addSpy.mockRestore()
    })

    it('registers a message listener on the given host', () => {
      const { host } = createFakeHost()
      const addSpy = vi.spyOn(host, 'addEventListener')
      const transfer = new MouseStateTransfer({ host, type: 'sender' })
      expect(addSpy).toHaveBeenCalledWith('message', expect.any(Function))
      transfer.dispose()
    })
  })

  describe('getState / setState', () => {
    it('round-trips a full mouse state through the shared buffer', () => {
      const { host } = createFakeHost()
      const transfer = new MouseStateTransfer({ host, type: 'sender' })
      const state = sampleState()

      transfer.setState(state)

      expect(transfer.getState()).toEqual(state)
      transfer.dispose()
    })

    it('writes into the provided out object and returns the same reference', () => {
      const { host } = createFakeHost()
      const transfer = new MouseStateTransfer({ host, type: 'sender' })
      transfer.setState(sampleState())

      const out = {} as MouseState
      const result = transfer.getState(out)

      expect(result).toBe(out)
      expect(result).toEqual(sampleState())
      transfer.dispose()
    })
  })

  describe('emit', () => {
    it('posts the shared buffer to the host', () => {
      const { host, postMessage } = createFakeHost()
      const transfer = new MouseStateTransfer({ host, type: 'sender' })
      transfer.setState(sampleState())

      transfer.emit()

      expect(postMessage).toHaveBeenCalledWith({
        type: 'mouse-state-buffer',
        buffer: expect.any(SharedArrayBuffer),
      })
      transfer.dispose()
    })
  })

  describe('request', () => {
    it('posts a state request message to the host', () => {
      const { host, postMessage } = createFakeHost()
      const transfer = new MouseStateTransfer({ host, type: 'sender' })

      transfer.request()

      expect(postMessage).toHaveBeenCalledWith({ type: 'mouse-state-request' })
      transfer.dispose()
    })
  })

  describe('dispose', () => {
    it('removes the message listener from the host', () => {
      const { host } = createFakeHost()
      const removeSpy = vi.spyOn(host, 'removeEventListener')
      const transfer = new MouseStateTransfer({ host, type: 'sender' })

      transfer.dispose()

      expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function))
    })
  })

  describe('incoming messages', () => {
    it('emits the buffer when a sender receives a request message', () => {
      const { host, postMessage } = createFakeHost()
      const sender = new MouseStateTransfer({ host, type: 'sender' })
      sender.setState(sampleState())

      host.dispatchEvent(new MessageEvent('message', { data: { type: 'mouse-state-request' } }))

      expect(postMessage).toHaveBeenCalledWith({
        type: 'mouse-state-buffer',
        buffer: expect.any(SharedArrayBuffer),
      })
      sender.dispose()
    })

    it('does not emit when a receiver gets a request message', () => {
      const { host, postMessage } = createFakeHost()
      const receiver = new MouseStateTransfer({ host, type: 'receiver' })

      host.dispatchEvent(new MessageEvent('message', { data: { type: 'mouse-state-request' } }))

      expect(postMessage).not.toHaveBeenCalled()
      receiver.dispose()
    })

    it('adopts an incoming shared buffer when acting as a receiver', () => {
      const { host } = createFakeHost()
      const receiver = new MouseStateTransfer({ host, type: 'receiver' })

      const incoming = new SharedArrayBuffer(32)
      new DataView(incoming).setFloat32(8, 42, true)

      host.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'mouse-state-buffer', buffer: incoming },
        }),
      )

      expect(receiver.getState().x).toBe(42)
      receiver.dispose()
    })

    it('ignores an incoming shared buffer when acting as a sender', () => {
      const { host } = createFakeHost()
      const sender = new MouseStateTransfer({ host, type: 'sender' })
      sender.setState(sampleState())

      const incoming = new SharedArrayBuffer(32)
      new DataView(incoming).setFloat32(8, 999, true)

      host.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'mouse-state-buffer', buffer: incoming },
        }),
      )

      expect(sender.getState()).toEqual(sampleState())
      sender.dispose()
    })

    it('ignores a buffer message whose buffer is not a SharedArrayBuffer', () => {
      const { host } = createFakeHost()
      const receiver = new MouseStateTransfer({ host, type: 'receiver' })
      receiver.setState(sampleState())

      host.dispatchEvent(
        new MessageEvent('message', {
          data: { type: 'mouse-state-buffer', buffer: new ArrayBuffer(32) },
        }),
      )

      expect(receiver.getState()).toEqual(sampleState())
      receiver.dispose()
    })

    it('ignores messages with an unrelated type', () => {
      const { host, postMessage } = createFakeHost()
      const sender = new MouseStateTransfer({ host, type: 'sender' })

      host.dispatchEvent(new MessageEvent('message', { data: { type: 'something-else' } }))

      expect(postMessage).not.toHaveBeenCalled()
      sender.dispose()
    })

    it('ignores message events without a data property', () => {
      const { host, postMessage } = createFakeHost()
      const sender = new MouseStateTransfer({ host, type: 'sender' })

      expect(() => host.dispatchEvent(new Event('message'))).not.toThrow()

      expect(postMessage).not.toHaveBeenCalled()
      sender.dispose()
    })
  })
})
