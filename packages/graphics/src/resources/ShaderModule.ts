import type { Device } from '../Device'
import { ShaderConstants } from '../states'
import type { Program } from './Program'

export type ShaderModuleOptions = WgslModuleOptions | GlslModuleOptions
export interface WgslModuleOptions {
  name?: string
  wgsl: string | WgslModuleSource
}
export interface GlslModuleOptions {
  name?: string
  glsl: GlslModuleSource
}

export type WgslModuleSource = {
  source: string
  vertexConstants?: ShaderConstants
  fragmentConstants?: ShaderConstants
}

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
   * A promise that resolves when the program compilation did run.
   * A compiled program/shader can still be invalid and have compilation errors.
   */
  public abstract readonly compiled: Promise<this>

  /**
   * Indicates that the program compilation is complete.
   * A compiled program/shader can still be invalid and have compilation errors.
   */
  public abstract readonly isCompiled: boolean

  /**
   * Indicates that program compilation did run without errors.
   */
  public abstract readonly isValid: boolean
}
