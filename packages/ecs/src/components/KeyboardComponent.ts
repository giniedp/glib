import { extend } from '@gglib/core'
import * as Input from '@gglib/input'
import { Component } from './../Component'
import { Entity } from './../Entity'

/**
 * @public
 */
export class KeyboardComponent implements Component {
  public readonly name: string = 'Keyboard'
  public readonly service: boolean = true

  public entity: Entity
  public enabled: boolean = true

  public keyboard: Input.Keyboard
  public newState: Input.IKeyboardState
  public oldState: Input.IKeyboardState

  constructor(options: any= {}) {
    this.keyboard = new Input.Keyboard()
    extend(this, options)
    this.newState = this.keyboard.copyState({})
    this.oldState = this.keyboard.copyState({})
  }

  public update() {
    const toUpdate = this.oldState
    this.oldState = this.newState
    this.newState = toUpdate
    this.keyboard.copyState(toUpdate)
  }

  public isPressed(key: number): boolean {
    return this.newState.pressedKeys.indexOf(key) >= 0
  }

  public justPressed(key: number): boolean {
    return (this.oldState.pressedKeys.indexOf(key) < 0) && (this.newState.pressedKeys.indexOf(key) >= 0)
  }

  public isReleased(key: number): boolean {
    return (this.newState.pressedKeys.indexOf(key) >= 0)
  }

  public justReleased(key: number): boolean {
    return (this.oldState.pressedKeys.indexOf(key) >= 0) && (this.newState.pressedKeys.indexOf(key) < 0)
  }
}
