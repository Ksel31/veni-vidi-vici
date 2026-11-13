import { defineEnvVars } from '@sveltejs/kit/env';

// Variables d'environnement de l'appli (SvelteKit 3). Valeurs par défaut et rôle : voir `.env.example`.
// `public: true` : lisibles dans le navigateur. `static` absent : la valeur est lue quand le serveur
// démarre, pas figée au build. La même image Docker peut donc viser n'importe quel PocketBase.
export const variables = defineEnvVars({
	PUBLIC_STORE: {
		public: true,
		description: "Où vivent les données : 'local' (navigateur, défaut) ou 'pocketbase'.",
		schema: (value) => {
			const mode = (value ?? '').trim() || 'local';
			if (mode !== 'local' && mode !== 'pocketbase') {
				throw new Error(`PUBLIC_STORE doit valoir "local" ou "pocketbase" (reçu : "${mode}").`);
			}
			return mode;
		}
	},
	PUBLIC_POCKETBASE_URL: {
		public: true,
		description: "Adresse de PocketBase vue depuis le navigateur. Obligatoire seulement si PUBLIC_STORE=pocketbase.",
		schema: (value) => (value ?? '').trim().replace(/\/+$/, '')
	}
});
