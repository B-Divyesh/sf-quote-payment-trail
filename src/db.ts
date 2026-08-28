import type { AppData } from './types'
import { emptyData } from './types'

const REAL_DB_NAME = 'deal-thread-v1'
const DEMO_DB_NAME = 'demo:deal-thread-v1'
const STORE = 'app'
const KEY = 'state'

function openDb(demo = false): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(demo ? DEMO_DB_NAME : REAL_DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadData(demo = false): Promise<AppData> {
  try {
    const db = await openDb(demo)
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE).objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve((request.result as AppData | undefined) ?? emptyData())
      request.onerror = () => reject(request.error)
    })
  } catch {
    return emptyData()
  }
}

export async function saveData(value: AppData, demo = false): Promise<void> {
  const db = await openDb(demo)
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(value, KEY)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
