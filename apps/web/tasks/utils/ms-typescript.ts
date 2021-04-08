import * as path from 'path'
import { CompilerOptions } from 'typescript'
import { MetalsmithFile } from './ms-metadata';
import { transpileTs } from './transpile-ts';
import wplog from 'webpack-log'
import Metalsmith from 'metalsmith';

const log = wplog({
  name: 'ms-typescript',
  timestamp: true,
})

export default (options?: { keepOriginal?: boolean, compilerOptions?: CompilerOptions }) =>{
  return function(files: Record<string, MetalsmithFile>, smith: Metalsmith) {
    for (const file of Object.keys(files)) {
      if (!file.endsWith('.ts')) {
        continue
      }
      try {
        const content = transpileTs(path.join(smith.source(), file), files[file].contents.toString(), options?.compilerOptions)
        const data = files[file]
        files[file.replace(/\.ts$/, '.js')] = {
          ...data,
          contents: Buffer.from(content)
        }
      } catch (e) {
        log.error('failed to trainspile file', path.join(smith.source(), file), '\n', e)
      }
      if (!options?.keepOriginal) {
        delete files[file]
      }
    }
  };
}

