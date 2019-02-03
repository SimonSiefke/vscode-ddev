import * as vscode from 'vscode'
import * as util from 'util'

const exec = util.promisify(require('child_process').exec)

/**
 * runs a command
 */
async function runCommand(command: string) {
  const { err, stdout } = await exec(command)
  if (err) {
    vscode.window.showErrorMessage(`[ddev] ${stdout}`)
  } else {
    vscode.window.showInformationMessage(`[ddev] ${stdout}`)
  }
}

/**
 * these are the commands available from the command palette
 */
const commands = {
  ddevStart() {
    runCommand('ddev start')
  },
  ddevComposerInstall() {
    runCommand('ddev composer install')
  },
}

/**
 * register the all the commands
 */
export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.ddevStart', commands.ddevStart),
    vscode.commands.registerCommand('extension.ddevComposerInstall', commands.ddevComposerInstall)
  )
}
