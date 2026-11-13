import { get, writable } from 'svelte/store';
import { account } from './accounts.js';
import { getBackend } from './backend/index.js';
import { applyPerformanceRules, isPast, normalizeEvent } from './rules.js';
import { showInfoToast } from './toast.js';

// Où les données vivent (navigateur ou PocketBase) ne regarde pas ce fichier :
// il calcule le nouvel état, puis le backend choisi par PUBLIC_STORE l'enregistre.

/**
 * @typedef {'concert' | 'festival'} EventType
 * @typedef {'planned' | 'attended' | 'missed'} EventStatus
 * @typedef {'headliner' | 'support' | null} Billing
 * @typedef {'to_see' | 'seen' | 'missed'} PerformanceStatus
 * @typedef {'up' | 'down' | null} Thumb
 */

/**
 * Lieu. Les dates des events sont des chaînes AAAA-MM-JJ.
 * @typedef {Object} Venue
 * @property {string} id
 * @property {string} name
 * @property {string} city
 * @property {string} country
 */

/**
 * @typedef {Object} Artist
 * @property {string} id
 * @property {string} name
 */

/**
 * Event. `ticketFile` et `photos` restent vides en phase 1 (pas d'envoi réel).
 * @typedef {Object} Event
 * @property {string} id
 * @property {EventType} type
 * @property {string | null} title
 * @property {string} startDate
 * @property {string | null} endDate
 * @property {string | null} venueId
 * @property {EventStatus} status
 * @property {boolean} ticketBought
 * @property {number | null} ticketPrice
 * @property {null} ticketFile
 * @property {string[]} photos
 * @property {string[]} daysAttended
 * @property {Thumb} thumb
 * @property {string} comment
 * @property {string[]} companions
 */

/**
 * Passage d'un artiste dans un event.
 * @typedef {Object} Performance
 * @property {string} id
 * @property {string} eventId
 * @property {string} artistId
 * @property {Billing} billing
 * @property {string | null} day
 * @property {PerformanceStatus} status
 * @property {Thumb} thumb
 * @property {string} setlist
 */

/**
 * Données d'un compte, sans l'identifiant du compte.
 * @typedef {Object} UserData
 * @property {Venue[]} venues
 * @property {Artist[]} artists
 * @property {Event[]} events
 * @property {Performance[]} performances
 * @property {boolean} onboardingSeen
 * @property {number} [seedVersion]
 */

/**
 * @typedef {UserData & { userId: string | null }} AppData
 */

/** Identifiant d'une ligne : 15 caractères a-z0-9, le format que PocketBase accepte pour un id. */
function newId() {
	const letters = 'abcdefghijklmnopqrstuvwxyz0123456789';
	return Array.from(crypto.getRandomValues(new Uint8Array(15)), (byte) => letters[byte % letters.length]).join('');
}

/** @returns {AppData} */
function loggedOut() {
	return { userId: null, venues: [], artists: [], events: [], performances: [], onboardingSeen: false };
}

export const data = writable(loggedOut());

/** @param {AppData} state */
function commit(state) {
	const previous = get(data);
	data.set(state);
	getBackend().saveData(previous, state);
}

let watching = false;

// Un enregistrement a échoué : on le dit, puis on relit les données du serveur
// pour que l'écran montre ce qui est vraiment enregistré.
function watchSaveErrors() {
	if (watching) return;
	watching = true;
	const backend = getBackend();
	backend.onSaveError(async () => {
		showInfoToast("Modification non enregistrée. Réessaie dans un instant.");
		try {
			const saved = await backend.reload();
			if (saved) data.set(saved);
		} catch {
			// Toujours injoignable : on garde l'écran tel quel.
		}
	});
}

/** @param {import('./backend/index.js').Session} session */
function openSession(session) {
	watchSaveErrors();
	data.set(session.data);
	account.set(session.account);
}

/**
 * Ouvre le compte. En mode local, `demo` reçoit les données de démo (n'importe quel mot de passe).
 * @param {string} identifier
 * @param {string} [password]
 * @returns {Promise<import('./backend/index.js').AuthResult>} `ok: false` avec la raison si la connexion échoue
 */
export async function login(identifier, password = '') {
	const result = await getBackend().signIn(identifier, password);
	if (result.ok) openSession(result);
	return result;
}

/**
 * Crée un compte et l'ouvre.
 * @param {{ username: string, firstName: string, email: string, password: string }} input
 * @returns {Promise<import('./backend/index.js').AuthResult>}
 */
export async function signUp(input) {
	const result = await getBackend().signUp(input);
	if (result.ok) openSession(result);
	return result;
}

/**
 * L'onboarding s'affiche une fois, pour un compte sans event, jamais pour `demo`.
 * @param {AppData} [state]
 */
export function needsOnboarding(state = get(data)) {
	if (!state.userId || state.userId === 'demo') return false;
	if (state.onboardingSeen) return false;
	return state.events.length === 0;
}

