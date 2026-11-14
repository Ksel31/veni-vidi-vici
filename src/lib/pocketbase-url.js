// Adresse de PocketBase vue depuis le navigateur.
//
// Le navigateur parle directement à PocketBase. Une adresse écrite en dur (ex. l'IP locale du Pinas)
// ne marche donc que depuis le réseau de la maison : en accès distant (Tailscale), l'appareil ne
// la joint pas et la connexion répond « Le serveur ne répond pas ».
//
// Solution : on peut ne donner que le port (`:8090`). L'adresse est alors reconstruite avec
// celle de la page ouverte, donc la même config marche en local, en Tailscale ou par un nom.

/** Vrai si la valeur est un port seul, comme `:8090`.
 * @param {string} value
 */
function isPortOnly(value) {
	return /^:\d{1,5}$/.test(value);
}

/**
 * @param {string} configured valeur de PUBLIC_POCKETBASE_URL (adresse complète, `:port` ou vide)
 * @param {{ protocol: string, hostname: string } | null | undefined} page adresse de la page ouverte (absente côté serveur)
 * @returns {string}
 */
export function resolvePocketbaseUrl(configured, page) {
	if (!isPortOnly(configured)) return configured;
	// Côté serveur (rendu), il n'y a pas de page : PocketBase n'est de toute façon appelé que depuis le navigateur.
	if (!page) return configured;
	// Un nom d'hôte IPv6 s'écrit entre crochets dans une URL.
	const host = page.hostname.includes(':') ? `[${page.hostname}]` : page.hostname;
	return `${page.protocol}//${host}${configured}`;
}
