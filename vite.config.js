import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

// Choix de l'adapter SvelteKit par variable d'environnement, au build :
// - par défaut (`ADAPTER` absent ou `auto`) : adapter-auto, ce que Vercel détecte pour la démo en ligne ;
// - `ADAPTER=node` : adapter-node, un serveur Node autonome (utilisé par le Dockerfile).
const adapterName = process.env.ADAPTER || 'auto';
if (adapterName !== 'auto' && adapterName !== 'node') {
	throw new Error(`ADAPTER doit valoir "auto" ou "node" (reçu : "${adapterName}").`);
}
const adapter =
	adapterName === 'node'
		? (await import('@sveltejs/adapter-node')).default
		: (await import('@sveltejs/adapter-auto')).default;

// La version affichée dans Profil > À propos vient de package.json, lue au build.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	},
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
			// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
			// See https://svelte.dev/docs/kit/adapters for more information about adapters.
			adapter: adapter()
		})
	]
});
