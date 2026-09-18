import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    benchmark: {
      enabled: true,
    },
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: {
          args: ['--window-position=0,0', '--window-size=800,600'],
        },
        contextOptions: {
          colorScheme: 'dark',
        },
      }),
      screenshotFailures: false,
      instances: [
        {
          browser: 'chromium',
        },
      ],
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
