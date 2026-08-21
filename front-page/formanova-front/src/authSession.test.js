/** Tests unitaires de la persistance de session, exécutables sans navigateur. */
import assert from "node:assert/strict";
import test from "node:test";

import {
  AUTH_STORAGE_KEY,
  clearStoredAuth,
  loadStoredAuth,
  saveStoredAuth,
} from "./authSession.js";

/** Fournit l'interface minimale de `localStorage` sur une Map isolée pour chaque test. */
function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("la session enregistrée est restaurée après un nouveau chargement", () => {
  const storage = createMemoryStorage();
  const auth = {
    token: "token-persistant",
    user: { identifiant: "marie.petit", role: "referente" },
  };

  assert.equal(saveStoredAuth(auth, storage), true);
  assert.deepEqual(loadStoredAuth(storage), auth);
});

test("une session corrompue est ignorée et supprimée", () => {
  const storage = createMemoryStorage();
  storage.setItem(AUTH_STORAGE_KEY, "{json-invalide");

  assert.equal(loadStoredAuth(storage), null);
  assert.equal(storage.getItem(AUTH_STORAGE_KEY), null);
});

test("la déconnexion supprime la session persistée", () => {
  const storage = createMemoryStorage();
  saveStoredAuth({ token: "token", user: { role: "eleve" } }, storage);

  assert.equal(clearStoredAuth(storage), true);
  assert.equal(loadStoredAuth(storage), null);
});
