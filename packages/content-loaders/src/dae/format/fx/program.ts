import { COLLADA } from '../core/collada'
import { DocumentCache, mapChildren } from '../core/utils'
import { BindAttribute, parseBindAttribute } from './bindAttribute'
import { BindUniform, parseBindUniform } from './bindUniform'
import { Pass } from './pass'
import { Shader } from './shader'

export class Program {
  private cache = new DocumentCache()

  public get shader(): Shader[] {
    return this.cache.get('shader', () => mapChildren(this.el, 'shader', (el) => {
      return new Shader(this.root, this, el)
    }))
  }

  public get bindAttribute(): BindAttribute[] {
    return this.cache.get('bind_attribute', () => mapChildren(this.el, 'bind_attribute', parseBindAttribute))
  }

  public get bindUniform(): BindUniform[] {
    return this.cache.get('bind_uniform', () => mapChildren(this.el, 'bind_uniform', parseBindUniform))
  }

  constructor(
    public readonly root: COLLADA,
    public readonly parent: Pass,
    public readonly el: Element,
  ) {

  }

  public getVertexShaderSource(): Promise<string> {
    const vs = this.shader.find((it) => it.isVertexShader)
    if (vs) {
      return vs.getSource()
    }
    return Promise.resolve('')
  }

  public getFragmentShaderSource(): Promise<string> {
    const vs = this.shader.find((it) => it.isFragmentShader)
    if (vs) {
      return vs.getSource()
    }
    return Promise.resolve('')
  }
}
