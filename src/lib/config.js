import { PUBLIC_POCKETBASE_URL, PUBLIC_STORE } from '$app/env/public';

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
