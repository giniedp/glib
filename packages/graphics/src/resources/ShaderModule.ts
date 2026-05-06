import type { Device } from '../Device'
import type { Program } from './Program'

export type ShaderModuleOptions = WgslModuleOptions | GlslModuleOptions
export interface WgslModuleOptions {
  name?: string
  wgsl: WgslModuleSource
}
export interface GlslModuleOptions {
  name?: string
  glsl: GlslModuleSource
}

export type WgslModuleSource = string
export type GlslModuleSource = {
  vertex: string
  fragment: string
}

export abstract class ShaderModule {
  /**
   * The graphics device
   */
  public abstract readonly device: Device

  /**
   * The default program bindings for this shader module.
   */
  public abstract readonly program: Program

  /**
   * Releases GPU resources associated with this program.
   */
  public abstract dispose(): void

  /**
   * A promise that resolves when the program is compiled and ready to use.
   */
  public abstract readonly ready: Promise<this>

  /**
   * Indicates whether the program is compiled and ready to use.
   */
  public abstract readonly isReady: boolean
}
