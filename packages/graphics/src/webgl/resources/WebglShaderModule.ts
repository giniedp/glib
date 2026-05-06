import { eventSource } from '@gglib/utils'
import type { Task } from '../../Scheduler'
import { getRefCounter, ShaderModule, type ProgramOptions, type ReferenceCounter } from '../../resources'
import { WebglDevice } from '../WebglDevice'
import { GlslShaderInfo } from '../glsl'
import type { WebglResource } from '../types'
import { WebglProgram } from './WebglProgram'
import { reflectProgram, type WebglReflection } from './WebglReflection'
import { WebglShader } from './WebglShader'

export interface WebglShaderModuleOptions {
  /**
   *
   */
  name?: string
  /**
   * The base texture unit index for the program.
   * The program will use texture units starting from this index for its texture bindings.
   */
  textureUnitBase?: number
  /**
   * The vertex shader source code.
   */
  vertex: string
  /**
   * The fragment shader source code.
   */
  fragment: string
}

/**
 * @public
 */
export class WebglShaderModule extends ShaderModule implements WebglResource<WebGLProgram> {
  /**
   *
   */
  public readonly name: string
  /**
   * The graphics device
   */
  public readonly device: WebglDevice

  /**
   * The vertex shader
   */
  public readonly vertexShader: WebglShader

  /**
   * The fragment shader
   */
  public readonly fragmentShader: WebglShader

  /**
   * The web gl program handle
   */
  public readonly glHandle: WebGLProgram

  /**
   * The default program instance
   */
  public readonly program: WebglProgram

  /**
   * Whether the program is successfully linked
   */
  public readonly isLinked: boolean

  /**
   * Whether the program has finished compiling.
   *
   * @remarks
   * The program is considered ready when the compilation is finished. Yet the program may not be linked successfully.
   * Check the {@link isLinked} property to determine if the program is ready to use for rendering.
   */
  public readonly isReady: boolean

  /**
   * Event that is emitted when the program is disposed
   */
  public readonly onDisposed = eventSource<this>('WebglShaderModule disposed')
  /**
   * Event that is emitted when the program has finished compiling
   */
  public readonly onCompiled = eventSource<this>('WebglShaderModule compiled')
  /**
   * Resolves when the program has finished compiling
   */
  public readonly ready = new Promise<this>((resolve) => {
    return this.onCompiled.once(() => {
      // resources are created onCompiled, so we have to delay the resolve to next microtask
      // to ensure that the program is fully ready to use when the promise resolves
      queueMicrotask(() => resolve(this))
    })
  })

  public readonly reflection: WebglReflection
  public readonly textureUnitBase: number = 1
  public readonly ref: ReferenceCounter

  private info: string
  private attached: WebglShader[] = []
  private compileTask: Task<void>

  public constructor(device: WebglDevice, options: WebglShaderModuleOptions) {
    super()
    this.device = device
    this.device.onContextLost.add(this.handleContextLost)
    this.device.onContextRestored.add(this.handleContextRestored)

    this.ref = getRefCounter(options) || null
    if (this.ref) {
      this.ref.retain()
      this.ref.onFinalize(() => this.finalize())
    }

    this.name = options.name || `WebglProgram`
    this.textureUnitBase = Math.max(0, options.textureUnitBase ?? this.textureUnitBase)
    this.vertexShader = new WebglShader(this.device, {
      type: 'VertexShader',
      source: options.vertex,
    })
    this.fragmentShader = new WebglShader(this.device, {
      type: 'FragmentShader',
      source: options.fragment,
    })
    this.program = new WebglProgram(this)
    this.create()
    this.compile()
  }

  private handleContextLost = () => {
    this.attached.length = 0
  }

  private handleContextRestored = () => {
    this.create()
    this.compile()
  }

  /**
   * Creates or recreates a `WebGLProgram` resources if needed
   */
  public create(): void {
    const gl = this.device.context
    const self = this as Mutable<this>
    if (!self.glHandle || !gl.isProgram(this.glHandle)) {
      self.glHandle = gl.createProgram()
    }
  }

  /**
   * Releases the previously created `WebGLProgram` resource
   */
  public dispose(): void {
    if (this.ref) {
      this.ref.release()
    } else {
      this.finalize()
    }
  }

  private finalize(): void {
    const gl = this.device.context
    const self = this as Mutable<this>
    if (gl.isProgram(this.glHandle)) {
      gl.deleteProgram(this.glHandle)
    }
    self.glHandle = null
    this.device.onContextLost.remove(this.handleContextLost)
    this.device.onContextRestored.remove(this.handleContextRestored)
    this.onDisposed.emit(this)
    this.onDisposed.clear()
  }

  private detach(): void {
    const gl = this.device.context
    const self = this as Mutable<this>
    self.isReady = false
    self.isLinked = false
    this.compileTask?.cancel(new Error('Program has been disposed'))
    this.compileTask = null
    for (const shader of this.attached) {
      if (gl.isShader(shader.glHandle)) {
        gl.detachShader(this.glHandle, shader.glHandle)
      }
    }
    this.attached.length = 0
  }

  private compile(): void {
    this.detach()
    const gl = this.device.context
    const self = this as Mutable<this>
    self.isReady = false

    if (this.vertexShader) {
      gl.attachShader(this.glHandle, this.vertexShader.glHandle)
      this.attached.push(this.vertexShader)
    }
    if (this.fragmentShader) {
      gl.attachShader(this.glHandle, this.fragmentShader.glHandle)
      this.attached.push(this.fragmentShader)
    }
    gl.linkProgram(this.glHandle)

    const compileAsync = this.device.capabilities.extension('KHR_parallel_shader_compile')
    if (!compileAsync) {
      this.compileFinished()
      return
    }

    this.compileTask = this.device.scheduler.task((task) => {
      if (!this.glHandle) {
        task.cancel(new Error('Program has been disposed'))
        this.compileTask = null
        return
      }
      const isCompiling = !gl.getProgramParameter(this.glHandle, compileAsync.COMPLETION_STATUS_KHR)
      if (!isCompiling) {
        this.compileFinished()
        task.complete()
        this.compileTask = null
      }
    })
    this.compileTask.schedule()
  }

  private compileFinished() {
    const gl = this.device.context
    const self = this as Mutable<this>
    self.isReady = true
    self.isLinked = gl.getProgramParameter(this.glHandle, gl.LINK_STATUS)
    this.info = gl.getProgramInfoLog(this.glHandle)
    const vertex = this.vertexShader?.getStatus()
    const fragment = this.fragmentShader?.getStatus()
    if (!this.isLinked) {
      console.error('Program link failed', this.info)
      if (vertex?.error) {
        console.error('Vertex shader error', vertex.error)
      }
      if (fragment?.error) {
        console.error('Fragment shader error', fragment.error)
      }
    } else {
      self.reflection = reflectProgram(this)
    }
    this.onCompiled.emit(this)
  }

  public createBindings(options?: ProgramOptions): WebglProgram {
    return new WebglProgram(this, options)
  }
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}
