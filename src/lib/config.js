import { PUBLIC_INSCRIPTIONS_OUVERTES, PUBLIC_POCKETBASE_URL, PUBLIC_STORE } from '$app/env/public';

// Les variables sont déclarées dans `src/env.js` ; leurs valeurs par défaut et leur rôle sont
// documentés dans `.env.example`. Elles sont lues quand le serveur démarre, pas figées au build.

/** Où vivent les données : `local` (navigateur, par défaut) ou `pocketbase`.
 * @returns {'local' | 'pocketbase'}
 */
export function storeMode() {
	return PUBLIC_STORE === 'pocketbase' ? 'pocketbase' : 'local';
}

/** Adresse de PocketBase vue depuis le navigateur. Vide si elle n'est pas renseignée.
 * @returns {string}
 */
export function pocketbaseUrl() {
	return PUBLIC_POCKETBASE_URL;
}

/** Peut-on créer un compte depuis l'appli ? Toujours oui en mode `local` (démo, aucun vrai compte).
 * Avec PocketBase, c'est fermé sauf si `PUBLIC_INSCRIPTIONS_OUVERTES=true` : cette variable ne fait
 * qu'afficher (ou non) le formulaire, c'est `VVV_INSCRIPTIONS_OUVERTES` qui ouvre la règle côté serveur.
 * @returns {boolean}
 */
export function inscriptionsOuvertes() {
	return storeMode() === 'local' || PUBLIC_INSCRIPTIONS_OUVERTES === true;
}
