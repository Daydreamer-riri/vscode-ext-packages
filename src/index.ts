import type { ExtensionContext } from 'vscode'
import Commands from './commands/commands'
import { saveCache } from './api'
import { registerAutoCompletion } from './providers/autoCompletion'
import { registerListener } from './core/listener'

export function activate(context: ExtensionContext) {
  registerListener(context)
  registerAutoCompletion(context)
  context.subscriptions.push(Commands.replaceVersion)
}

export function deactivate() {
  saveCache()
}
