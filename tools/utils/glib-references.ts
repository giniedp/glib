import * as fs from 'fs'
import * as glob from 'glob'

export function glibReferences(options: {
  srcDir: string,
  exclude: string[]
}) {
  const result = new Set<string>()
  for (const file of glob.sync(`${options.srcDir}/**/*.ts`)) {
    const fileContent = fs.readFileSync(file).toString()
    const importFromGglib = fileContent.match(/from ["']@gglib\/(\w+([\-/_]\w+)*)["']/g)
    importFromGglib?.forEach((value) => {
      const m = value.match(/from ["'](@gglib\/\w+([\-/_]\w+)*)["']/)
      if (m && !options.exclude.includes(m[1])) {
        result.add(m[1])
      }
    })
  }
  return Array.from(result.values())
}
