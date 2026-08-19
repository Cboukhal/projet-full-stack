export const AUTH_STORAGE_KEY = "formanova_auth";

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
