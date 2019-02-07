import * as vscode from 'vscode'
import * as cp from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as glob from 'glob'
import * as Url from 'url-parse'

import opn = require('opn')

const debug =
  process.env.NODE_ENV === 'development' ||
  vscode.workspace.getConfiguration('ddev').loglevel === 'debug'

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
async function runCommand(
  {
    command,
    args = [],
  }: {
    command: string
    args: string[]
  },
  token?: vscode.CancellationToken
): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = cp.spawn(command, args, { cwd: cwd() })
    if (token) {
      token.onCancellationRequested(() => {
        if (debug) {
          console.log('[ddev] operation was canceled by user')
        }
        process.kill()
      })
    }
    let totalData = ``
    process.stdout.on('data', async dataBuffer => {
      const data = dataBuffer.toString()
      if (debug) {
        console.log(`[ddev] ${data}`)
      }
      if (data.includes('May we send anonymous ddev usage statistics and errors?')) {
        const choice = await vscode.window.showQuickPick(
          [{ label: 'yes' }, { label: 'no' }],
          {
            placeHolder: 'Allow ddev to send anonymous usage statistics?',
            ignoreFocusOut: true,
          },
          token
        )
        switch (choice.label) {
          case 'yes':
            process.stdin.write('Y\n')
            if (debug) {
              console.log('Y\n')
            }
            break
          case 'no':
            process.stdin.write('n\n')
            if (debug) {
              console.log('n\n')
            }
            break
          default:
            throw new Error('[ddev] invalid choice')
        }
      }
      totalData += data
    })
    process.on('error', err => {
      reject(err)
    })

    process.on('exit', code => {
      // composer doesn't throw an error, but prints it to the console
      const isProbablyComposerError = totalData.includes('could not find')
      // sql doesn't throw an error, but prints it to the console
      const isProbablySQLError = totalData.includes('ERROR')
      if (isProbablyComposerError || isProbablySQLError) {
        reject(new Error(totalData))
      }
      if (code) {
        if (debug) {
          console.log(`[ddev] command exited with status ${code}`)
        }
        reject(new Error(`command exited with status ${code}`))
      } else {
        resolve(totalData.trim())
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
    let canceled = false
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '[ddev] Starting container...',
          cancellable: true,
        },
        async (progress, token) => {
          token.onCancellationRequested(() => {
            canceled = true
          })
          info = await runCommand({ command: 'ddev', args: ['start'] }, token)
        }
      )
    } catch (error) {
      if (debug) {
        console.log(`[ddev] ${error.message}`)
      }
      vscode.window.showErrorMessage(error.message)
      return
    }
    if (canceled) {
      return
    }
    const localhostUrl = new Url(info.match(/http:\/\/127.*$/)[0])
    if (vscode.workspace.getConfiguration('ddev').autoOpen) {
      const browser = vscode.workspace.getConfiguration('ddev').defaultBrowser
      try {
        await opn(localhostUrl.toString(), { app: browser })
      } catch {
        vscode.window.showErrorMessage(
          `[ddev] Opening browser failed. Please check if you have installed the browser ${browser} correctly!`
        )
      }
    } else {
      vscode.window.showInformationMessage(`[ddev] running on localhost:${localhostUrl.port}`)
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
        },
        () => runCommand({ command: 'ddev', args: ['stop'] })
      )
    } catch (error) {
      if (debug) {
        console.log(`[ddev] ${error.message}`)
      }
      vscode.window.showErrorMessage(error.message)
      return
    }
    vscode.window.showInformationMessage(`[ddev] container stopped`)
  },
  /**
   * ddev composer install command
   */
  async ddevComposerInstall() {
    // TODO check if composer.json exists and handle print a pretty error message
    if (!isWorkspaceValid()) {
      return
    }
    let canceled = false
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: '[ddev] installing dependencies with composer',
          cancellable: true,
        },
        (progress, token) => {
          token.onCancellationRequested(() => {
            canceled = true
          })
          return runCommand({ command: 'ddev', args: ['composer', 'install'] }, token)
        }
      )
    } catch (error) {
      if (debug) {
        console.log(`[ddev] ${error.message}`)
      }
      vscode.window.showErrorMessage(error.message)
      return
    }
    if (canceled) {
      return
    }
    vscode.window.showInformationMessage(`[ddev] composer dependencies installed`)
  },
  /**
   * ddev config command
   */
  ddevConfig() {
    // TODO
    // runCommand('ddev config')
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
        let canceled = false
        try {
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: `[ddev] importing ${selected}`,
            },
            // import the selected database
            (progress, token) => {
              token.onCancellationRequested(() => {
                canceled = true
              })
              return runCommand(
                {
                  command: `ddev`,
                  args: [`import-db`, `--src=${selected}`],
                },
                token
              )
            }
          )
        } catch (error) {
          if (debug) {
            console.log(`[ddev] ${error.message}`)
          }
          vscode.window.showErrorMessage(error.message)
        }
        if (canceled) {
          return
        }
        vscode.window.showInformationMessage(`[ddev] ${selected} imported`)
      }
    )
  },
  /**
   * ddev export db command
   */
  ddevExportDB() {
    // TODO
    // runCommand('ddev export-db')
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
