/**
 * Persistance défensive de la session d'authentification dans le stockage du navigateur.
 * Les fonctions acceptent un stockage injecté afin de rester testables hors du DOM.
 */
export const AUTH_STORAGE_KEY = "formanova_auth";

/** Résout le stockage injecté ou `localStorage`, qui peut être indisponible selon l'environnement. */
function getStorage(storage) {
  if (storage) {
    return storage;
  }

  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

/**
 * Décode et valide la structure minimale d'une session sérialisée.
 * Toute valeur corrompue ou incomplète est traitée comme une absence de session.
 */
export function parseStoredAuth(rawValue) {
  if (!rawValue) {
    return null;
  }

  try {
    const auth = JSON.parse(rawValue);
    const isValid =
      typeof auth?.token === "string" &&
      auth.token.length > 0 &&
      typeof auth?.user === "object" &&
      typeof auth.user?.role === "string";

    return isValid ? auth : null;
  } catch {
    return null;
  }
}

/** Relit la session persistée et supprime automatiquement une entrée devenue invalide. */
export function loadStoredAuth(storage) {
  const target = getStorage(storage);
  if (!target) {
    return null;
  }

  try {
    const rawValue = target.getItem(AUTH_STORAGE_KEY);
    const auth = parseStoredAuth(rawValue);

    if (rawValue && !auth) {
      target.removeItem(AUTH_STORAGE_KEY);
    }

    return auth;
  } catch {
    return null;
  }
}

/** Sérialise la session dans le stockage et indique si l'opération a réussi. */
export function saveStoredAuth(auth, storage) {
  const target = getStorage(storage);
  if (!target) {
    return false;
  }

  try {
    target.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    return true;
  } catch {
    return false;
  }
}

/** Supprime la session persistée et indique si le stockage était accessible. */
export function clearStoredAuth(storage) {
  const target = getStorage(storage);
  if (!target) {
    return false;
  }

  try {
    target.removeItem(AUTH_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
