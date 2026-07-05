import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { ggPlugin } from '@gglib/vite-plugin'
export default defineConfig({
  plugins: [
    ggPlugin({
      files: ['src/**/*.wgsl.ts'],
    }),
    dts({
      tsconfigPath: './tsconfig.json',
      outDir: 'dist',
      declarationOnly: false,
      copyDtsFiles: true,
      insertTypesEntry: true, // generates a root index.d.ts
    }),
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    lib: {
      entry: ['src/index.ts'],
      name: 'NwViewer',
      formats: ['es'],
      fileName: (format, input) => `nw-viewer.${format == 'es' ? 'module' : format}.js`,
    },
    rollupOptions: {
      external: (id) => id.startsWith('@gglib'),
      onwarn(warning, warn) {
        if (warning.code === 'UNUSED_EXTERNAL_IMPORT') return
        warn(warning)
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names.includes('index.css')) {
            return 'style.css'
          }
          return assetInfo.names[0]
        },
      },
    },
  },
})
