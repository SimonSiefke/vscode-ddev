import * as vscode from 'vscode'
import * as util from 'util'

const exec = util.promisify(require('child_process').exec) // function for executing a shell command

/**
 * runs a command
 */
async function runCommand(command: string) {
  const hasDdevFolderOpen = vscode.workspace.rootPath
  if (!hasDdevFolderOpen) {
    vscode.window.showErrorMessage(`[ddev] you need to open a project first`, { modal: true })
    return
  }
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
  ddevStop() {
    runCommand('ddev stop')
  },
  ddevComposerInstall() {
    runCommand('ddev composer install')
  },
  ddevConfig() {
    runCommand('ddev config')
  },
  ddevImportDB() {
    runCommand('ddev import-db')
  },
  ddevExportDB() {
    runCommand('ddev export-db')
  },
}

/**
 * register the all the commands
 */
export function registerCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.ddevStart', commands.ddevStart),
    vscode.commands.registerCommand('extension.ddevStop', commands.ddevStop),
    vscode.commands.registerCommand('extension.ddevComposerInstall', commands.ddevComposerInstall),
    vscode.commands.registerCommand('extension.ddevConfig', commands.ddevConfig),
    vscode.commands.registerCommand('extension.ddevImportDB', commands.ddevImportDB),
    vscode.commands.registerCommand('extension.ddevExportDB', commands.ddevExportDB)
  )
}
