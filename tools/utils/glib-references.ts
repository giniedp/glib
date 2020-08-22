import * as glob from 'glob'
import * as fs from 'fs'

export function glibReferences(dir: string) {
  const result = new Set<string>()
  glob.sync(`${dir}/**/*.ts`).forEach((file) => {
    fs.readFileSync(file)
      .toString()
      .match(/from ["']@gglib\/(\w+([\-/_]\w+)*)["']/g)
      ?.forEach((value) => {
        const m = value.match(/from ["'](@gglib\/\w+([\-/_]\w+)*)["']/)
        if (m && m[1] !== this.packageName) {
          result.add(m[1])
        }
      })
  })
  return Array.from(result.values())
}
