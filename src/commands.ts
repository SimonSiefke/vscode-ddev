import * as vscode from 'vscode'
import * as cp from 'child_process'

/**
 * runs a command
 */
async function runCommand(command: string) {
  console.log(`[ddev] ${JSON.stringify(vscode.workspace.workspaceFolders)}`)

  const hasDdevFolderOpen = vscode.workspace.rootPath
  if (!hasDdevFolderOpen) {
    vscode.window.showErrorMessage(`[ddev] you need to open a project first`, { modal: true })
    return
  }
  cp.exec(command, (error, stdout) => {
    if (error) {
      vscode.window.showErrorMessage(`[ddev] ${stdout}`)
    } else {
      vscode.window.showInformationMessage(`[ddev] ${stdout}`)
    }
  })
}

type Command = () => void

/**
 * these are the commands available from the command palette
 */
const commands: { [key: string]: Command } = {
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
