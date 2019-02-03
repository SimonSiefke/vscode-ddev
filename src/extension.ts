import * as vscode from 'vscode'
import * as cp from 'child_process'

/**
 * this is run when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('[ddev] activated')
  registerCommands(context)
}

/**
 * these are the commands available from the command palette
 */
const commands = {
  ddevStart() {
    cp.exec('ddev start', (err, stdout) => {
      if (err) {
        vscode.window.showErrorMessage(`[ddev] ${stdout}`)
      } else {
        vscode.window.showInformationMessage(`[ddev] ${stdout}`)
      }
    })
  },
}

/**
 * register the all the commands
 */
function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.ddevStart', commands.ddevStart)
  )
}

/**
 * this is run when the extension is deactivated
 */
export function deactivate() {}
