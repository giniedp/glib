import { writeFile } from 'fs/promises'
import { type WgslProgramInfo, parseWgsl, reflectWgsl } from './adapter'

export type ShaderMetadata = {
  bindings: any
}

export async function generateMetaFile(options: { glsl: string; wgsl: string; metaPath: string }): Promise<void> {
  const { bindings, wgsl } = processWgsl(options.wgsl)
  const code = [
    `import { inputSlot } from '@gglib/graphics'`,
    // `export const wgsl = ${JSON.stringify(wgsl, null, 2)}`,
    `export default {`,
    ...Object.entries(bindings).map(([key, [block, path, type]]) => {
      return `  ${key}: inputSlot('${block}', '${path}', '${type}'),`
    }),
    `}`,
  ].join('\n')
  await writeFile(options.metaPath, code, 'utf8')
}

function capitalize(str: string): string {
  let result = str.charAt(0).toUpperCase() + str.slice(1)
  result = str
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  // make typescript safe
  result = result.replace(/[^a-zA-Z0-9_]/g, '_')

  return result
}

function processWgsl(source: string) {
  const result: Record<string, string[]> = {}
  if (!source) {
    return result
  }
  const wgsl = reflectWgsl(parseWgsl(source))
  for (const resource of wgsl?.resources || []) {
    if (resource.texture || resource.sampler) {
      const block = resource.annotations['block'] || ''
      const name = resource.annotations['name'] || resource.name
      result[capitalize(name)] = [block, name, resource.texture ? 'texture' : 'sampler']
    } else {
      const block = resource.annotations['block'] || resource.name
      for (const member of resolveWgslMembers(resource)) {
        member.path.shift() // drop block name
        // replace array brackets with underscores, e.g. "lights[0].position" -> "lights_0.position"
        const property = member.path.map((it) => it.replace(/\[(\d+)\]/g, '_$1')).join()
        const key = member.path.join('.')
        result[capitalize(property)] = [block.toLowerCase(), key.toLowerCase(), member.type]
      }
    }
  }
  return {
    bindings: result,
    wgsl,
  }
}

function resolveWgslMembers(
  resource: WgslProgramInfo['resources'][number],
): Array<{ path: string[]; type: string | null }> {
  const baseName = resource.annotations['alias'] || resource.name
  const result: Array<{ path: string[]; type: string | null }> = []

  let memberCount = 0
  if (resource.container === 'array' && resource.elementStride && resource.size) {
    memberCount = resource.size / resource.elementStride
  }

  if (!resource.members?.length) {
    if (memberCount > 0) {
      for (let i = 0; i < memberCount; i++) {
        result.push({
          path: [`${baseName}[${i}]`],
          type: resource.elementContainer,
        })
      }
    } else {
      result.push({
        path: [baseName],
        type: resource.container,
      })
    }

    return result
  }

  const fields = resource.members.map((member) => resolveWgslMembers(member)).flat()

  if (memberCount > 0) {
    for (let i = 0; i < memberCount; i++) {
      for (const field of fields) {
        result.push({
          path: [`${baseName}[${i}]`, ...field.path],
          type: field.type,
        })
      }
    }
  } else {
    for (const field of fields) {
      result.push({
        path: [baseName, ...field.path],
        type: field.type,
      })
    }
  }

  return result
}