/** « Passer » ou « Ajouter mon 1er event » : l'onboarding ne revient pas pour ce compte. */
export function completeOnboarding() {
	const state = get(data);
	if (!state.userId || state.onboardingSeen) return;
	commit({ ...state, onboardingSeen: true });
}

/** Après un rechargement, rouvre la session d'avant. */
export async function restoreSession() {
	const session = await getBackend().restoreSession();
	if (session) openSession(session);
}

/** Ferme la session. En mode local, les données du compte restent dans le navigateur. */
export async function logout() {
	await getBackend().signOut();
	account.set(null);
	data.set(loggedOut());
}

/**
 * Crée un lieu, ou renvoie celui qui a déjà le même nom et la même ville.
 * @param {{ name: string, city: string, country: string }} input
 * @returns {string | null}
 */
export function addVenue(input) {
	const name = input.name.trim();
	const city = input.city.trim();
	const country = input.country.trim();
	if (!name) return null;

	const state = get(data);
	if (!state.userId) return null;

	const existing = state.venues.find(
		(venue) => venue.name.toLowerCase() === name.toLowerCase() && venue.city.toLowerCase() === city.toLowerCase()
	);
	if (existing) return existing.id;

	const venue = { id: newId(), name, city, country };
	commit({ ...state, venues: [...state.venues, venue] });
	return venue.id;
}

/**
 * Crée un artiste, ou renvoie celui qui a déjà le même nom.
 * @param {string} name
 * @returns {string | null}
 */
export function addArtist(name) {
	const trimmed = name.trim();
	if (!trimmed) return null;

	const state = get(data);
	if (!state.userId) return null;

	const existing = state.artists.find((artist) => artist.name.toLowerCase() === trimmed.toLowerCase());
	if (existing) return existing.id;

	const artist = { id: newId(), name: trimmed };
	commit({ ...state, artists: [...state.artists, artist] });
	return artist.id;
}

/**
 * @param {Partial<Event> & Pick<Event, 'type' | 'startDate'>} input
 * @param {Array<{ artistId: string, billing?: Performance['billing'], day?: string | null, status?: Performance['status'] }>} [bandList]
 * @returns {string | null}
 */
export function addEvent(input, bandList = []) {
	const state = get(data);
	if (!state.userId) return null;

	const event = normalizeEvent({
		id: newId(),
		title: null,
		endDate: null,
		venueId: null,
		status: 'planned',
		ticketBought: false,
		ticketPrice: null,
		ticketFile: null,
		photos: [],
		daysAttended: [],
		thumb: null,
		comment: '',
		companions: [],
		...input
	});
	const performances = applyPerformanceRules(event, [
		...state.performances,
		...bandList.map((band) => ({
			id: newId(),
			eventId: event.id,
			artistId: band.artistId,
			billing: band.billing ?? null,
			day: band.day ?? null,
			status: band.status ?? 'to_see',
			thumb: null,
			setlist: ''
		}))
	]);
	commit({ ...state, events: [...state.events, event], performances });
	return event.id;
}

/**
 * @param {string} id
 * @param {Partial<Event>} changes
 */
export function updateEvent(id, changes) {
	const state = get(data);
	const current = state.events.find((event) => event.id === id);
	if (!current || !state.userId) return;

	const event = normalizeEvent({ ...current, ...changes, id: current.id });
	const events = state.events.map((item) => (item.id === id ? event : item));
	const performances = applyPerformanceRules(event, state.performances);
	commit({ ...state, events, performances });
}

/**
 * Vu ou Raté. Concert : les passages suivent. Festival raté : tous les passages en `missed`.
 * @param {string} eventId
 * @param {'attended' | 'missed'} status
 */
export function setPresence(eventId, status) {
	const state = get(data);
	const current = state.events.find((event) => event.id === eventId);
	if (!current || !state.userId) return;
	if (status !== 'attended' && status !== 'missed') return;

	let performances = state.performances;
	if (current.type === 'concert') {
		const next = status === 'attended' ? 'seen' : 'missed';
		performances = performances.map((performance) =>
			performance.eventId === eventId ? { ...performance, status: next } : performance
		);
	} else if (status === 'missed') {
		performances = performances.map((performance) =>
			performance.eventId === eventId ? { ...performance, status: 'missed' } : performance
		);
	}

	const event = normalizeEvent({ ...current, status });
	commit({
		...state,
		events: state.events.map((item) => (item.id === eventId ? event : item)),
		performances: applyPerformanceRules(event, performances)
	});
}

/**
 * Marque raté et renvoie l'état d'avant, pour le toast Annuler.
 * @param {string} eventId
 */
export function missEvent(eventId) {
	const state = get(data);
	const current = state.events.find((event) => event.id === eventId);
	if (!current) return null;
	const snapshot = {
		status: current.status,
		performances: state.performances
			.filter((performance) => performance.eventId === eventId)
			.map((performance) => ({ id: performance.id, status: performance.status }))
	};
	setPresence(eventId, 'missed');
	return snapshot;
}

