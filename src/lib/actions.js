/**
 * Mutations sur le store (ajout, update, confirmation…).
 */
import { data, newId } from './store.js';
import { today } from './helpers.js';

/**
 * Trouve ou crée un lieu par nom (+ ville optionnelle).
 * @param {import('./types.js').AppData} store
 * @param {string} name
 * @param {string} [city]
 * @param {string} [country]
 */
export function findOrCreateVenue(store, name, city = '', country = 'Belgique') {
	const trimmed = name.trim();
	const cityTrim = city.trim();

	// Pas de salle ni de ville → event sans lieu
	if (!trimmed && !cityTrim) return { store, venueId: '' };

	// Si seulement une ville, on l'utilise comme nom de lieu
	const venueName = trimmed || cityTrim;

	const existing = store.venues.find(
		(v) =>
			v.name.toLowerCase() === venueName.toLowerCase() &&
			(!cityTrim || v.city.toLowerCase() === cityTrim.toLowerCase())
	);
	if (existing) return { store, venueId: existing.id };

	const venue = {
		id: newId('v'),
		name: venueName,
		city: cityTrim || (trimmed ? '' : venueName),
		country
	};
	return {
		store: { ...store, venues: [...store.venues, venue] },
		venueId: venue.id
	};
}

/**
 * Trouve ou crée un artiste par nom.
 * @param {import('./types.js').AppData} store
 * @param {string} name
 */
export function findOrCreateArtist(store, name) {
	const trimmed = name.trim();
	const existing = store.artists.find(
		(a) => a.name.toLowerCase() === trimmed.toLowerCase()
	);
	if (existing) return { store, artistId: existing.id };

	const artist = { id: newId('a'), name: trimmed };
	return {
		store: { ...store, artists: [...store.artists, artist] },
		artistId: artist.id
	};
}

/**
 * @param {object} payload
 * @param {'concert'|'festival'} payload.type
 * @param {string|null} payload.title
 * @param {string} payload.startDate
 * @param {string|null} payload.endDate
 * @param {string} [payload.venueName]
 * @param {string} [payload.venueCity]
 * @param {boolean} payload.ticketBought
 * @param {'planned'|'past'} payload.when — choisi par l'utilisateur à l'ajout
 * @param {{ name: string, billing: 'headliner'|'support'|null, day: string|null }[]} payload.lineup
 * @returns {string} id du nouvel event
 */
export function addEvent(payload) {
	let createdId = '';

	data.update((store) => {
		let next = store;
		const venueResult = findOrCreateVenue(
			next,
			payload.venueName || '',
			payload.venueCity || ''
		);
		next = venueResult.store;

		// « Déjà passé » → Vu (hypothèse du brief) ; sinon prévu
		const status = payload.when === 'past' ? 'attended' : 'planned';

		createdId = newId('e');
		/** @type {import('./types.js').Event} */
		const event = {
			id: createdId,
			type: payload.type,
			title: payload.title,
			startDate: payload.startDate,
			endDate: payload.endDate,
			venueId: venueResult.venueId,
			status,
			ticketBought: payload.ticketBought,
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		};

		/** @type {import('./types.js').Performance[]} */
		const newPerfs = [];
		for (const row of payload.lineup) {
			if (!row.name.trim()) continue;
			const artistResult = findOrCreateArtist(next, row.name);
			next = artistResult.store;
			newPerfs.push({
				id: newId('p'),
				eventId: createdId,
				artistId: artistResult.artistId,
				billing: row.billing,
				day: row.day,
				status: status === 'attended' ? 'seen' : 'to_see',
				thumb: null,
				setlist: ''
			});
		}

		return {
			...next,
			events: [...next.events, event],
			performances: [...next.performances, ...newPerfs]
		};
	});

	return createdId;
}

/**
 * Remplace un event + son line-up (édition).
 * @param {string} eventId
 * @param {Parameters<typeof addEvent>[0]} payload
 */
