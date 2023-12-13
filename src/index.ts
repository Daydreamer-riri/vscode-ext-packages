import type { ExtensionContext } from 'vscode'
import Commands from './commands/commands'
import { registerAutoCompletion } from './providers/autoCompletion'
import { registerListener } from './core/listener'
import { saveCache } from './api'

export function activate(context: ExtensionContext) {
  registerListener(context)
  registerAutoCompletion(context)
  context.subscriptions.push(Commands.replaceVersion)
}

export function deactivate() {
  saveCache()
}
