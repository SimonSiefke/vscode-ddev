import * as vscode from 'vscode'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
/**
 * runs a command
 */
async function runCommand(command: string) {
  return new Promise((resolve, reject) => {
    const hasDdevFolderOpen = vscode.workspace.rootPath
    if (!hasDdevFolderOpen) {
      vscode.window.showErrorMessage(`[ddev] you need to open a project first`, { modal: true })
      reject()
    }
    const hasMultipleFoldersOpen = vscode.workspace.workspaceFolders.length >= 2
    if (hasMultipleFoldersOpen) {
      vscode.window.showErrorMessage(
        `[ddev] this extension currently only works with one open folder`,
        { modal: true }
      )
      reject()
    }

    const folderPath = vscode.workspace.workspaceFolders[0].uri.fsPath
    const hasDdevFolderInside = fs.existsSync(path.join(folderPath, '.ddev'))
    if (!hasDdevFolderInside) {
      vscode.window.showInformationMessage(
        `[ddev] Couldn't find a .ddev folder in your workspace`,
        {
          modal: true,
        }
      )
      reject()
    }
    cp.exec(`cd ${folderPath} && ${command}`, (error, stdout) => {
      if (error) {
        vscode.window.showErrorMessage(`[ddev] ${stdout}`)
        reject()
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
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Starting ddev container...',
        cancellable: true,
      },
      (progress, token) => {
        token.onCancellationRequested(() => {
          console.log('User canceled the long running operation')
        })
        return runCommand('ddev start')
      }
    )
    vscode.window.showInformationMessage(`ddev container started`)
  },
  async ddevStop() {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Stopping ddev container...',
        cancellable: true,
      },
      (progress, token) => {
        token.onCancellationRequested(() => {
          console.log('User canceled the long running operation')
        })
        return runCommand('ddev stop')
      }
    )
    vscode.window.showInformationMessage(`ddev container stopped`)
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
