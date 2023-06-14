// ported from: https://github.com/raineorshine/npm-check-updates/blob/master/lib/package-managers/npm.js

import path from 'node:path'
import NpmcliConfig from '@npmcli/config'
import type { TextDocument, TextEditor } from 'vscode'
import { window, workspace } from 'vscode'

const getNpmConfig = async () => {
  const root = getWorkspaceFolderPath(window.activeTextEditor)

  const npmcliConfig = new NpmcliConfig({
    definitions: {},
    npmPath: path.dirname(root ?? process.cwd()),
    flatten: (current, total) => {
      Object.assign(total, current)
    },
  })

  // patch loadDefaults to set defaults of userconfig and globalconfig
  const oldLoadDefaults = npmcliConfig.loadDefaults.bind(npmcliConfig)
  npmcliConfig.loadDefaults = () => {
    oldLoadDefaults()

    const setCliOption = (key: string, value: any) => {
      const cli = npmcliConfig.data.get('cli')
      if (cli)
        cli.data[key] = value
    }
    setCliOption('userconfig', path.join(npmcliConfig.home, '.npmrc'))
    setCliOption('globalconfig', path.join(npmcliConfig.globalPrefix, 'etc', 'npmrc'))
  }

  await npmcliConfig.load()
  return npmcliConfig.flat
}

export function getWorkspaceFolderPath(
  documentOrEditor?: TextDocument | TextEditor,
) {
  if (!documentOrEditor)
    return
  const document = isEditor(documentOrEditor)
    ? documentOrEditor.document
    : documentOrEditor
  return workspace.getWorkspaceFolder(document.uri)?.uri.fsPath
}

function isEditor(
  documentOrEditor: TextDocument | TextEditor,
): documentOrEditor is TextEditor {
  return (documentOrEditor as any).document != null
}

export { getNpmConfig }