export function updateEvent(eventId, payload) {
	data.update((store) => {
		let next = store;
		const venueResult = findOrCreateVenue(next, payload.venueName, payload.venueCity);
		next = venueResult.store;

		const existing = next.events.find((e) => e.id === eventId);
		if (!existing) return store;

		const refDate = payload.endDate || payload.startDate;
		let status = existing.status;
		// Si la date repasse dans le futur → planned
		if (refDate >= today()) {
			status = 'planned';
		} else if (status === 'planned') {
			// reste planned (= à confirmer) sauf si on vient d'un ajout passé déjà attended
			status = existing.status;
		}

		const event = {
			...existing,
			type: payload.type,
			title: payload.title,
			startDate: payload.startDate,
			endDate: payload.endDate,
			venueId: venueResult.venueId,
			ticketBought: payload.ticketBought,
			status
		};

		// On reconstruit le line-up (simple pour le prototype)
		const keptOther = next.performances.filter((p) => p.eventId !== eventId);
		/** @type {import('./types.js').Performance[]} */
		const newPerfs = [];
		for (const row of payload.lineup) {
			if (!row.name.trim()) continue;
			const artistResult = findOrCreateArtist(next, row.name);
			next = artistResult.store;
			newPerfs.push({
				id: newId('p'),
				eventId,
				artistId: artistResult.artistId,
				billing: row.billing,
				day: row.day,
				status: status === 'attended' ? 'seen' : status === 'missed' ? 'missed' : 'to_see',
				thumb: null,
				setlist: ''
			});
		}

		return {
			...next,
			events: next.events.map((e) => (e.id === eventId ? event : e)),
			performances: [...keptOther, ...newPerfs]
		};
	});
}

/**
 * Confirme la présence : Vu ou Raté.
 * @param {string} eventId
 * @param {'attended'|'missed'} status
 */
export function confirmPresence(eventId, status) {
	data.update((store) => {
		const event = store.events.find((e) => e.id === eventId);
		if (!event) return store;

		const performances = store.performances.map((p) => {
			if (p.eventId !== eventId) return p;
			// Concert : les passages suivent l'event
			if (event.type === 'concert') {
				return { ...p, status: status === 'attended' ? 'seen' : 'missed' };
			}
			// Festival : on gère jours/groupes ensuite si attended
			return p;
		});

		return {
			...store,
			events: store.events.map((e) =>
				e.id === eventId
					? { ...e, status, daysAttended: status === 'missed' ? [] : e.daysAttended }
					: e
			),
			performances
		};
	});
}

/**
 * Festival : enregistre les jours faits + groupes vus.
 * @param {string} eventId
 * @param {string[]} daysAttended
 * @param {string[]} seenPerformanceIds
 */
export function saveFestivalAttendance(eventId, daysAttended, seenPerformanceIds) {
	const seen = new Set(seenPerformanceIds);
	data.update((store) => ({
		...store,
		events: store.events.map((e) => (e.id === eventId ? { ...e, daysAttended } : e)),
		performances: store.performances.map((p) => {
			if (p.eventId !== eventId) return p;
			// Groupes hors jours cochés → missed ; dans les jours : seen si coché sinon missed
			if (p.day && !daysAttended.includes(p.day)) {
				return { ...p, status: 'missed' };
			}
			return { ...p, status: seen.has(p.id) ? 'seen' : 'missed' };
		})
	}));
}

/**
 * Met à jour le compte rendu d'un event.
 * @param {string} eventId
 * @param {{ thumb: import('./types.js').Thumb, comment: string, companions: string[] }} patch
 */
export function updateEventReport(eventId, patch) {
	data.update((store) => ({
		...store,
		events: store.events.map((e) => (e.id === eventId ? { ...e, ...patch } : e))
	}));
}

/**
 * Met à jour pouce / setlist d'un passage.
 * @param {string} performanceId
 * @param {{ thumb?: import('./types.js').Thumb, setlist?: string }} patch
 */
export function updatePerformance(performanceId, patch) {
	data.update((store) => ({
		...store,
		performances: store.performances.map((p) =>
			p.id === performanceId ? { ...p, ...patch } : p
		)
	}));
}

/** Supprime un event et ses passages. */
export function deleteEvent(eventId) {
	data.update((store) => ({
		...store,
		events: store.events.filter((e) => e.id !== eventId),
		performances: store.performances.filter((p) => p.eventId !== eventId)
	}));
}
