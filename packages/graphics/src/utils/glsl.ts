function prepareSnippet(snippet: string): string {
  // TODO: should be removed as it adds to initial script processing time
  // removes leading indents and trailing whitespaces as well as whitespaces

  const lines = snippet.split(/\n/)

  // detect indents
  let minIndent = Number.MAX_VALUE
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace(/\t/g, '  ')
    if (lines[i].trim()) {
      minIndent = Math.min(minIndent, lines[i].match(/^(\s*)/)[1].length)
    }
  }

  // remove indents
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].substr(minIndent)
  }

  // remove leading blank lines
  while (lines.length && !lines[0].trim()) {
    lines.shift()
  }
  // remove trailing blank lines
  while (lines.length && !lines[lines.length - 1].trim()) {
    lines.pop()
  }

  return lines.join('\n')
}

/**
 * A template string function for glsl source code
 *
 * @public
 * @remarks
 * This has no runtime functionality. It is a development
 * tool that allows allows code editors (e.g. VSCode) to
 * highlight glsl source code inside a typescript file
 * with glsl highlighter.
 */
export function glsl(str: TemplateStringsArray): string {
  return prepareSnippet(str.join('\n'))
}
