function prepareSnippet(snippet: string): string {
  const lines = snippet.split(/\n/)

  // detect indents
  let minIndent = Number.MAX_VALUE
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].replace('\t', '  ')
    if (lines[i].trim()) {
      minIndent = Math.min(minIndent, lines[i].match(/^(\s*)/)[1].length)
    }
  }

  // remove indents
  for (let i = 0; i < lines.length; i++) {
    lines[i] = lines[i].substr(minIndent)
  }

  // remobe leading blank lines
  while (lines.length && !lines[0].trim()) {
    lines.shift()
  }
  // remove trailing blank lines
  while (lines.length && !lines[lines.length - 1].trim()) {
    lines.pop()
  }

  return lines.join('\n')
}

export function glsl(str: TemplateStringsArray): string {
  return prepareSnippet(str.join('\n'))
}
