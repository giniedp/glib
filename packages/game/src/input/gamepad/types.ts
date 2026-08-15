import { brand, Brand } from '@gglib/utils'

export type GamepadButton = Brand<number, 'GamepadButton'>

/**
 * @public
 */
export const GamepadButton = {
  // Face (main) buttons
  A: brand<GamepadButton>(0),
  B: brand<GamepadButton>(1),
  X: brand<GamepadButton>(2),
  Y: brand<GamepadButton>(3),
  // Top shoulder buttons
  LeftShoulder: brand<GamepadButton>(4),
  RightShoulder: brand<GamepadButton>(5),
  // Bottom shoulder buttons
  LeftTrigger: brand<GamepadButton>(6),
  RightTrigger: brand<GamepadButton>(7),
  // The back or select button
  Back: brand<GamepadButton>(8),
  // The start button
  Start: brand<GamepadButton>(9),
  // Analogue sticks (if depressible)
  LeftStick: brand<GamepadButton>(10),
  RightStick: brand<GamepadButton>(11),
  // Directional (discrete) pad
  DPadUp: brand<GamepadButton>(12),
  DPadDown: brand<GamepadButton>(13),
  DPadLeft: brand<GamepadButton>(14),
  DPadRight: brand<GamepadButton>(15),

  // any extra buttons
  Extra1: brand<GamepadButton>(16),
  Extra2: brand<GamepadButton>(17),
  Extra3: brand<GamepadButton>(18),
  Extra4: brand<GamepadButton>(19),
  Extra5: brand<GamepadButton>(20),
  Extra6: brand<GamepadButton>(21),
  Extra7: brand<GamepadButton>(22),
  Extra8: brand<GamepadButton>(23),
  Extra9: brand<GamepadButton>(24),
}

export type GamepadAxes = Brand<number, 'GamepadAxes'>

/**
 * @public
 */
export const GamepadAxes = {
  LeftHorizontal: brand<GamepadAxes>(0),
  LeftVertical: brand<GamepadAxes>(1),
  RightHorizontal: brand<GamepadAxes>(2),
  RightVertical: brand<GamepadAxes>(3),
}
