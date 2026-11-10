import { writable } from 'svelte/store';
import { createDemoData } from './demo-data.js';

const STORAGE_KEY = 'vvv-data';

/** true seulement dans le vrai navigateur (évite le localStorage fantôme de Node) */
function canUseStorage() {
	try {
		return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
	} catch {
		return false;
	}
}

/** @returns {import('./types.js').AppData} */
function loadData() {
	if (!canUseStorage()) return createDemoData();

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw);
	} catch {
		// Données corrompues → on repart sur la démo
	}

	const demo = createDemoData();
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(demo));
	return demo;
}

/** Store principal : venues, artists, events, performances */
export const data = writable(loadData());

// Persiste à chaque changement (navigateur uniquement)
if (canUseStorage()) {
	data.subscribe((value) => {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	});
}

/** Remet les données de démo (bouton « Réinitialiser ») */
export function resetDemoData() {
	const demo = createDemoData();
	data.set(demo);
}

/** Génère un id simple et unique */
export function newId(prefix) {
	return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
