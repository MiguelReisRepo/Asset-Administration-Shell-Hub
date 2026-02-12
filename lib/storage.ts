/**
 * IndexedDB storage for AAS models
 * Provides much larger storage quota than localStorage (~50MB+ vs ~5MB)
 */

import type { ValidationResult } from "./types"

const DB_NAME = "aas-forge-db"
const DB_VERSION = 1
const STORE_NAME = "models"

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Initialize and get the IndexedDB database
 */
function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error("Failed to open IndexedDB:", request.error)
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      // Create object store for models if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true })
      }
    }
  })

  return dbPromise
}

/**
 * Save all models to IndexedDB
 */
export async function saveModels(models: ValidationResult[]): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)

    // Clear existing data
    store.clear()

    // Add all models with an index
    models.forEach((model, index) => {
      store.add({ ...model, _index: index })
    })

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.error("Failed to save models to IndexedDB:", error)
    throw error
  }
}

/**
 * Load all models from IndexedDB
 */
export async function loadModels(): Promise<ValidationResult[]> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_NAME, "readonly")
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // Sort by _index and remove the index field
        const models = (request.result || [])
          .sort((a: any, b: any) => (a._index || 0) - (b._index || 0))
          .map((item: any) => {
            const { id, _index, ...model } = item
            return model as ValidationResult
          })
        resolve(models)
      }
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Failed to load models from IndexedDB:", error)
    return []
  }
}

/**
 * Clear all models from IndexedDB
 */
export async function clearModels(): Promise<void> {
  try {
    const db = await getDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    const store = tx.objectStore(STORE_NAME)
    store.clear()

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (error) {
    console.error("Failed to clear models from IndexedDB:", error)
    throw error
  }
}

/**
 * Check if IndexedDB is available
 */
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined"
}

/**
 * Get estimated storage usage (if available)
 */
export async function getStorageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate()
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      }
    } catch {
      return null
    }
  }
  return null
}
