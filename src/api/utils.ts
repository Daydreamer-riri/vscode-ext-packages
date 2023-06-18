import type Item from '../core/Item'

const workspacePrefix = 'workspace:'

export function protocolDep(item: Item) {
  if (item.value.slice(0, 10) === workspacePrefix) {
    return {
      version: [],
      info: `${item.value}: Workspace dependency`,
    }
  }

  if (item.value.startsWith('link:') || item.value.startsWith('file:')) {
    return {
      version: [],
      info: `${item.value}: Local dependency`,
    }
  }

  if (item.value.startsWith('git')) {
    return {
      version: [],
      info: `${item.value}: Git URLs dependency`,
    }
  }

  if (item.value.startsWith('http')) {
    return {
      version: [],
      info: `${item.value}: URLs dependencies`,
    }
  }

  return null
}
