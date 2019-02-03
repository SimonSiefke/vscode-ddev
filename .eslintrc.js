module.exports = {
  extends: ['bitworkers'],
  rules: {
    'import/no-unresolved': ['error', { ignore: ['vscode'] }],
  },
}
