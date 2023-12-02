import { Worker } from 'node:worker_threads'
import path from 'node:path'
import { CompletionItem, CompletionItemKind, CompletionList } from 'vscode'
import compareVersions from '../semver/compareVersion'
import { sortText } from '../providers/autoCompletion'
import { statusBarItem } from '../ui/indicators'
import type { PackageData } from '../api'
import { getRoot } from '../utils/resolve'
import type Item from './Item'
import type Dependency from './Dependency'

// const queue = new PQueue({ concurrency: 10 })
let cache: [Dependency[], Map<string, Dependency[]>] | null = null

export function clearCache() {
  cache = null
}

export async function fetchPackageVersions(
  dependencies: Item[],
): Promise<[Dependency[], Map<string, Dependency[]>]> {
  if (cache)
    return cache
  statusBarItem.setText('👀 Fetching npm')

  const responsesMap: Map<string, Dependency[]> = new Map()

  const packageData = await fetchPackageData(dependencies)

  const responses = dependencies.map(
    (item, index) => {
      try {
        const data = packageData[index]
        if (!data)
          throw new Error('Get Package information failure')

        const versions = data.version
          .reduce((total: string[], item) => {
            if (!item.includes('-'))
              total.push(item)
            return total
          }, [])
          .sort(compareVersions)
          .reverse()
        let i = 0
        const versionCompletionItems = new CompletionList(
          versions.map((version) => {
            const completionItem = new CompletionItem(
              version,
              CompletionItemKind.Class)
            completionItem.preselect = i === 0
            completionItem.sortText = sortText(i++)
            return completionItem
          }),
          true)
        const dependency = {
          item,
          versions,
          info: data.info,
          versionCompletionItems,
        }
        const found = responsesMap.get(item.key)
        if (found)
          found.push(dependency)

        else
          responsesMap.set(item.key, [dependency])
        return dependency
      }
      catch (error) {
        console.error(error)
        return {
          item,
          error: `${item.key}: ${error}`,
        }
      }
    },
  )

  cache = [responses, responsesMap]

  return cache
}

function fetchPackageData(
  dependencies: Item[],
): Promise<PackageData[]> {
  return new Promise((resolve, reject) => {
    const root = getRoot()

    const worker = new Worker(path.resolve(__dirname, 'worker.js'), { workerData: { dependencies, root } })
    worker.on('message', (data: PackageData[]) => {
      resolve(data)
    })
    worker.on('error', (error) => {
      reject(error)
    })
  })
}
