import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { ggPlugin } from '@gglib/vite-plugin'
export default defineConfig(({ mode }) => {
  const isApp = mode !== 'lib' && mode !== 'development'
  if (isApp) {
    return {
      plugins: [
        ggPlugin({
          files: ['src/**/*.wgsl.ts'],
        }),
      ],
      build: {
        outDir: 'dist/app',
        assetsDir: '',
        sourcemap: true,
      },
    }
  }

  return {
    server: {
      proxy: {
        '/levels': 'http://localhost:8000',
        '/files': 'http://localhost:8000',
        '/nwbt': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nwbt/, ''),
        },
      },
    },
    plugins: [
      ggPlugin({
        files: ['src/**/*.wgsl.ts'],
      }),
      dts({
        tsconfigPath: './tsconfig.json',
        outDir: 'dist/src',
        declarationOnly: false,
        copyDtsFiles: true,
        insertTypesEntry: true, // generates a root index.d.ts
      }),
    ],
    build: {
      outDir: 'dist/lib',
      sourcemap: true,
      cssCodeSplit: true,
      lib: {
        entry: ['src/index.ts'],
        name: 'NwViewer',
        formats: ['es'],
        fileName: (format, input) => `nw-viewer.${format == 'es' ? 'module' : format}.js`,
      },
      rollupOptions: {
        // external: (id) => id.startsWith('@gglib'),
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
  }
})
