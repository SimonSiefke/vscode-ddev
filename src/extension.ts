import * as vscode from 'vscode'
import { registerCommands } from './commands'
import * as manifest from '../package.json'

// TODO ddev progress: https://github.com/Microsoft/vscode-extension-samples/tree/master/progress-sample
/**
 * this is run when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.info(`[ddev] v${manifest.version} activated!`)
  registerCommands(context)
}

/**
 * this is run when the extension is deactivated
 */
export function deactivate() {}
