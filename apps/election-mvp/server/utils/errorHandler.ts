/**
 * Error Handling Unifié - API Routes
 *
 * Pattern: createError() structuré avec timestamp, path, details
 * Validation: Anti-pattern 5 identifié (Audit Architecture /realisations)
 *
 * Objectif: Éliminer incohérence error handling (GET return [] silencieux vs POST throw)
 * Impact: UX cohérente + debugging facilité + retry logic client
 */

import type { H3Event, H3Error } from "h3";

interface ApiErrorData {
  timestamp: string;
  path: string;
  details?: any;
}

/**
 * Handler unifié pour toutes les erreurs API
 * @param error Erreur originale (Error, H3Error, ou autre)
 * @param event H3Event pour extraire context (path)
 * @returns H3Error formaté avec structure cohérente
 */
export function handleApiError(error: any, event: H3Event): H3Error {
  // Si déjà une H3Error avec statusCode, la retourner telle quelle
  if (error.statusCode) {
    return error;
  }

  // Extraire informations utiles
  const statusCode = error.statusCode || error.status || 500;
  const statusMessage = error.statusMessage || error.message || "Erreur serveur interne";

  // Construire data structurée
  const errorData: ApiErrorData = {
    timestamp: new Date().toISOString(),
    path: event.path,
    details: error.data || error.cause || undefined,
  };

  // Log structuré pour debugging
  console.error("❌ API Error:", {
    statusCode,
    statusMessage,
    ...errorData,
    stack: error.stack,
  });

  // Créer H3Error structuré
  return createError({
    statusCode,
    statusMessage,
    data: errorData,
  });
}

/**
 * Wrapper pour validation errors (Zod, etc.)
 * @param validationError Erreur de validation (ex: ZodError)
 * @param event H3Event
 * @returns H3Error 400 avec détails validation
 */
export function handleValidationError(validationError: any, event: H3Event): H3Error {
  const errorData: ApiErrorData = {
    timestamp: new Date().toISOString(),
    path: event.path,
    details: validationError.errors || validationError.issues || validationError.message,
  };

  console.warn("⚠️ Validation Error:", errorData);

  return createError({
    statusCode: 400,
    statusMessage: "Données invalides",
    data: errorData,
  });
}

/**
 * Wrapper pour database errors (Turso, etc.)
 * @param dbError Erreur database
 * @param event H3Event
 * @returns H3Error 503 si DB unavailable, 500 sinon
 */
export function handleDatabaseError(dbError: any, event: H3Event): H3Error {
  const isUnavailable = dbError.message?.includes("unavailable") || dbError.code === "ECONNREFUSED";

  const errorData: ApiErrorData = {
    timestamp: new Date().toISOString(),
    path: event.path,
    details: {
      message: dbError.message,
      code: dbError.code,
    },
  };

  console.error("❌ Database Error:", errorData);

  return createError({
    statusCode: isUnavailable ? 503 : 500,
    statusMessage: isUnavailable ? "Base de données temporairement indisponible" : "Erreur base de données",
    data: errorData,
  });
}
