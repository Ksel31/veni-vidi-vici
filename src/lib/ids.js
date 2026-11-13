/**
 * Identifiant de 15 caractères a-z0-9 : le format que PocketBase accepte pour un `id`.
 * `getRandomValues` marche aussi en HTTP simple (Docker sur le réseau local),
 * contrairement à `crypto.randomUUID`, réservé aux pages en HTTPS ou localhost.
 * @returns {string}
 */
export function newId() {
	const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from(crypto.getRandomValues(new Uint8Array(15)), (byte) => letters[byte % letters.length]).join('');
}
