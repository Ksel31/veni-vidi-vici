/**
 * Action Svelte : déplace l'élément à la racine de la page (`document.body`).
 * Les cartes en verre (`backdrop-filter`, `isolation`) forment chacune un empilement à part :
 * un calendrier posé dans une carte passait derrière les cartes suivantes, quel que soit son z-index.
 * À la racine, il est toujours au-dessus.
 * @param {HTMLElement} node
 */
export function portal(node) {
	document.body.appendChild(node);
	return {
		destroy() {
			node.remove();
		}
	};
}
