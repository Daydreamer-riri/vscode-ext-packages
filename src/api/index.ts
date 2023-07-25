import { window } from 'vscode'
import type Item from '../core/Item'
import { now, ttl } from '../utils/ttl'
import { getWorkspaceFolderPath } from '../utils/resolve'
import { dumpCache, loadCache } from './cache'
import { version } from './version'
import { protocolDep } from './utils'

const cacheInit = Object.entries(loadCache())
const cache = new Map<string, { cacheTime: number; data: string[] }>(cacheInit)
const cacheTTL = 30 * 60_000 // 30min

let cacheChanged = false

interface PackageData {
  version: string[]
  info?: string
}

export async function getPackageData(item: Item): Promise<PackageData> {
  const preTest = protocolDep(item)
  if (preTest)
    return preTest

  const name = item.key

  // let error: any
  const cacheData = cache.get(name)
  if (cacheData) {
    if (ttl(cacheData.cacheTime) < cacheTTL) {
      // console.log('read cache')
    }
    else {
      // cache.delete(name)
      reGetVersion(name)
    }
    return { version: cacheData.data }
  }

  return {
    version: await reGetVersion(name),
  }
}

async function reGetVersion(name: string) {
  try {
    const root = getWorkspaceFolderPath(window.activeTextEditor)!
    const data = await version(name, root)

    if (data) {
      cache.set(name, { data, cacheTime: now() })
      cacheChanged = true
      return data
    }
  }
  catch (e) {
    console.error(e)
  }

  return []
}

export function saveCache() {
  const cacheContent = Object.fromEntries(cache.entries())
  delete cacheContent.next
  dumpCache(cacheContent, cacheChanged)
}
