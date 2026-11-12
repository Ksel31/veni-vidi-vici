import { get, writable } from 'svelte/store';
import { createDemoData } from './demo-data.js';

// `localStorage` n'existe pas pendant le rendu serveur.
const browser = typeof localStorage !== 'undefined';

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
 * Données d'un compte, sans l'identifiant (il sert de clé de stockage).
 * @typedef {Object} UserData
 * @property {Venue[]} venues
 * @property {Artist[]} artists
 * @property {Event[]} events
 * @property {Performance[]} performances
 */

/**
 * @typedef {UserData & { userId: string | null }} AppData
 */

const SESSION_KEY = 'vvv-session';

/** Une clé par identifiant : les comptes ne partagent rien.
 * @param {string} userId
 */
function storageKey(userId) {
	return `vvv-user:${userId}`;
}

/** @returns {AppData} */
function loggedOut() {
	return { userId: null, venues: [], artists: [], events: [], performances: [] };
}

/** @returns {string} AAAA-MM-JJ, calendrier local. */
function todayIso() {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
}

/** Festival : la date de fin. Sinon le jour de début.
 * @param {Pick<Event, 'startDate' | 'endDate'>} event
 */
function effectiveDate(event) {
	return event.endDate || event.startDate;
}

/**
 * Passé = strictement avant aujourd'hui.
 * Le jour même reste « à venir » (pas encore à confirmer).
 * @param {Pick<Event, 'startDate' | 'endDate'>} event
 * @param {string} [today]
 */
function isPast(event, today = todayIso()) {
	return effectiveDate(event) < today;
}

/**
 * Aujourd'hui ou plus tard : l'event redevient `planned`.
 * @param {Event} event
 * @returns {Event}
 */
function normalizeEvent(event) {
	if (!isPast(event) && event.status !== 'planned') {
		return { ...event, status: 'planned' };
	}
	return event;
}

/**
 * Aujourd'hui ou plus tard : les passages de cet event repassent en `to_see`.
 * Festival entier marqué « Raté » (date passée) : tous ses passages passent en `missed`.
 * @param {Event} event
 * @param {Performance[]} performances
 * @returns {Performance[]}
 */
function applyPerformanceRules(event, performances) {
	if (!isPast(event)) {
		return performances.map((performance) => {
			if (performance.eventId !== event.id || performance.status === 'to_see') return performance;
			return { ...performance, status: 'to_see' };
		});
	}
	if (event.type !== 'festival' || event.status !== 'missed') return performances;
	return performances.map((performance) => {
		if (performance.eventId !== event.id || performance.status === 'missed') return performance;
		return { ...performance, status: 'missed' };
	});
}

export const data = writable(loggedOut());

/** @param {AppData} state */
function save(state) {
	if (!browser || !state.userId) return;
	const payload = {
		venues: state.venues,
		artists: state.artists,
		events: state.events,
		performances: state.performances
	};
	localStorage.setItem(storageKey(state.userId), JSON.stringify(payload));
	localStorage.setItem(SESSION_KEY, state.userId);
}

/** @param {AppData} state */
function commit(state) {
	save(state);
	data.set(state);
}

/** @param {string} userId @returns {UserData | null} */
function readUser(userId) {
	const raw = localStorage.getItem(storageKey(userId));
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw);
		return {
			venues: parsed.venues ?? [],
			artists: parsed.artists ?? [],
			events: parsed.events ?? [],
			performances: parsed.performances ?? []
		};
	} catch {
		return null;
	}
}

/**
 * Ouvre le compte. `demo` reçoit les données de démo au premier passage.
 * Un autre identifiant part d'une appli vide. Ce qui est déjà enregistré est gardé.
 * @param {string} identifier
 */
export function login(identifier) {
	if (!browser) return;
	const userId = identifier.trim();
	if (!userId) return;

	const saved = readUser(userId);
	// Premier login `demo` seulement : ensuite on relit le localStorage.
	const payload = saved ?? (userId === 'demo' ? createDemoData() : { venues: [], artists: [], events: [], performances: [] });
	commit({ userId, ...payload });
}

/** Après un rechargement, rouvre le dernier identifiant. */
export function restoreSession() {
	if (!browser) return;
	const userId = localStorage.getItem(SESSION_KEY);
	if (userId) login(userId);
}

/** Ferme la session. Les données du compte restent dans le navigateur. */
export function logout() {
	if (!browser) return;
	localStorage.removeItem(SESSION_KEY);
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

	const venue = { id: crypto.randomUUID(), name, city, country };
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

	const artist = { id: crypto.randomUUID(), name: trimmed };
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
		id: crypto.randomUUID(),
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
			id: crypto.randomUUID(),
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

/** Events `planned` dont la date n'est pas passée, du plus proche au plus lointain.
 * @param {AppData} state
 */
export function upcomingEvents(state) {
	return state.events
		.filter((event) => event.status === 'planned' && !isPast(event))
		.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** `planned` et date passée. Ce n'est pas un statut enregistré.
 * @param {AppData} state
 */
export function toConfirmEvents(state) {
	return state.events
		.filter((event) => event.status === 'planned' && isPast(event))
		.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Vus et ratés, du plus récent au plus ancien (date de fin, sinon de début).
 * @param {AppData} state
 */
export function historyEvents(state) {
	return state.events
		.filter((event) => event.status === 'attended' || event.status === 'missed')
		.sort((a, b) => effectiveDate(b).localeCompare(effectiveDate(a)));
}
