import { defineConfig } from 'vitest/config'

export default defineConfig({

  test: {

    browser: {
      enabled: true,
      provider: 'playwright',
      screenshotFailures: false,
      instances: [
        {
          browser: 'chromium',

          launch: {

          },
          context: {

          },
        },
      ],
    },
  },
})
