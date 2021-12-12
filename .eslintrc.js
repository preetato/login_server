module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: [],

  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'linebreak-style': ['error', 'unix'],
    // quotes: ['error', 'single'],
    semi: ['error', 'never'],
  },
}
