import { ggPlugin } from '@gglib/vite-plugin'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import solidPlugin from 'vite-plugin-solid'
export default defineConfig(({ mode }) => {
  const isApp = mode !== 'lib' && mode !== 'development'
  if (isApp) {
    return {
      resolve: {
        dedupe: ['solid-js'],
      },
      plugins: [
        solidPlugin(),
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
      // HTTPS for access from other machines: WebGPU needs a secure context, plain http only counts on localhost.
      // NW_VIEWER_TLS_DIR is a directory with cert.pem and key.pem, e.g. the nwbt certificate (E:/nw-buddy/.nwbt/tls)
      https: process.env.NW_VIEWER_TLS_DIR
        ? {
            cert: fs.readFileSync(path.join(process.env.NW_VIEWER_TLS_DIR, 'cert.pem')),
            key: fs.readFileSync(path.join(process.env.NW_VIEWER_TLS_DIR, 'key.pem')),
          }
        : undefined,
      proxy: {
        '/levels': 'http://localhost:8000',
        '/files': 'http://localhost:8000',
        '/nwbt': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/nwbt/, ''),
        },
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'credentialless',
      },
    },
    resolve: {
      // the components of tweak-ui and of the viewer must share one reactive runtime
      dedupe: ['solid-js'],
    },
    worker: {
      format: 'es',
    },
    plugins: [
      solidPlugin(),
      ggPlugin({
        files: ['src/**/*.wgsl.ts'],
      }),
      // dts({
      //   tsconfigPath: './tsconfig.json',
      //   outDir: 'dist/src',
      //   declarationOnly: false,
      //   copyDtsFiles: true,
      //   insertTypesEntry: true, // generates a root index.d.ts
      // }),
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
