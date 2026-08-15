export interface GamepadState {
  timestamp: number
  index: number
  connected: boolean
  axes: number[]
  buttons: number[]
}

/**
 * An object that provides the current keyboard state on request
 *
 * @public
 */
export interface GamepadStateProvider {
  /**
   * Gets the currently captured mouse state
   */
  getState(out?: Record<number, GamepadState>): Record<number, GamepadState>

  /**
   * Disposes this object e.g. clears all listeners
   */
  dispose(): void
}

export function copyGamepadState(
  source: Record<number, GamepadState>,
  out?: Record<number, GamepadState>,
): Record<number, GamepadState> {
  out ||= {}
  for (const key in source) {
    out[key] = copyState(source[key], out[key])
  }
  return out as GamepadState[]
}

function copyState(source: GamepadState, out?: Partial<GamepadState>): GamepadState {
  out ||= {}

  out.axes ||= []
  if (source?.axes) {
    out.axes.length = source.axes.length
    for (let i = 0; i < source.axes.length; i++) {
      out.axes[i] = source.axes[i]
    }
  }

  out.buttons ||= []
  if (source.buttons) {
    out.buttons.length = source.buttons.length
    for (let i = 0; i < source.buttons.length; i++) {
      out.buttons[i] = source.buttons[i]
    }
  }

  out.index = source?.index ?? null
  out.connected = source?.connected ?? false
  out.timestamp = source?.timestamp ?? 0

  return out as GamepadState
}
