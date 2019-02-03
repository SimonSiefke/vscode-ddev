import * as vscode from 'vscode'
import { registerCommands } from './commands'

/**
 * this is run when the extension is activated
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('[ddev] activated')
  registerCommands(context)
}

/**
 * this is run when the extension is deactivated
 */
export function deactivate() {}
