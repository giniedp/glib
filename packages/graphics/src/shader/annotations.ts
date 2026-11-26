export const ShaderAnnotations = {
  Block: 'block',
  Alias: 'alias',
  /**
   * Marks a sampler uniform as a storage buffer emulated by a float texture, the value names the element type
   */
  Storage: 'storage',
  /**
   * Marks a WGSL texture that is never sampled with a filtering sampler. Required to bind 32 bit float formats on
   * devices that can't filter them. WGSL has no type for it
   */
  Unfilterable: 'unfilterable',
}

export function parseAnnotations(source: string | string[], out: Record<string, any> = {}): Record<string, any> {
  source = source || ''
  const list = Array.isArray(source) ? source : source.split('\n')
  for (const item of list) {
    for (const line of item.split('\n')) {
      const match = line.match(/^\s*@\s*(\w+)\s*(.*)\s*/)
      if (match) {
        out[match[1]] = match[2].trim()
      }
    }
  }
  return out
}
