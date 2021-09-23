import * as path from 'path'
import * as sass from 'sass'
import Metalsmith from 'metalsmith'
import { MetalsmithFile } from './ms-metadata'
import wplog from 'webpack-log'

const log = wplog({
  name: 'ms-sass',
  timestamp: true,
})

function isAnySassFile(filename: string) {
  return filename.endsWith('.sass') || filename.endsWith('.scss')
}
function isPartial(filename: string) {
  return path.basename(filename)[0] === '_'
}

async function compile(config: sass.Options, filePath: string, content?: Buffer): Promise<sass.Result> {
  const fileDir = path.dirname(filePath)
  const fileName = path.basename(filePath)
  const opts: sass.Options = {
    outputStyle: 'compressed',
    // imagePath: '/',
    // outputDir: fileDir,
    indentedSyntax: fileName.endsWith('.sass'),
    ...config,
    includePaths: [...(config?.includePaths || [])],
    data: content?.toString(),
    file: filePath,
  }

  if (opts.sourceMap) {
    opts.outFile = filePath.replace(/\.s[ca]ss/, '.css')
  }

  // Append the file's base path to the available include paths.
  opts.includePaths.push(fileDir)

  return new Promise((resolve, reject) => {
    sass.render(opts, (err, result) => {
      if (err) {
        reject(err)
        return
      }
      resolve(result)
    })
  })
}

export default function plugin(options?: Partial<sass.Options>) {
  const config = options || {}
  return async (files: Record<string, MetalsmithFile>, smith: Metalsmith, done: Function) => {
    Promise.all(
      Object.keys(files)
        .filter(isAnySassFile)
        .filter((it) => {
          if (!isPartial(it)) return true
          delete files[it]
        })
        .map((file) => {
          compile(config, path.join(smith.source(), file), files[file].contents)
            .then((result) => {
              if (result.map) {
                files[file.replace(/\.s[ca]ss$/, '.map')] = {
                  contents: result.map,
                  mode: files[file].mode,
                } as any
              }
              files[file].contents = Buffer.from(result.css)
              files[file.replace(/\.s[ca]ss$/, '.css')] = files[file]
              delete files[file]
            })
            .catch(log.error)
        }),
    ).then(() => done())
  }
}
