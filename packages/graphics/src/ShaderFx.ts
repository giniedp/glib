import { Device } from './Device'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'
import { ShaderPassOptions } from './ShaderPass'
import { ShaderTechniqueOptions } from './ShaderTechnique'

/**
 * @public
 */
export interface ShaderFxDocument {
  name: string
  program: string
  technique: ShaderFxTechnique | ShaderFxTechnique[]
}

/**
 * @public
 */
export interface ShaderFxTechnique {
  name: string
  pass: ShaderFxPass | ShaderFxPass[]
}

/**
 * @public
 */
export interface ShaderFxPass {
  name?: string,
  vertexShader: string,
  fragmentShader: string,
}

/**
 * @public
 */
export type ShaderFxIncludeHandler = (includePath: string) => Promise<string>

/**
 * @public
 */
export type ShaderFxIncludeSyncHandler = (includePath: string) => string

/**
 * @public
 */
export async function createShaderEffect(
  device: Device,
  doc: ShaderFxDocument,
  includeHandler?: ShaderFxIncludeHandler): Promise<ShaderEffect> {
  return device.createEffect(await createShaderEffectOptions(doc, includeHandler))
}

/**
 * @public
 */
export async function createShaderEffectOptions(
  doc: ShaderFxDocument,
  includeHandler?: ShaderFxIncludeHandler): Promise<ShaderEffectOptions> {
  return {
    name: doc.name,
    techniques: await processTechniques(doc, includeHandler || ((path) => {
      throw new Error(`Unable to include '${path}'. Include handler is missing.`)
    })),
  }
}

async function processTechniques(
  doc: ShaderFxDocument,
  includeHandler: ShaderFxIncludeHandler,
): Promise<ShaderTechniqueOptions[]> {
  const techniques = Array.isArray(doc.technique) ? doc.technique : [doc.technique]
  return Promise.all(techniques
    .filter((it) => !!it)
    .map(async (it) => {
      return {
        name: it.name,
        passes: await mapPasses(doc, it.pass, includeHandler),
      }
    }))
}

async function mapPasses(
  doc: ShaderFxDocument,
  passes: ShaderFxPass | ShaderFxPass[],
  includeHandler: ShaderFxIncludeHandler,
): Promise<ShaderPassOptions[]> {
  passes = (Array.isArray(passes) ? passes : [passes]).filter((it) => !!it)
  return Promise.all(passes.map(async (it) => {
      return {
        name: it.name,
        program: await processProgram(
          ['#define VERTEX_SHADER', doc.program, it.vertexShader].join('\n'),
          ['#define FRAGMENT_SHADER', doc.program, it.fragmentShader].join('\n'),
          includeHandler,
        ),
      }
    }))
}

async function processProgram(vertexShader: string, fragmentShader: string, include: ShaderFxIncludeHandler) {
  // solve all preprocessor directives
  return Promise.all([
    processShader(vertexShader, include),
    processShader(fragmentShader, include),
  ]).then(([ vSource, fSource ]) => {
    return {
      vertexShader: vSource,
      // attribute declaration is only allowed in vertex shader
      fragmentShader: fSource.replace(/attribute.*;/g, ''),
    }
  })
}

async function processShader(source: string, include: ShaderFxIncludeHandler): Promise<string> {
  return Promise.all(getLines(source).map((line) => {
    const includeMatch = line.match(regInclude)
    return includeMatch ? include(includeMatch[1]) : line
  })).then((lines) => {
    return lines.join(charNewLine)
  })
}

/**
 * @public
 */
export function createShaderEffectSync(
  device: Device,
  doc: ShaderFxDocument,
  includeHandler?: ShaderFxIncludeSyncHandler): ShaderEffect {
  return device.createEffect(createShaderEffectOptionsSync(doc, includeHandler))
}

/**
 * @public
 */
export function createShaderEffectOptionsSync(
  doc: ShaderFxDocument,
  includeHandler?: ShaderFxIncludeSyncHandler): ShaderEffectOptions {
  return {
    name: doc.name,
    techniques: processTechniquesSync(doc, includeHandler || ((path) => {
      throw new Error(`Unable to include '${path}'. Include handler is missing.`)
    })),
  }
}

function processTechniquesSync(
  doc: ShaderFxDocument,
  includeHandler: ShaderFxIncludeSyncHandler,
): ShaderTechniqueOptions[] {
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
  doc: ShaderFxDocument,
  passes: ShaderFxPass | ShaderFxPass[],
  includeHandler: ShaderFxIncludeSyncHandler,
): ShaderPassOptions[] {
  passes = (Array.isArray(passes) ? passes : [passes]).filter((it) => !!it)
  return passes.map((it) => {
    return {
      name: it.name,
      program: processProgramSync(
        ['#define VERTEX_SHADER', doc.program, it.vertexShader].join('\n'),
        ['#define FRAGMENT_SHADER', doc.program, it.fragmentShader].join('\n'),
        includeHandler,
      ),
    }
  })
}

function processProgramSync(vertexShader: string, fragmentShader: string, include: ShaderFxIncludeSyncHandler) {
  return {
    vertexShader: processShaderSync(vertexShader, include),
    // attribute declaration is only allowed in vertex shader
    fragmentShader: processShaderSync(fragmentShader, include).replace(/attribute.*;/g, ''),
  }
}

function processShaderSync(source: string, include: ShaderFxIncludeSyncHandler): string {
  return getLines(source).map((line) => {
    const includeMatch = line.match(regInclude)
    return includeMatch ? include(includeMatch[1]) : line
  }).join(charNewLine)
}

const regInclude = /#include\s+<(.*)>/
const charNewLine = '\n'
function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').replace(/\n+/g, '\n').split('\n')
}
