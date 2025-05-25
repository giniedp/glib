import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      instances: [
        {
          browser: 'chrome',
          launch: {},
          context: {},
        },
      ],
      //provider: 'playwright',
    },
  },
})
