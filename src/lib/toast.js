import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<{ text: string, onUndo: () => void } | null>} */
export const toast = writable(null);

let timer = 0;

/** Message léger, 5 secondes, avec Annuler. @param {string} text @param {() => void} onUndo */
export function showUndoToast(text, onUndo) {
	window.clearTimeout(timer);
	toast.set({ text, onUndo });
	timer = window.setTimeout(() => toast.set(null), 5000);
}

export function dismissToast() {
	window.clearTimeout(timer);
	toast.set(null);
}
