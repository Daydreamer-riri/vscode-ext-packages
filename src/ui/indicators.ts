/**
 * A utility to manage Status Bar operations.
 */
import type { StatusBarItem } from 'vscode'
import { StatusBarAlignment, window } from 'vscode'

/**
 * Extends StatusBarItem in order to add support prefixed text changes.
 */
interface StatusBarItemExt extends StatusBarItem {
  setText: (name?: string) => void
}

export const statusBarItem: StatusBarItemExt = window.createStatusBarItem(
  StatusBarAlignment.Left,
  0,
) as StatusBarItemExt
statusBarItem.text = 'Packages: OK'
statusBarItem.setText = (text?: string) =>
  (statusBarItem.text = text ? `Packages: ${text}` : 'Packages: OK')

export default {
  statusBarItem,
}