/** @param {string} eventId @param {{ status: Event['status'], performances: { id: string, status: Performance['status'] }[] }} snapshot */
export function undoMiss(eventId, snapshot) {
	const state = get(data);
	const current = state.events.find((event) => event.id === eventId);
	if (!current || !state.userId || !snapshot) return;
	const previous = new Map(snapshot.performances.map((item) => [item.id, item.status]));
	const performances = state.performances.map((performance) => {
		const status = previous.get(performance.id);
		return status ? { ...performance, status } : performance;
	});
	const event = { ...current, status: snapshot.status };
	commit({
		...state,
		events: state.events.map((item) => (item.id === eventId ? event : item)),
		performances
	});
}

/**
 * Festival vu : jours faits, groupes cochés en `seen`, les autres en `missed`.
 * @param {string} eventId
 * @param {string[]} daysAttended
 * @param {string[]} seenIds
 */
export function setFestivalAttendance(eventId, daysAttended, seenIds) {
	const state = get(data);
	const current = state.events.find((event) => event.id === eventId);
	if (!current || current.type !== 'festival' || !state.userId) return;

	const end = current.endDate || current.startDate;
	const days = [...new Set(daysAttended.filter((day) => day >= current.startDate && day <= end))];
	const seen = new Set(seenIds);
	const performances = state.performances.map((performance) => {
		if (performance.eventId !== eventId) return performance;
		const thatDay = !performance.day || days.includes(performance.day);
		/** @type {'seen' | 'missed'} */
		const next = thatDay && seen.has(performance.id) ? 'seen' : 'missed';
		return { ...performance, status: next };
	});
	const event = normalizeEvent({ ...current, status: 'attended', daysAttended: days });
	commit({
		...state,
		events: state.events.map((item) => (item.id === eventId ? event : item)),
		performances: applyPerformanceRules(event, performances)
	});
}

/**
 * Enregistre la fiche modifiée. La date du jour ou future repasse l'event en `planned`
 * et les passages en `to_see`. Un event déjà passé garde Vu ou Raté.
 * Le pouce, l'avis et les setlists restent en mémoire.
 * @param {string} eventId
 * @param {Partial<Event>} changes
 * @param {Array<{ performanceId: string | null, artistId: string, billing: Billing, day: string | null }>} bandList
 */
export function saveEditedEvent(eventId, changes, bandList) {
	const state = get(data);
	const current = state.events.find((event) => event.id === eventId);
	if (!current || !state.userId) return;

	const event = normalizeEvent({ ...current, ...changes, id: current.id });
	if (event.type === 'festival') {
		const end = event.endDate || event.startDate;
		event.daysAttended = event.daysAttended.filter((day) => day >= event.startDate && day <= end);
	}

	const previous = new Map(
		state.performances.filter((performance) => performance.eventId === eventId).map((performance) => [performance.id, performance])
	);
	const nextBands = bandList.flatMap((band) => {
		if (!band.artistId) return [];
		const old = band.performanceId ? previous.get(band.performanceId) : undefined;
		return [{
			id: old?.id ?? newId(),
			eventId,
			artistId: band.artistId,
			billing: band.billing,
			day: band.day,
			status: old?.status ?? statusForNewBand(event),
			thumb: old?.thumb ?? null,
			setlist: old?.setlist ?? ''
		}];
	});
	const performances = applyPerformanceRules(event, [
		...state.performances.filter((performance) => performance.eventId !== eventId),
		...nextBands
	]);
	commit({
		...state,
		events: state.events.map((item) => (item.id === eventId ? event : item)),
		performances
	});
}

/** Un groupe ajouté pendant la modification suit le statut déjà connu. @param {Event} event */
function statusForNewBand(event) {
	if (!isPast(event) || event.status === 'planned') return 'to_see';
	if (event.status === 'missed') return 'missed';
	if (event.type === 'concert') return 'seen';
	return 'to_see';
}

/** Efface l'event et ses passages. @param {string} eventId */
export function deleteEvent(eventId) {
	const state = get(data);
	if (!state.userId) return;
	commit({
		...state,
		events: state.events.filter((event) => event.id !== eventId),
		performances: state.performances.filter((performance) => performance.eventId !== eventId)
	});
}

/** Pouce ou setlist d'un passage. @param {string} id @param {Partial<Pick<Performance, 'thumb' | 'setlist'>>} changes */
export function updatePerformance(id, changes) {
	const state = get(data);
	if (!state.userId) return;
	const performances = state.performances.map((performance) => {
		if (performance.id !== id) return performance;
		return {
			...performance,
			thumb: changes.thumb === undefined ? performance.thumb : changes.thumb,
			setlist: changes.setlist === undefined ? performance.setlist : changes.setlist
		};
	});
	commit({ ...state, performances });
}

// Les listes d'events vivent dans rules.js (sans Svelte, pour pouvoir être testées) ; les écrans les prennent ici.
export { historyEvents, toConfirmEvents, upcomingEvents } from './rules.js';
