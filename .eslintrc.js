module.exports = {
  env: {
    browser: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // project: 'packages/tsconfig.eslint.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-dupe-class-members': 'off',
    'no-redeclare': 'off',
  },
}
