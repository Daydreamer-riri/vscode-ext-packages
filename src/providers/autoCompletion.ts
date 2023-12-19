import type {
  CancellationToken,
  CompletionContext,
  CompletionItemProvider,
  ExtensionContext,
  ProviderResult,
  TextDocument,
} from 'vscode'
import {
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  Position,
  Range,
  languages,
} from 'vscode'

import { fetchedDepsMap, getFetchedDependency } from '../core/listener'
import { RE_VERSION } from '../json/parse'
import { prefixs } from '../constants'

export function registerAutoCompletion(context: ExtensionContext) {
  const documentSelector = { language: 'json', pattern: '**/package.json' }

  context.subscriptions.push(
    // Register our versions completions provider
    languages.registerCompletionItemProvider(
      documentSelector,
      new VersionCompletions(),
      // eslint-disable-next-line antfu/consistent-list-newline
      '\'', '"', '.', '+', '-',
      // eslint-disable-next-line antfu/consistent-list-newline
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ),
  )
}

const alphabet = 'abcdefghijklmnopqrstuvwxyz'
export function sortText(i: number): string {
  // This function generates an appropriate alphabetic sortText for the given number.
  const columns = Math.floor(i / alphabet.length)
  const letter = alphabet[i % alphabet.length]
  return 'z'.repeat(columns) + letter
}

export class VersionCompletions implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    _token: CancellationToken,
    _context: CompletionContext,
  ): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    if (!fetchedDepsMap)
      return

    const match = document.lineAt(position).text.match(RE_VERSION)
    if (match) {
      const packageName = match[1]
      const version = match[4]

      const fetchedDep = getFetchedDependency(document, packageName, position)
      if (!fetchedDep || !fetchedDep.versions)
        return

      const versionStart = match[0].indexOf(match[2]) + match[2].length + match[3]?.length || 0
      const versionEnd = versionStart + version.length
      if (
        !new Range(
          new Position(position.line, versionStart),
          new Position(position.line, versionEnd),
        ).contains(position)
      )
        return

      if (version.trim().length !== 0) {
        const range = new Range(
          new Position(position.line, prefixs.includes(version[0]) ? versionStart + 1 : versionStart),
          new Position(position.line, versionEnd),
        )

        let i = 0
        const completionItems = fetchedDep.versions.map(version => {
          const item = new CompletionItem(version, CompletionItemKind.Class)
          item.range = range
          item.preselect = i === 0
          item.sortText = sortText(i++)
          return item
        })
        return new CompletionList(
          completionItems,
          true,
        )
      }
      else if (position.character !== versionEnd + 1) {
        return fetchedDep.versionCompletionItems
      }
    }
  }
}
