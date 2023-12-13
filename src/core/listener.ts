/* eslint-disable import/no-mutable-exports */
import type { ExtensionContext, Position, TextDocument, TextEditor } from 'vscode'
import { Range, window, workspace } from 'vscode'

import decorate, { decorationHandle } from '../ui/decorator'
import { parseJson } from '../json/parse'
import { status } from '../commands/commands'
import { statusBarItem } from '../ui/indicators'
import type Dependency from './Dependency'
import type Item from './Item'
import { fetchPackageVersions } from './fetcher'

function parseDeps(text: string): Item[] {
  return parseJson(text)
}

let dependencies: Item[]
let fetchedDeps: Dependency[]
let fetchedDepsMap: Map<string, Dependency[]>
export { dependencies, fetchedDeps, fetchedDepsMap }

export function getFetchedDependency(document: TextDocument, dep: string, position: Position): Dependency | undefined {
  const fetchedDep = fetchedDepsMap.get(dep)
  if (!fetchedDep)
    return
  if (fetchedDep.length === 1) {
    return fetchedDep[0]
  }
  else {
    for (let i = 0; i < fetchedDep.length; i++) {
      const range = new Range(
        document.positionAt(fetchedDep[i].item.start + 1),
        document.positionAt(fetchedDep[i].item.end),
      )
      if (range.contains(position))
        return fetchedDep[i]
    }
  }
}

export async function parseAndDecorate(
  editor: TextEditor,
  _wasSaved = false,
  fetchDeps = true,
) {
  const text = editor.document.getText()
  // const config = workspace.getConfiguration('', editor.document.uri)

  try {
    dependencies = parseDeps(text)
    if (fetchDeps || !fetchedDeps || !fetchedDepsMap) {
      const data = await fetchPackageVersions(dependencies)
      fetchedDeps = data[0]
      fetchedDepsMap = data[1]
    }
    decorate(editor, fetchedDeps)
  }
  catch (e) {
    console.error(e)
    statusBarItem.setText('package.json is not valid!')
    if (decorationHandle)
      decorationHandle.dispose()
  }
}

export default async function listener(editor: TextEditor | undefined) {
  if (editor) {
    const { fileName } = editor.document
    if (fileName.toLocaleLowerCase().endsWith('package.json')) {
      status.inProgress = true
      status.replaceItems = []
      statusBarItem.show()
      await parseAndDecorate(editor)
    }
    else {
      statusBarItem.hide()
    }
    status.inProgress = false
  }
  else {
    console.log('No active edtior found.')
  }

  return Promise.resolve()
}

let throttleId: NodeJS.Timeout | undefined

export const throttledListener = (editor: TextEditor | undefined, timeout = 0) => {
  if (throttleId)
    clearTimeout(throttleId)
  throttleId = setTimeout(() => {
    listener(editor)
    throttleId = undefined
  }, timeout)
}

export function registerListener(context: ExtensionContext) {
  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(listener),
    workspace.onDidChangeTextDocument((e) => {
      const { fileName } = e.document
      if (fileName.toLocaleLowerCase().endsWith('package.json')) {
        if (!e.document.isDirty)
          throttledListener(window.activeTextEditor)
      }
    }),
  )

  listener(window.activeTextEditor)
}
