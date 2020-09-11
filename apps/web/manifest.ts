import * as path from 'path'
export default {
  cwd: __dirname,
  dist: path.join(__dirname, 'dist'),
  src: path.join(__dirname, 'src'),
  styles: {
    build: [
      'src/**/*.scss',
      '!src/**/_*',
    ],
    watch: ['src/**/*.scss']
  },
  scripts: {
    build: 'src/**/*.ts',
    watch: 'src/**/*.ts',
  },
  pages: {
    build: [
      'src/**/*.*',
      '!src/docs/**/*.*',
      '!src/**/*.scss',
    ],
    watch: [
      'src/**/*.*',
      '!src/**/*.scss',
    ]
  },
  get assets() {
    return [
      ...[
        '@gglib/gglib/dist/bundles/gglib.umd.js',
        '@gglib/gglib/dist/bundles/gglib.umd.js.map',
        '@gglib/math/dist/bundles/math.umd.js',
        '@gglib/math/dist/bundles/math.umd.js.map',
        'tweak-ui/dist/tweak-ui.umd.js',
        'tweak-ui/dist/tweak-ui.umd.js.map',
        'tweak-ui/dist/tweak-ui.css',
        'tweak-ui/dist/tweak-ui.css.map',
        'showdown/dist/showdown.js',
        'prismjs/prism.js',
        'prismjs/components/prism-typescript.js',
        'mithril/mithril.js',
        'ammojs-typed/ammo/ammo.js',
      ].map((it) => require.resolve(it)),
      '../../assets/**/*'
    ]
  }
}
