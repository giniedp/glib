import { Device } from './Device'
import { ShaderEffect, ShaderEffectOptions } from './ShaderEffect'
import { ShaderPassOptions } from './ShaderPass'
import { ShaderTechniqueOptions } from './ShaderTechnique'

export interface ShaderFxDocument {
  name: string
  program: string
  technique: ShaderFxTechnique | ShaderFxTechnique[]
}

export interface ShaderFxTechnique {
  name: string
  pass: ShaderFxPass | ShaderFxPass[]
}

export interface ShaderFxPass {
  name?: string,
  vertexShader: string,
  fragmentShader: string,
}

export type ShaderFxIncludeHandler = (includePath: string) => Promise<string>

function missingIncludeHandler(path: string): Promise<string> {
  throw new Error(`Unable to include '${path}'. Include handler is missing.`)
}

export async function createShaderEffect(
  device: Device,
  doc: ShaderFxDocument,
  includeHandler?: ShaderFxIncludeHandler): Promise<ShaderEffect> {
  return device.createEffect(await createShaderEffectOptions(doc, includeHandler))
}

export async function createShaderEffectOptions(
  doc: ShaderFxDocument,
  includeHandler?: ShaderFxIncludeHandler): Promise<ShaderEffectOptions> {
  return {
    name: doc.name,
    techniques: await mapTechnqiues(doc, includeHandler || missingIncludeHandler),
  }
}

async function mapTechnqiues(
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

async function  mapPasses(
  doc: ShaderFxDocument,
  passes: ShaderFxPass | ShaderFxPass[],
  includeHandler: ShaderFxIncludeHandler,
): Promise<ShaderPassOptions[]> {
  passes = Array.isArray(passes) ? passes : [passes]
  return Promise.all(passes
    .filter((it) => !!it)
    .map(async (it) => {
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

let regInclude = /#include\s+<(.*)>/
let charNewLine = '\n'

function getLines(value: string): string[] {
  return value.replace(/\r/g, '\n').replace(/\n+/g, '\n').split('\n')
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
