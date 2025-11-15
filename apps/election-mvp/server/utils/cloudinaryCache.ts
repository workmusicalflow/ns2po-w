/**
 * Cache Cloudinary Auto-Discovery
 *
 * Pattern: useStorage('cache:cloudinary') avec TTL manuel
 * Validation: Gemini Copilot Q6 (Audit Architecture /realisations)
 *
 * Objectif: Éliminer N+1 Problem (appel Cloudinary API sur chaque requête GET /api/realisations)
 * Performance: -200-500ms latence 3G
 * TTL: 1h (3600s) - Images Cloudinary changent rarement
 */

import type { HybridRealisation } from "@ns2po/types";

interface CloudinaryCacheEntry {
  data: any[]; // Images Cloudinary brutes (avant transformation HybridRealisation)
  expiresAt: number; // Timestamp expiration
  cachedAt: number; // Timestamp mise en cache
}

const CACHE_TTL_SECONDS = 3600; // 1 heure (recommandation audit)
const CACHE_KEY = 'realisations';

/**
 * Récupère les images Cloudinary depuis le cache si valide
 * @returns Images Cloudinary ou null si cache expiré/manquant
 */
export async function getCachedCloudinaryRealisations(): Promise<any[] | null> {
  try {
    const cloudinaryCache = useStorage('cache:cloudinary');
    const cached = await cloudinaryCache.getItem<CloudinaryCacheEntry>(CACHE_KEY);

    if (!cached) {
      console.log('🔍 Cache Cloudinary: MISS (vide)');
      return null;
    }

    const now = Date.now();
    const isExpired = cached.expiresAt <= now;

    if (isExpired) {
      const age = Math.round((now - cached.cachedAt) / 1000);
      console.log(`🔍 Cache Cloudinary: MISS (expiré après ${age}s)`);
      return null;
    }

    const age = Math.round((now - cached.cachedAt) / 1000);
    console.log(`✅ Cache Cloudinary: HIT (${cached.data.length} images, âge: ${age}s)`);
    return cached.data;

  } catch (error) {
    console.error('❌ Erreur lecture cache Cloudinary:', error);
    return null; // Fallback silencieux
  }
}

/**
 * Stocke les images Cloudinary dans le cache avec TTL
 * @param data Images Cloudinary brutes
 * @param ttlSeconds TTL en secondes (défaut: 3600s = 1h)
 */
export async function setCachedCloudinaryRealisations(
  data: any[],
  ttlSeconds: number = CACHE_TTL_SECONDS
): Promise<void> {
  try {
    const cloudinaryCache = useStorage('cache:cloudinary');
    const now = Date.now();

    const cacheEntry: CloudinaryCacheEntry = {
      data,
      expiresAt: now + (ttlSeconds * 1000),
      cachedAt: now,
    };

    await cloudinaryCache.setItem(CACHE_KEY, cacheEntry);
    console.log(`💾 Cache Cloudinary: SET (${data.length} images, TTL: ${ttlSeconds}s)`);

  } catch (error) {
    console.error('❌ Erreur écriture cache Cloudinary:', error);
    // Ne pas throw: échec cache ne doit pas casser l'API
  }
}

/**
 * Invalide manuellement le cache Cloudinary
 * Usage: Admin upload nouvelle image → invalider cache
 */
export async function invalidateCloudinaryCache(): Promise<void> {
  try {
    const cloudinaryCache = useStorage('cache:cloudinary');
    await cloudinaryCache.removeItem(CACHE_KEY);
    console.log('🗑️ Cache Cloudinary: INVALIDATED');
  } catch (error) {
    console.error('❌ Erreur invalidation cache Cloudinary:', error);
  }
}
