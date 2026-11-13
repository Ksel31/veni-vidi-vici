import { writable } from 'svelte/store';

// ─────────────────────────────────────────────────────────────────────────────
// DÉMO UNIQUEMENT : comptes simulés dans le navigateur.
// Le mot de passe est enregistré EN CLAIR dans localStorage, ce qui serait
// inacceptable pour un vrai service. Ici tout reste sur l'appareil, sans serveur.
// Remplacé par PocketBase en phase 2 (vrais comptes, mots de passe protégés).
// ─────────────────────────────────────────────────────────────────────────────

// `localStorage` n'existe pas pendant le rendu serveur.
const browser = typeof localStorage !== 'undefined';

/** Préfixe des données d'un compte (events, lieux…). Lu aussi par store.js. */
export const DATA_KEY_PREFIX = 'vvv-user:';
/** Préfixe de la fiche d'un compte (prénom, e-mail, mot de passe, avatar). */
const ACCOUNT_KEY_PREFIX = 'vvv-account:';

/** Côté (en px) de l'avatar enregistré : assez net pour 88 px à l'écran, assez léger pour localStorage. */
const AVATAR_SIZE = 192;

/**
 * Fiche d'un compte.
 * @typedef {Object} Account
 * @property {string} username  nom d'utilisateur, unique
 * @property {string} firstName  facultatif ('' si absent)
 * @property {string} email  facultatif ('' si absent)
 * @property {string} password  démo uniquement : en clair
 * @property {string | null} avatar  image en data URL, ou null (on affiche l'initiale)
 */

/** Compte ouvert en ce moment (null si personne n'est connecté). */
export const account = writable(/** @type {Account | null} */ (null));

/** @param {string} username */
function accountKey(username) {
	return `${ACCOUNT_KEY_PREFIX}${username}`;
}

/** Fiche vide : comptes `demo` et comptes créés avant l'arrivée de l'inscription.
 * @param {string} username
 * @returns {Account}
 */
function blankAccount(username) {
	return { username, firstName: '', email: '', password: '', avatar: null };
}

/** @param {string} username @returns {Account | null} */
function readAccount(username) {
	const raw = localStorage.getItem(accountKey(username));
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return {
			username,
			firstName: typeof parsed.firstName === 'string' ? parsed.firstName : '',
			email: typeof parsed.email === 'string' ? parsed.email : '',
			password: typeof parsed.password === 'string' ? parsed.password : '',
			avatar: typeof parsed.avatar === 'string' ? parsed.avatar : null
		};
	} catch {
		return null;
	}
}

/** @param {Account} value @returns {boolean} false si le navigateur refuse d'écrire (stockage plein). */
function writeAccount(value) {
	try {
		localStorage.setItem(accountKey(value.username), JSON.stringify(value));
		return true;
	} catch {
		return false;
	}
}

/**
 * Nom déjà pris : `demo`, un compte inscrit, ou un ancien identifiant déjà utilisé
 * dans ce navigateur. Majuscules et minuscules ne comptent pas.
 * @param {string} username
 */
export function isUsernameTaken(username) {
	if (!browser) return false;
	const wanted = username.trim().toLowerCase();
	if (wanted === 'demo') return true;
	for (let i = 0; i < localStorage.length; i += 1) {
		const key = localStorage.key(i) ?? '';
		for (const prefix of [ACCOUNT_KEY_PREFIX, DATA_KEY_PREFIX]) {
			if (key.startsWith(prefix) && key.slice(prefix.length).toLowerCase() === wanted) return true;
		}
	}
	return false;
}

/**
 * Crée un compte. Ne l'ouvre pas : l'appelant enchaîne avec `login()` de store.js.
 * @param {{ username: string, firstName: string, email: string, password: string }} input
 * @returns {{ ok: true } | { ok: false, error: 'username-taken' }}
 */
export function createAccount(input) {
	const username = input.username.trim();
	if (isUsernameTaken(username)) return { ok: false, error: 'username-taken' };
	writeAccount({
		username,
		firstName: input.firstName.trim(),
		email: input.email.trim(),
		password: input.password,
		avatar: null
	});
	return { ok: true };
}

/** Ouvre la fiche du compte qui vient de se connecter. @param {string} username */
export function loadAccount(username) {
	if (!browser) return;
	account.set(readAccount(username) ?? blankAccount(username));
}

/** Ferme la fiche (déconnexion). */
export function clearAccount() {
	account.set(null);
}

/**
 * Enregistre l'avatar du compte ouvert.
 * @param {Account} current
 * @param {string | null} avatar
 * @returns {boolean} false si l'image n'a pas pu être enregistrée
 */
export function saveAvatar(current, avatar) {
	const next = { ...current, avatar };
	if (!writeAccount(next)) return false;
	account.set(next);
	return true;
}

/** Lettre de l'avatar quand il n'y a pas de photo.
 * @param {Pick<Account, 'firstName' | 'username'> | null} value
 */
export function initialOf(value) {
	return (value ? displayName(value) : '').trim().charAt(0).toUpperCase() || '?';
}

/**
 * Prénom si on l'a, sinon le nom d'utilisateur.
 * @param {Pick<Account, 'firstName' | 'username'>} value
 */
export function displayName(value) {
	return value.firstName || value.username;
}

/**
 * Photo choisie → carré de 192 px (centré, rogné), en JPEG, sous forme de data URL.
 * Le plus simple en démo : pas d'envoi de fichier, l'image vit dans localStorage.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function resizeAvatar(file) {
	const bitmap = await createImageBitmap(file);
	const side = Math.min(bitmap.width, bitmap.height);
	const canvas = document.createElement('canvas');
	canvas.width = AVATAR_SIZE;
	canvas.height = AVATAR_SIZE;
	const context = canvas.getContext('2d');
	if (!context) throw new Error('canvas indisponible');
	// On prend le plus grand carré centré dans la photo.
	context.drawImage(
		bitmap,
		(bitmap.width - side) / 2,
		(bitmap.height - side) / 2,
		side,
		side,
		0,
		0,
		AVATAR_SIZE,
		AVATAR_SIZE
	);
	bitmap.close();
	return canvas.toDataURL('image/jpeg', 0.85);
}
