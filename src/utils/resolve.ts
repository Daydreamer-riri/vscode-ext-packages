import type { TextDocument, TextEditor } from 'vscode'
import { workspace } from 'vscode'

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
