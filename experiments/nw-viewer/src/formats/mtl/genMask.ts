import type { LoadContext } from '@gglib/content'

/**
 * Shader flag masks of a shader `.ext` file (`Shaders/<shader>.ext`): flag name (with `%`) by mask bits
 */
export type ShaderGenMasks = ReadonlyArray<[name: string, mask: bigint]>

/**
 * Parses the `Property { Name = %FLAG  Mask = 0x… }` blocks of a shader `.ext` file
 */
export function parseShaderExt(source: string): ShaderGenMasks {
  const result: Array<[string, bigint]> = []
  const blocks = source.replace(/\/\/[^\n]*/g, '').split(/\bProperty\s*\{/)
  for (const block of blocks.slice(1)) {
    const name = /\bName\s*=\s*(%\w+)/.exec(block)?.[1]
    const mask = /\bMask\s*=\s*(0x[0-9a-f]+|\d+)/i.exec(block)?.[1]
    if (name && mask) {
      result.push([name.toUpperCase(), BigInt(mask)])
    }
  }
  return result
}

/**
 * The `StringGenMask` form (`%A%B`) of a numeric `GenMask`, decoded with the masks of the shader `.ext`
 */
export function genMaskToString(genMask: string, masks: ShaderGenMasks): string {
  let value: bigint
  try {
    value = BigInt(genMask.trim())
  } catch {
    return ''
  }
  let result = ''
  for (const [name, mask] of masks) {
    if (mask && (value & mask) === mask) {
      result += name
    }
  }
  return result
}

const extCache = new Map<string, Promise<ShaderGenMasks>>()

/**
 * Loads and caches the flag masks of a shader `.ext` file, empty if the shader has none
 */
export function loadShaderGenMasks(shader: string, context: LoadContext): Promise<ShaderGenMasks> {
  const key = shader.toLowerCase()
  let result = extCache.get(key)
  // the .ext is a file next to the textures, under the nwbt file root
  if (!result && !context.baseUrl) {
    return Promise.resolve([])
  }
  if (!result) {
    const url = new URL(`shaders/${key}.ext`, context.baseUrl).href
    result = context.content
      .fetch(url, { responseType: 'text' })
      .then((response) => parseShaderExt(String(response.body)))
      .catch((): ShaderGenMasks => [])
    extCache.set(key, result)
  }
  return result
}

/**
 * The shader flags of a material in the `StringGenMask` form.
 *
 * @remarks
 * Lumberyard `MatMan.cpp` reads the numeric `GenMask` and uses `StringGenMask` only for shaders with common global
 * flags (`UsesCommonGlobalFlags` in the `.ext`, none in the game files), the numeric mask is the reference.
 * `StringGenMask` is kept where it is present, materials without it (e.g. fogsheet_marsh.mtl, GenMask 39)
 * are decoded with the shader `.ext` masks.
 */
export async function resolveStringGenMask(
  attrs: { Shader?: string; GenMask?: string; StringGenMask?: string },
  context: LoadContext,
): Promise<string | undefined> {
  if (attrs.StringGenMask != null || !attrs.Shader || !attrs.GenMask || attrs.GenMask.trim() === '0') {
    return attrs.StringGenMask
  }
  const masks = await loadShaderGenMasks(attrs.Shader, context)
  return genMaskToString(attrs.GenMask, masks) || undefined
}
