import { extend } from '@glib/core'
import * as Input from '@glib/input'
import { Component } from './../Component'
import { Entity } from './../Entity'

export class Keyboard implements Component {
  public node: Entity
  public name: string = 'Keyboard'
  public service: boolean = true
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

  public debug(): string {
    return [
      `- component: ${this.name}`,
      `  enabled: ${this.enabled}`,
      `  keys: ${this.newState.pressedKeys}`,
    ].join('\n')
  }
}
