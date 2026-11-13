import { storeMode } from '../config.js';
import { localBackend } from './local.js';
import { pocketbaseBackend } from './pocketbase.js';

/**
 * Compte ouvert. `email` et `firstName` valent '' quand ils ne sont pas renseignés.
 * @typedef {Object} Account
 * @property {string} username  nom d'utilisateur, unique
 * @property {string} firstName
 * @property {string} email
 * @property {string | null} avatar  URL ou data URL de l'image, ou null (on affiche l'initiale)
 */

/**
 * @typedef {'invalid-credentials' | 'username-taken' | 'password-invalid' | 'email-invalid' | 'unreachable' | 'config' | 'storage-full' | 'unknown'} AuthError
 */

/**
 * Un compte ouvert avec ses données.
 * @typedef {{ account: Account, data: import('../store.js').AppData }} Session
 * @typedef {({ ok: true } & Session) | { ok: false, error: AuthError }} AuthResult
 * @typedef {{ ok: true, account: Account } | { ok: false, error: AuthError }} AccountResult
 */

/**
 * Ce que l'appli attend d'un backend. `local` (navigateur) et `pocketbase` (serveur)
 * l'implémentent tous les deux : le reste du code ne sait pas lequel est choisi.
 * @typedef {Object} Backend
 * @property {() => Promise<Session | null>} restoreSession  rouvre la session d'avant le rechargement
 * @property {(identifier: string, password: string) => Promise<AuthResult>} signIn
 * @property {(input: { username: string, firstName: string, email: string, password: string }) => Promise<AuthResult>} signUp  crée le compte et l'ouvre
 * @property {() => Promise<void>} signOut
 * @property {() => Promise<import('../store.js').AppData | null>} reload  relit les données du compte ouvert
 * @property {(previous: import('../store.js').AppData, next: import('../store.js').AppData) => void} saveData  enregistre ce qui a changé entre deux états
 * @property {(onError: (error: unknown) => void) => void} onSaveError  appelé quand un enregistrement échoue
 * @property {(current: Account, changes: { email?: string, password?: string, avatar?: string | null }) => Promise<AccountResult>} updateAccount  e-mail et avatar (data URL). `password` (mot de passe actuel) est exigé par PocketBase pour changer l'e-mail
 */

/** Le backend choisi par `PUBLIC_STORE`.
 * @returns {Backend}
 */
export function getBackend() {
	return storeMode() === 'pocketbase' ? pocketbaseBackend : localBackend;
}
