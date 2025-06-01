import { COLLADA } from '../core/collada'
import { DocumentCache, mapChildren } from '../core/utils'
import { Program } from './program'

export class Shader {
  private cache = new DocumentCache()

  public get stage(): 'TESSELATION' | 'VERTEX' | 'GEOMETRY' | 'FRAGMENT' {
    return this.el.getAttribute('stage') as any
  }

  public get isFragmentShader(): boolean {
    return this.stage === 'FRAGMENT'
  }

  public get isVertexShader(): boolean {
    return this.stage === 'VERTEX'
  }

  /**
   * Inline string containing code, such as a #define for an imported shader.
   */
  public get inline(): string[] {
    return this.cache.get('inline', () => mapChildren(this.el, 'inline', (el) => el.textContent))
  }

  /**
   * References to <code> or <include> elements to import
   */
  public get import(): string[] {
    return this.cache.get('import', () => mapChildren(this.el, 'import', (el) => el.getAttribute('ref')))
  }

  constructor(
    public readonly root: COLLADA,
    public readonly parent: Program,
    public readonly el: Element,
  ) {

  }

  /**
   * Resolves the source code
   */
  public getSource(): Promise<string> {
    const result: string[] = []
    this.inline.forEach((it) => result.push(it))
    this.import.forEach((ref) => {
      const code = this.parent.parent.parent.parent.code.find((it) => it.sid === ref)
      if (code) {
        result.push(code.content)
        return
      }

      const include = this.parent.parent.parent.parent.include.find((it) => it.sid === ref)
      if (include) {
        // TODO: load source code from URL
        console.warn('loading shader source code from URL is not supported')
        return
      }
      console.warn(`shader source code reference could not be resolved: ${ref}`)
    })
    return Promise.resolve(result.join('\n'))
  }
}
