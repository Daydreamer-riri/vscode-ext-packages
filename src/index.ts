import type { DocumentSelector, ExtensionContext } from 'vscode'
import { languages, window, workspace } from 'vscode'
import Commands from './json/commands'
import listener, { throttledListener } from './core/listener'
import { VersionCompletions } from './providers/autoCompletion'

export function activate(context: ExtensionContext) {
  window.showInformationMessage('Hello')
  const documentSelector: DocumentSelector = { language: 'json', pattern: '**/package.json' }

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(listener),
    workspace.onDidChangeTextDocument((e) => {
      const { fileName } = e.document
      if (fileName.toLocaleLowerCase().endsWith('package.json')) {
        // if (!e.document.isDirty)
        //   jsonListener(window.activeTextEditor)
        throttledListener(window.activeTextEditor)
      }
    }),

    // Register our versions completions provider
    languages.registerCompletionItemProvider(
      documentSelector,
      new VersionCompletions(),
      '\'', '"', '.', '+', '-',
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ),
  )

  listener(window.activeTextEditor)
  context.subscriptions.push(Commands.replaceVersion)
}

export function deactivate() {

}
