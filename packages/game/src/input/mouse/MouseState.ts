import { brand, Brand } from '@gglib/utils'

/**
 * Mouse Button IDs
 * @public
 */
export type MouseButton = Brand<number, 'MouseButton'>

export const MouseButton = {
  /**
   * Left mouse button ID
   */
  Left: brand<MouseButton>(1),
  /**
   * Right mouse button ID
   */
  Right: brand<MouseButton>(2),
  /**
   * Middle mouse button ID
   */
  Middle: brand<MouseButton>(4),
  /**
   * Extra button 1 ID
   */
  Extra1: brand<MouseButton>(8),
  /**
   * Extra button 2 ID
   */
  Extra2: brand<MouseButton>(16),
}

/**
 * The captured Mouse state
 *
 * @public
 */
export interface MouseState {
  /**
   * Time when the mouse state was captured
   */
  timestamp: number
  /**
   * Mouse X position in pixels
   */
  x: number
  /**
   * Mouse Y position in pixels
   */
  y: number
  /**
   * Mouse X position in normalized client coordinates
   */
  xNormalized: number
  /**
   * Mouse Y position in normalized client coordinates
   */
  yNormalized: number
  /**
   * The value of the scroll wheel
   */
  wheel: number
  /**
   * Left middle and right mouse button states
   */
  buttons: number
}

/**
 * An object that provides the current mouse state on request
 *
 * @public
 */
export interface MouseStateProvider {
  /**
   * Gets the currently captured mouse state
   */
  getState(out?: Partial<MouseState>): MouseState

  /**
   * Disposes this object e.g. clears all listeners
   */
  dispose(): void
}
