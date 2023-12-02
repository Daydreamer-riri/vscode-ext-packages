import { parentPort, workerData } from 'node:worker_threads'
import { getPackageData, saveCache } from '../api'
import type Item from './Item'

const { dependencies, root } = workerData as { dependencies: Item[]; root: string }
const datasP = dependencies.map(item => getPackageData(item, root))

Promise.all(datasP).then((datas) => {
  parentPort?.postMessage(datas)
  saveCache()
})
