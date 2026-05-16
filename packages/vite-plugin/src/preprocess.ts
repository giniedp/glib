import { readFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'

const INCLUDE_RE = /^[ \t]*#include\s+"([^"]+)"\s*$/gm

export interface ResolveResult {
  source: string
  deps: Set<string>
}

export async function resolveIncludes(
  filePath: string,
  baseDir: string,
  deps = new Set<string>(),
  stack = new Set<string>(),
): Promise<ResolveResult> {
  const resolved = resolve(baseDir, filePath)

  if (stack.has(resolved)) {
    throw new Error(`Circular #include detected: ${resolved}\n  via ${[...stack].join(' → ')}`)
  }

  const raw = await readFile(resolved, 'utf8')
  stack = new Set(stack).add(resolved)

  const source = await replaceAsync(raw, INCLUDE_RE, async (_, includePath: string) => {
    const includeDir = dirname(resolved)
    const includeAbsolute = resolve(includeDir, includePath)
    deps.add(includeAbsolute)
    const nested = await resolveIncludes(includeAbsolute, includeDir, deps, stack)
    return nested.source
  })

  return { source, deps }
}

async function replaceAsync(
  str: string,
  re: RegExp,
  replacer: (match: string, ...args: string[]) => Promise<string>,
): Promise<string> {
  const matches: Array<{ index: number; match: string; args: string[] }> = []

  // reset lastIndex since the regex is stateful (global flag)
  re.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(str)) !== null) {
    matches.push({ index: m.index, match: m[0], args: m.slice(1) })
  }

  if (matches.length === 0) return str

  const replacements = await Promise.all(matches.map(({ match, args }) => replacer(match, ...args)))

  let result = ''
  let cursor = 0
  for (let i = 0; i < matches.length; i++) {
    result += str.slice(cursor, matches[i].index)
    result += replacements[i]
    cursor = matches[i].index + matches[i].match.length
  }
  result += str.slice(cursor)

  return result
}
