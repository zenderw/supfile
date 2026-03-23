module.exports = {
  extends: ['../../.eslintrc.cjs'],
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
  env: { browser: false, node: true, es2022: true },
};
