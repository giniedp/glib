import type { Device } from './Device'
import type { Effect, EffectOptions } from './Effect'
import type { EffectPassOptions } from './EffectPass'
import type { EffectTechniqueOptions } from './EffectTechnique'

/**
 * @public
 */
export interface EffectDocument {
  /**
   * The name of the effect
   */
  name: string

  /**
   * OpenGL ES version that should be baked into the program
   */
  version?: string

  /**
   * The base shader program that is prepended to all vertex and fragment shaders
   */
  program: string

  /**
   * The technique documents
   */
  technique: EffectDocumentTechnique | EffectDocumentTechnique[]
}

/**
 * @public
 */
export interface EffectDocumentTechnique {
  /**
   * The name of the technique
   */
  name: string

  /**
   * The shader passes of the technique
   */
  pass: EffectDocumentPass | EffectDocumentPass[]
}

/**
 * @public
 */
export interface EffectDocumentPass {
  /**
   * The name of the pass
   */
  name?: string

  /**
   * The vertex shader source code
   */
  vertexShader: string

  /**
   * The fragment shader source code
   */
  fragmentShader: string
}

/**
 * @public
 */
export type EffectIncludeAsyncHandler = (includePath: string) => Promise<string>

/**
 * @public
 */
export type EffectIncludeSyncHandler = (includePath: string) => string

export function buildEffectVertexShader(doc: EffectDocument, shader: string): string {
  return [`#version ${doc.version || '100'}`, '#define VERTEX_SHADER', doc.program, shader].join('\n').trim()
}

export function buildEffectFragmentShader(doc: EffectDocument, shader: string): string {
  return [`#version ${doc.version || '100'}`, '#define FRAGMENT_SHADER', doc.program, shader].join('\n').trim()
}

/**
 * @public
 */
export async function createShaderEffect(
  device: Device,
  doc: EffectDocument,
  includeHandler?: EffectIncludeAsyncHandler,
): Promise<Effect> {
  return device.createEffect(await createEffectOptions(doc, includeHandler))
}

/**
 * @public
 */
export async function createEffectOptions(
  doc: EffectDocument,
  includeHandler?: EffectIncludeAsyncHandler,
): Promise<EffectOptions> {
  return {
    name: doc.name,
    techniques: await processTechniques(
      doc,
      includeHandler ||
        ((path) => {
          throw new Error(`Unable to include '${path}'. Include handler is missing.`)
        }),
    ),
  }
}

async function processTechniques(
  doc: EffectDocument,
  includeHandler: EffectIncludeAsyncHandler,
): Promise<EffectTechniqueOptions[]> {
  const techniques = Array.isArray(doc.technique) ? doc.technique : [doc.technique]
  return Promise.all(
    techniques
      .filter((it) => !!it)
      .map(async (it) => {
        return {
          name: it.name,
          passes: await mapPasses(doc, it.pass, includeHandler),
        }
      }),
  )
}

async function mapPasses(
  doc: EffectDocument,
  passes: EffectDocumentPass | EffectDocumentPass[],
  includeHandler: EffectIncludeAsyncHandler,
): Promise<EffectPassOptions[]> {
  passes = (Array.isArray(passes) ? passes : [passes]).filter((it) => !!it)
  return Promise.all(
    passes.map(async (it) => {
      return {
        name: it.name,
        program: await processProgram(
          buildEffectVertexShader(doc, it.vertexShader),
          buildEffectFragmentShader(doc, it.fragmentShader),
          includeHandler,
        ),
      }
    }),
  )
}

async function processProgram(vertexShader: string, fragmentShader: string, include: EffectIncludeAsyncHandler) {
  // solve all preprocessor directives
  return Promise.all([processShader(vertexShader, include), processShader(fragmentShader, include)]).then(
    ([vSource, fSource]) => {
      return {
        vertexShader: vSource,
        // attribute declaration is only allowed in vertex shader
        fragmentShader: fSource.replace(/attribute.*;/g, ''),
      }
    },
  )
}

async function processShader(source: string, include: EffectIncludeAsyncHandler): Promise<string> {
  return Promise.all(
    getLines(source).map((line) => {
      const includeMatch = line.match(regInclude)
      return includeMatch ? include(includeMatch[1]) : line
    }),
  ).then((lines) => {
    return lines.join(charNewLine)
  })
}

/**
 * @public
 */
export function createShaderEffectSync(
  device: Device,
  doc: EffectDocument,
  includeHandler?: EffectIncludeSyncHandler,
): Effect {
  return device.createEffect(createEffectOptionsSync(doc, includeHandler))
}

/**
 * @public
 */
export function createEffectOptionsSync(
  doc: EffectDocument,
  includeHandler?: EffectIncludeSyncHandler,
): EffectOptions {
  return {
    name: doc.name,
    techniques: processTechniquesSync(
      doc,
      includeHandler ||
        ((path) => {
          throw new Error(`Unable to include '${path}'. Include handler is missing.`)
        }),
    ),
  }
}

function processTechniquesSync(
  doc: EffectDocument,
  includeHandler: EffectIncludeSyncHandler,
): EffectTechniqueOptions[] {
  const techniques = Array.isArray(doc.technique) ? doc.technique : [doc.technique]
  return techniques
    .filter((it) => !!it)
    .map((it) => {
      return {
        name: it.name,
        passes: mapPassesSync(doc, it.pass, includeHandler),
      }
    })
}

function mapPassesSync(
  doc: EffectDocument,
  passes: EffectDocumentPass | EffectDocumentPass[],
  includeHandler: EffectIncludeSyncHandler,
): EffectPassOptions[] {
  passes = (Array.isArray(passes) ? passes : [passes]).filter((it) => !!it)
  return passes.map((it) => {
    return {
      name: it.name,
      program: processProgramSync(
        buildEffectVertexShader(doc, it.vertexShader),
        buildEffectFragmentShader(doc, it.fragmentShader),
        includeHandler,
      ),
    }
  })
}

function processProgramSync(vertexShader: string, fragmentShader: string, include: EffectIncludeSyncHandler) {
  return {
    vertexShader: processShaderSync(vertexShader, include),
    // attribute declaration is only allowed in vertex shader
    fragmentShader: processShaderSync(fragmentShader, include).replace(/attribute.*;/g, ''),
  }
}

function processShaderSync(source: string, include: EffectIncludeSyncHandler): string {
  return getLines(source)
    .map((line) => {
      const includeMatch = line.match(regInclude)
      return includeMatch ? include(includeMatch[1]) : line
    })
    .join(charNewLine)
}

const regInclude = /#include\s+<(.*)>/
const charNewLine = '\n'
function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').replace(/\n+/g, '\n').split('\n')
}
