import * as vscode from 'vscode'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import * as Url from 'url-parse'

import opn = require('opn')

/**
 * returns the path of the currently open folder in vscode
 */
function cwd() {
  return vscode.workspace.workspaceFolders[0].uri.fsPath
}

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

  // 2. only one folder must be open
  const hasMultipleFoldersOpen = vscode.workspace.workspaceFolders.length >= 2
  if (hasMultipleFoldersOpen) {
    vscode.window.showErrorMessage(
      `[ddev] this extension currently only works with one open folder`,
      { modal: true }
    )
    return false
  }

  // 3. the folder must contain a .ddev folder

  const hasDdevFolderInside = fs.existsSync(path.join(cwd(), '.ddev'))
  if (!hasDdevFolderInside) {
    vscode.window.showErrorMessage(`[ddev] Couldn't find a .ddev folder inside your workspace`)
    return false
  }
  return true
}

/**
 * runs a command
 */
async function runCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.exec(command, { cwd: cwd() }, (error, stdout: string) => {
      // composer doesn't throw an error, but prints it to the console
      const isProbablyComposerError = stdout.includes('could not find')
      // sql doesn't throw an error, but prints it to the console
      const isProbablySQLError = stdout.includes('ERROR')
      if (isProbablyComposerError || isProbablySQLError) {
        reject(new Error(`[ddev] ${stdout}`))
      }
      if (error) {
        reject(new Error(`[ddev] ${stdout}`))
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

type Command = () => void

/**
 * these are the commands available from the command palette
 */
const commands: { [key: string]: Command } = {
  /**
   * ddev start command
   */
  async ddevStart() {
    if (!isWorkspaceValid()) {
      return
    }
    let info: string
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: '[ddev] Starting container...',
        cancellable: true,
      },
      async () => {
        info = await runCommand('ddev start')
      }
    )
    const localhostUrl = new Url(info.match(/http:\/\/127.*$/)[0])
    vscode.window.showInformationMessage(`[ddev] running on localhost:${localhostUrl.port}`)
    if (vscode.workspace.getConfiguration('ddev').autoOpen) {
      const browser = vscode.workspace.getConfiguration('ddev').defaultBrowser
      try {
        await opn(localhostUrl.toString(), { app: browser })
      } catch {
        vscode.window.showErrorMessage(
          `[ddev] Opening browser failed. Please check if you have installed the browser ${browser} correctly!`
        )
      }
    }
  },
  /**
   * ddev stop command
   */
  async ddevStop() {
    if (!isWorkspaceValid()) {
      return
    }
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '[ddev] stopping container...',
          cancellable: true,
        },
        () => runCommand('ddev stop')
      )
      vscode.window.showInformationMessage(`[ddev] container stopped`)
    } catch (error) {
      vscode.window.showErrorMessage(error.message)
    }
  },
  /**
   * ddev composer install command
   */
  async ddevComposerInstall() {
    // TODO check if composer.json exists and handle print a pretty error message
    if (!isWorkspaceValid()) {
      return
    }
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '[ddev] installing dependencies with composer',
          cancellable: true,
        },
        () => runCommand('ddev composer install')
      )
      vscode.window.showInformationMessage(`[ddev] composer dependencies installed`)
    } catch (error) {
      vscode.window.showErrorMessage(error.message)
    }
  },
  /**
   * ddev config command
   */
  ddevConfig() {
    // TODO
    runCommand('ddev config')
  },
  /**
   * ddev import db command
   */
  async ddevImportDB() {
    if (!isWorkspaceValid()) {
      return
    }
    // search for sql files in the current folder
    glob(
      '**/*.+(sql|sql.gz|tar|tar.gz|zip)',
      { ignore: '**/+(node_modules|vendor|web|.git|import-db)/**', cwd: cwd(), dot: true },
      async (_, files) => {
        if (files.length === 0) {
          vscode.window.showErrorMessage("[ddev] couldn't find a database to import")
          return
        }
        // let the user select a database
        const selected = await vscode.window.showQuickPick(files)
        try {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `[ddev] importing ${selected}`,
            },
            // import the selected database
            () => runCommand(`ddev import-db --src=${selected}`)
          )
          vscode.window.showInformationMessage(`[ddev] ${selected} imported`)
        } catch (error) {
          vscode.window.showErrorMessage(error.message)
        }
      }
    )
  },
  /**
   * ddev export db command
   */
  ddevExportDB() {
    // TODO
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
