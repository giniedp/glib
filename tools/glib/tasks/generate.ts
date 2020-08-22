import { dest, src, task } from 'gulp'

// task('generate:enums', (done) => {
//   return src('tools/enums.json')
//     .pipe(require('./plugins/gglib-enums.js')({
//       idl: ['tools/doc/*.idl'],
//     }))
//     .on('error', (error) => done(error))
//     .pipe(dest('dist'))
//     .on('end’', () => done())
// })
