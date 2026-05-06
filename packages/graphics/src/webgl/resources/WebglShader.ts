import { shaderTypeToWebGL, type ShaderType } from '../../enums'
import { GlslShaderInfo, reflectGlslShader } from '../glsl'
import { parseGlsl } from '../glsl/glsl-parse'
import type { WebglResource } from '../types'
import { WebglDevice } from '../WebglDevice'

export interface WebglShaderOptions {
  /**
   * The shader source code
   */
  source: string
  /**
   * The shader type e.g. VertexShader or Fragment shader
   */
  type: ShaderType
}

/**
 * A wrapper class around the {@link https://developer.mozilla.org/en-US/docs/Web/API/WebGLShader | WebGLShader}
 *
 * @public
 */
export class WebglShader implements WebglResource<WebGLShader> {
  public readonly device: WebglDevice
  public readonly source: string
  public readonly type: ShaderType
  public readonly info: string
  public readonly glHandle: WebGLShader
  public readonly glType: GLenum
  public readonly reflection: GlslShaderInfo

  public constructor(device: WebglDevice, options: WebglShaderOptions) {
    this.device = device
    this.source = options.source.trimStart()
    this.type = options.type
    this.glType = shaderTypeToWebGL(options.type)
    if (!this.glType) {
      throw new Error(`[WebglShader] unknown shader type "${options.type}"`)
    }
    if (!this.source) {
      throw new Error('[WebglShader] missing "source" option')
    }
    this.restore()
    this.device.onContextLost.add(this.restore)
    try {
      this.reflection = reflectGlslShader(parseGlsl(this.source))
    } catch (err) {
      this.reflection = { inputs: [], outputs: [], uniforms: [] }
      console.warn('[WebglShader] failed to parse shader source for reflection', err)
    }
  }

  private restore = () => {
    const gl = this.device.context
    const self = this as Mutable<this>
    self.glHandle = gl.createShader(this.glType)
    gl.shaderSource(this.glHandle, this.source)
    gl.compileShader(this.glHandle)
  }

  public dispose(): void {
    const gl = this.device.context
    const self = this as Mutable<this>
    const handle = self.glHandle
    self.glHandle = null

    this.device.onContextLost.remove(this.restore)
    if (gl.isShader(handle)) {
      gl.deleteShader(handle)
    }
  }

  public getStatus() {
    const gl = this.device.context
    const compiled = gl.getShaderParameter(this.glHandle, gl.COMPILE_STATUS)
    const info = gl.getShaderInfoLog(this.glHandle)
    const source = this.device.capabilities.extension('WEBGL_debug_shaders')?.getTranslatedShaderSource(this.glHandle)
    return {
      compiled,
      info,
      error: !compiled ? formatError(info, this.source) : null,
      source: source || this.source,
    }
  }
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P]
}

/**
 * Formats a webgl error message
 *
 * @remarks
 * Detects the line in the given source code where the given log message points to.
 * Returns the referenced portion of the soruce code
 *
 * @param log - the log message
 * @param source - the shader source code
 * @param n - number of leading and trailing lines to print
 * @returns
 */
export function formatError(log: string, source: string, n = 10): string {
  if (!log) {
    return ''
  }
  const sourceLines = source.split(/\n/)
  // ERROR: 0:335: '}' : syntax error
  const matcher = /^\s*(\w+)\s*:\s*(\d+)\s*:\s*(\d+)\s*:/
  const result: string[] = []
  for (const line of log.split('\n')) {
    result.push(line)
    const match = line.match(matcher)
    if (match) {
      const lineNum = Number(match[3]) - 1
      for (let i = lineNum - n; i < lineNum + n; i++) {
        if (i >= 0 && i < sourceLines.length) {
          let ln = String(i)
          ln = '     '.substring(0, 5 - ln.length) + ln
          if (i === lineNum) {
            ln = '>' + ln.substring(1)
          }
          result.push(`${ln}:  ${sourceLines[i]}`)
        }
      }
      continue
    }
  }
  return result.join('\n')
}
