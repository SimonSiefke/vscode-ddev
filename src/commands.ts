import * as vscode from 'vscode'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

/**
 *
 */
function isWorkspaceValid() {
  // 1. one folder must be open
  const hasDdevFolderOpen = vscode.workspace.rootPath
  if (!hasDdevFolderOpen) {
    vscode.window.showErrorMessage(`[ddev] you need to open a project first`, { modal: true })
    return false
  }

  // 2. only one folder mst be open
  const hasMultipleFoldersOpen = vscode.workspace.workspaceFolders.length >= 2
  if (hasMultipleFoldersOpen) {
    vscode.window.showErrorMessage(
      `[ddev] this extension currently only works with one open folder`,
      { modal: true }
    )
    return false
  }

  // 3. the folder must contain a .ddev folder
  const folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath
  const hasDdevFolderInside = fs.existsSync(path.join(folderPath, '.ddev'))
  if (!hasDdevFolderInside) {
    vscode.window.showErrorMessage(`[ddev] Couldn't find a .ddev folder inside your workspace`)
    return false
  }
  return true
}

/**
 * runs a command
 */
async function runCommand(command: string) {
  return new Promise((resolve, reject) => {
    const folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath
    cp.exec(`cd ${folderPath} && ${command}`, (error, stdout) => {
      console.log(stdout)
      if (error) {
        reject(new Error(`[ddev] ${stdout}`))
      } else {
        resolve()
      }
    })
  })
}

type Command = () => void

/**
 * these are the commands available from the command palette
 */
const commands: { [key: string]: Command } = {
  async ddevStart() {
    if (!isWorkspaceValid()) {
      return
    }
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '[ddev] Starting container...',
        cancellable: true,
      },
      () => runCommand('ddev start')
    )
    vscode.window.showInformationMessage(`[ddev] container started`)
  },
  async ddevStop() {
    if (!isWorkspaceValid()) {
      return
    }
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '[ddev] stopping container...',
        cancellable: true,
      },
      () => runCommand('ddev stop')
    )
    vscode.window.showInformationMessage(`[ddev] container stopped`)
  },
  async ddevComposerInstall() {
    if (!isWorkspaceValid()) {
      return
    }
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '[ddev] installing dependencies with composer',
        cancellable: true,
      },
      () => runCommand('ddev composer install')
    )
    vscode.window.showInformationMessage(`[ddev] composer dependencies installed`)
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
