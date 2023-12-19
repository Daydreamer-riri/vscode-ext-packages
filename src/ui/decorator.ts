import type { DecorationOptions, TextEditor, TextEditorDecorationType } from 'vscode'
import { workspace } from 'vscode'
import type Dependency from '../core/Dependency'
import decoration, { latestVersion } from './decoration'
import { statusBarItem } from './indicators'

// eslint-disable-next-line import/no-mutable-exports
export let decorationHandle: TextEditorDecorationType

export default function decorate(editor: TextEditor, dependencies: Dependency[]) {
  const pref = loadPref(editor)

  const errors: string[] = []
  const filtered = dependencies.filter(dep => {
    if (dep && !dep.error && (dep.versions && dep.versions.length))
      return dep
    else if (!dep.error)
      dep.error = `${dep.item.key}: ` + 'No versions found'
    errors.push(`${dep.error}`)
    return dep
  })
  const options: DecorationOptions[] = []

  for (let i = filtered.length - 1; i > -1; i--) {
    const dependency = filtered[i]
    try {
      const decor = decoration(
        editor,
        dependency.item,
        dependency.versions || [],
        pref.compatibleDecorator,
        pref.incompatibleDecorator,
        pref.errorDecorator,
        dependency.error,
        dependency.info,
      )

      if (decor)
        options.push(decor)
    }
    catch (e) {
      console.error(e)
      errors.push(`Failed to build build decorator (${dependency.item.value})`)
    }
  }

  if (decorationHandle)
    decorationHandle.dispose()

  decorationHandle = latestVersion()
  editor.setDecorations(decorationHandle, options)

  // if (errors.length)
  //   statusBarItem.setText('❗️ Completed with errors')
  // else
  statusBarItem.setText('OK')
}

function loadPref(editor: TextEditor) {
  const config = workspace.getConfiguration('', editor.document.uri)
  const compatibleDecorator = config.get<string>('packages.compatibleDecorator') ?? ''
  const incompatibleDecorator = config.get<string>('packages.incompatibleDecorator') ?? ''
  const errorText = config.get<string>('packages.errorDecorator')
  const errorDecorator = errorText ? `${errorText}` : ''
  return {
    compatibleDecorator,
    incompatibleDecorator,
    errorDecorator,
  }
}
