/**
 * Composable de gestion du cache pour NS2PO
 * Gère le cache local, la validation et l'invalidation
 */

import { ref, computed, reactive } from "vue";

// =====================================
// TYPES
// =====================================

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  key: string;
  tags?: string[]; // Tags pour invalidation groupée
}

interface CacheOptions {
  ttl?: number; // Default 15 minutes
  tags?: string[];
  storage?: "memory" | "session" | "local";
}

interface CacheStats {
  hits: number;
  misses: number;
  total: number;
  hitRate: number;
}

// =====================================
// CONFIGURATION
// =====================================

const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 100; // Maximum entries in memory

// =====================================
// CACHE STORAGE
// =====================================

// Cache en mémoire (perdu au refresh)
const memoryCache = reactive<Map<string, CacheEntry>>(new Map());

// Stats du cache
const cacheStats = reactive<CacheStats>({
  hits: 0,
  misses: 0,
  total: 0,
  hitRate: 0,
});

// =====================================
// COMPOSABLE
// =====================================

export const useCache = () => {
  const loading = ref(false);
  const error = ref("");

  // =====================================
  // COMPUTED PROPERTIES
  // =====================================

  const cacheSize = computed(() => memoryCache.size);
  const memoryUsage = computed(() => {
    const entries = Array.from(memoryCache.values());
    const sizeEstimate = entries.reduce((total, entry) => {
      return total + JSON.stringify(entry.data).length;
    }, 0);
    return Math.round(sizeEstimate / 1024); // KB
  });

  // =====================================
  // CACHE MANAGEMENT
  // =====================================

  /**
   * Génère une clé de cache normalisée
   */
  const generateCacheKey = (key: string, params?: Record<string, any>): string => {
    if (!params) return key;

    const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}=${JSON.stringify(params[k])}`)
      .join('&');

    return `${key}:${paramString}`;
  };

  /**
   * Vérifie si une entrée de cache est valide
   */
  const isValidEntry = (entry: CacheEntry): boolean => {
    const now = Date.now();
    return (now - entry.timestamp) < entry.ttl;
  };

  /**
   * Nettoie les entrées expirées
   */
  const cleanExpiredEntries = (): number => {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of memoryCache.entries()) {
      if ((now - entry.timestamp) >= entry.ttl) {
        memoryCache.delete(key);
        removed++;
      }
    }

    console.log(`🧹 Cache: ${removed} entrées expirées supprimées`);
    return removed;
  };

  /**
   * Éviction LRU si le cache est plein
   */
  const evictIfNeeded = (): void => {
    if (memoryCache.size >= MAX_CACHE_SIZE) {
      // Supprimer les entrées les plus anciennes
      const entries = Array.from(memoryCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = Math.ceil(MAX_CACHE_SIZE * 0.2); // Supprimer 20%
      for (let i = 0; i < toRemove; i++) {
        memoryCache.delete(entries[i][0]);
      }

      console.log(`📦 Cache: ${toRemove} entrées évincées (LRU)`);
    }
  };

  // =====================================
  // CACHE OPERATIONS
  // =====================================

  /**
   * Récupère une valeur du cache
   */
  const get = <T = any>(key: string, params?: Record<string, any>): T | null => {
    const cacheKey = generateCacheKey(key, params);
    const entry = memoryCache.get(cacheKey);

    cacheStats.total++;

    if (!entry) {
      cacheStats.misses++;
      console.log(`🔍 Cache miss: ${cacheKey}`);
      return null;
    }

    if (!isValidEntry(entry)) {
      memoryCache.delete(cacheKey);
      cacheStats.misses++;
      console.log(`⏰ Cache expired: ${cacheKey}`);
      return null;
    }

    cacheStats.hits++;
    cacheStats.hitRate = cacheStats.hits / cacheStats.total;
    console.log(`✅ Cache hit: ${cacheKey}`);
    return entry.data as T;
  };

  /**
   * Stocke une valeur dans le cache
   */
  const set = <T = any>(
    key: string,
    data: T,
    options: CacheOptions = {},
    params?: Record<string, any>
  ): void => {
    const cacheKey = generateCacheKey(key, params);
    const ttl = options.ttl || DEFAULT_TTL;

    // Nettoyage et éviction si nécessaire
    cleanExpiredEntries();
    evictIfNeeded();

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      key: cacheKey,
      tags: options.tags || [],
    };

    memoryCache.set(cacheKey, entry);
    console.log(`💾 Cache set: ${cacheKey} (TTL: ${ttl / 1000}s)`);
  };

  /**
   * Supprime une entrée du cache
   */
  const remove = (key: string, params?: Record<string, any>): boolean => {
    const cacheKey = generateCacheKey(key, params);
    const deleted = memoryCache.delete(cacheKey);

    if (deleted) {
      console.log(`🗑️ Cache removed: ${cacheKey}`);
    }

    return deleted;
  };

  /**
   * Invalide le cache par tags
   */
  const invalidateByTags = (tags: string[]): number => {
    let removed = 0;

    for (const [key, entry] of memoryCache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        memoryCache.delete(key);
        removed++;
      }
    }

    console.log(`🏷️ Cache invalidated by tags [${tags.join(', ')}]: ${removed} entrées`);
    return removed;
  };

  /**
   * Invalide le cache par pattern de clé
   */
  const invalidateByPattern = (pattern: string): number => {
    let removed = 0;
    const regex = new RegExp(pattern);

    for (const [key] of memoryCache.entries()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        removed++;
      }
    }

    console.log(`🔍 Cache invalidated by pattern "${pattern}": ${removed} entrées`);
    return removed;
  };

  /**
   * Vide complètement le cache
   */
  const clear = (): void => {
    const size = memoryCache.size;
    memoryCache.clear();

    // Reset des stats
    cacheStats.hits = 0;
    cacheStats.misses = 0;
    cacheStats.total = 0;
    cacheStats.hitRate = 0;

    console.log(`🧹 Cache complètement vidé: ${size} entrées supprimées`);
  };

  // =====================================
  // CACHE WITH FETCH
  // =====================================

  /**
   * Récupère depuis le cache ou exécute la fonction
   */
  const getOrSet = async <T = any>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {},
    params?: Record<string, any>
  ): Promise<T> => {
    try {
      loading.value = true;
      error.value = "";

      // Tentative de récupération depuis le cache
      const cached = get<T>(key, params);
      if (cached !== null) {
        return cached;
      }

      // Exécution de la fonction de récupération
      console.log(`🌐 Cache miss, executing fetch function for: ${key}`);
      const data = await fetchFn();

      // Stockage dans le cache
      set(key, data, options, params);

      return data;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Erreur de cache";
      console.error(`❌ Erreur getOrSet pour ${key}:`, err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // =====================================
  // MAINTENANCE
  // =====================================

  /**
   * Nettoyage périodique du cache
   */
  const startPeriodicCleanup = (intervalMs: number = 5 * 60 * 1000) => {
    const interval = setInterval(() => {
      cleanExpiredEntries();
    }, intervalMs);

    // Cleanup on unmount (si dans un composant Vue)
    if (process.client) {
      window.addEventListener('beforeunload', () => {
        clearInterval(interval);
      });
    }

    return () => clearInterval(interval);
  };

  /**
   * Export/Import du cache pour persistance
   */
  const exportCache = (): string => {
    const cacheData = Array.from(memoryCache.entries());
    return JSON.stringify({
      cache: cacheData,
      stats: cacheStats,
      timestamp: Date.now(),
    });
  };

  const importCache = (cacheJson: string): boolean => {
    try {
      const { cache, timestamp } = JSON.parse(cacheJson);
      const now = Date.now();

      // Ne pas importer si les données sont trop anciennes (> 1 heure)
      if ((now - timestamp) > 60 * 60 * 1000) {
        console.warn("⚠️ Cache import ignoré: données trop anciennes");
        return false;
      }

      // Importer seulement les entrées valides
      let imported = 0;
      for (const [key, entry] of cache) {
        if (isValidEntry(entry)) {
          memoryCache.set(key, entry);
          imported++;
        }
      }

      console.log(`📥 Cache importé: ${imported} entrées valides`);
      return true;
    } catch (err) {
      console.error("❌ Erreur import cache:", err);
      return false;
    }
  };

  // =====================================
  // DEBUG ET MONITORING
  // =====================================

  const getCacheInfo = () => ({
    size: cacheSize.value,
    memoryUsage: memoryUsage.value,
    stats: { ...cacheStats },
    entries: Array.from(memoryCache.entries()).map(([key, entry]) => ({
      key,
      size: JSON.stringify(entry.data).length,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      tags: entry.tags || [],
    })),
  });

  // =====================================
  // RETURN API
  // =====================================

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    cacheSize,
    memoryUsage,
    cacheStats: readonly(cacheStats),

    // Core operations
    get,
    set,
    remove,
    clear,
    getOrSet,

    // Invalidation
    invalidateByTags,
    invalidateByPattern,

    // Maintenance
    cleanExpiredEntries,
    startPeriodicCleanup,

    // Persistence
    exportCache,
    importCache,

    // Debug
    getCacheInfo,

    // Utility
    generateCacheKey,
  };
};