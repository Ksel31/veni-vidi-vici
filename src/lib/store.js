import { get, writable } from 'svelte/store';
import { createDemoData, DEMO_SEED_VERSION } from './demo-data.js';
import { clearAccount, DATA_KEY_PREFIX, loadAccount } from './accounts.js';

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
 * @property {boolean} onboardingSeen
 * @property {number} [seedVersion]
 */

/**
 * @typedef {UserData & { userId: string | null }} AppData
 */

const SESSION_KEY = 'vvv-session';

/** Une clé par identifiant : les comptes ne partagent rien.
 * @param {string} userId
 */
function storageKey(userId) {
	return `${DATA_KEY_PREFIX}${userId}`;
}

/** @returns {AppData} */
function loggedOut() {
	return { userId: null, venues: [], artists: [], events: [], performances: [], onboardingSeen: false };
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
		performances: state.performances,
		onboardingSeen: state.onboardingSeen === true,
		seedVersion: state.seedVersion ?? 0
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
			performances: parsed.performances ?? [],
			onboardingSeen: parsed.onboardingSeen === true,
			seedVersion: typeof parsed.seedVersion === 'number' ? parsed.seedVersion : 0
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
	const empty = { venues: [], artists: [], events: [], performances: [], onboardingSeen: false };
	// `demo` est recalculé quand la version du seed change : les dates suivent
	// le jour du chargement, même si un ancien compte est déjà dans le navigateur.
	// Ça remplace aussi les modifications faites sur ce compte démo.
	const demo = () => ({ ...createDemoData(), onboardingSeen: true, seedVersion: DEMO_SEED_VERSION });
	const payload =
		userId === 'demo'
			? saved && saved.seedVersion === DEMO_SEED_VERSION
				? saved
				: demo()
			: (saved ?? empty);
	commit({ userId, ...payload });
	loadAccount(userId);
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
	clearAccount();
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
			id: old?.id ?? crypto.randomUUID(),
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
