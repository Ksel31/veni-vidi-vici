import { writable } from 'svelte/store';
import { getBackend } from './backend/index.js';

/** Côté (en px) de l'avatar enregistré : assez net pour 88 px à l'écran, assez léger pour le stockage. */
const AVATAR_SIZE = 192;

/**
 * Fiche d'un compte (voir backend/index.js).
 * @typedef {import('./backend/index.js').Account} Account
 */

/** Compte ouvert en ce moment (null si personne n'est connecté). */
export const account = writable(/** @type {Account | null} */ (null));

/** Ferme la fiche (déconnexion). */
export function clearAccount() {
	account.set(null);
}

/**
 * Enregistre l'e-mail (facultatif : '' l'efface) du compte ouvert.
 * @param {Account} current
 * @param {string} email
 * @param {string} [password]  mot de passe actuel, exigé avec PocketBase (ignoré en mode local)
 * @returns {Promise<import('./backend/index.js').AuthError | null>} null si tout s'est bien passé
 */
export async function saveEmail(current, email, password = '') {
	const result = await getBackend().updateAccount(current, { email, password });
	if (!result.ok) return result.error;
	account.set(result.account);
	return null;
}

/**
 * Enregistre l'avatar du compte ouvert.
 * @param {Account} current
 * @param {string | null} avatar  data URL (voir resizeAvatar), ou null pour l'enlever
 * @returns {Promise<boolean>} false si l'image n'a pas pu être enregistrée
 */
export async function saveAvatar(current, avatar) {
	const result = await getBackend().updateAccount(current, { avatar });
	if (!result.ok) return false;
	account.set(result.account);
	return true;
}

/** Phrase à afficher pour une erreur de connexion, d'inscription ou de profil.
 * @param {import('./backend/index.js').AuthError} error
 */
export function authErrorText(error) {
	switch (error) {
		case 'invalid-credentials':
			return 'Identifiant ou mot de passe incorrect.';
		case 'username-taken':
			return "Ce nom d'utilisateur est déjà pris. Essaie-en un autre.";
		case 'password-invalid':
			return 'Ce mot de passe est trop court (8 caractères minimum).';
		case 'email-invalid':
			return 'Cet e-mail est invalide ou déjà utilisé.';
		case 'signups-closed':
			return "Les inscriptions sont fermées. Demande un compte à l'admin.";
		case 'unreachable':
			return 'Le serveur ne répond pas. Vérifie ta connexion et réessaie.';
		case 'config':
			return "L'appli n'est pas configurée : adresse du serveur manquante.";
		case 'storage-full':
			return "Le navigateur n'a plus de place pour enregistrer.";
		default:
			return "Une erreur est survenue. Réessaie dans un instant.";
	}
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
 * Léger : le backend local la garde telle quelle, PocketBase l'envoie comme fichier.
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
