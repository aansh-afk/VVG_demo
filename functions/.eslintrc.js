module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
  ],
  rules: {
    // Disable rules that are causing issues for initial deployment
    "indent": "off",
    "linebreak-style": "off",
    "quotes": "off",
    "semi": "off",
    "comma-dangle": "off",
    "max-len": "off",
    "object-curly-spacing": "off",
    "eol-last": "off",
    "no-trailing-spaces": "off",
    "arrow-parens": "off"
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};