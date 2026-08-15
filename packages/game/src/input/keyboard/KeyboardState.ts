export interface KeyboardState {
  pressedKeys: string[]
  pressedCodes: string[]
  alt: boolean
  ctrl: boolean
  meta: boolean
  shift: boolean
}

/**
 * An object that provides the current keyboard state on request
 *
 * @public
 */
export interface KeyboardStateProvider {
  /**
   * Gets the currently captured mouse state
   */
  getState(out?: Partial<KeyboardState>): KeyboardState

  /**
   * Disposes this object e.g. clears all listeners
   */
  dispose(): void
}

export function copyKeyboardState(source: KeyboardState, out?: Partial<KeyboardState>): KeyboardState {
  out ||= {} as KeyboardState

  out.pressedCodes ||= []
  out.pressedCodes.length = source.pressedCodes.length
  for (let i = 0; i < source.pressedCodes.length; i++) {
    out.pressedCodes[i] = source.pressedCodes[i]
  }

  out.pressedKeys ||= []
  out.pressedKeys.length = source.pressedKeys.length
  for (let i = 0; i < source.pressedKeys.length; i++) {
    out.pressedKeys[i] = source.pressedKeys[i]
  }

  out.alt = source.alt
  out.ctrl = source.ctrl
  out.meta = source.meta
  out.shift = source.shift
  return out as KeyboardState
}
