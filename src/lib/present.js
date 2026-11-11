// Mise en forme des events pour les écrans. Les mois courts sont ceux des maquettes (NOV, DÉC, JUIL…).

const MONTHS = ['JAN', 'FÉV', 'MARS', 'AVR', 'MAI', 'JUIN', 'JUIL', 'AOÛT', 'SEPT', 'OCT', 'NOV', 'DÉC'];

/** @param {string} iso */
export function dateParts(iso) {
	const [year, month, day] = iso.split('-').map(Number);
	return { year, month, day, monthLabel: MONTHS[month - 1] ?? '' };
}

/** Nombre de jours entre aujourd'hui et cette date (0 = aujourd'hui).
 * @param {string} iso
 */
export function daysUntil(iso) {
	const { year, month, day } = dateParts(iso);
	const target = new Date(year, month - 1, day);
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return Math.round((target.getTime() - today.getTime()) / 86400000);
}

/** @param {number} days */
export function untilHeading(days) {
	if (days <= 0) return "Aujourd'hui";
	if (days === 1) return 'Dans 1 jour';
	return `Dans ${days} jours`;
}

/** @param {string} start @param {string | null} end */
export function dayCount(start, end) {
	if (!end || end === start) return 1;
	return daysUntil(end) - daysUntil(start) + 1;
}

/**
 * @param {import('./store.js').Event} event
 * @param {import('./store.js').Performance[]} performances
 * @param {import('./store.js').Artist[]} artists
 */
export function eventTitle(event, performances, artists) {
	if (event.title) return event.title;
	const headliner = performances.find(
		(performance) => performance.eventId === event.id && performance.billing === 'headliner'
	);
	const artist = headliner && artists.find((item) => item.id === headliner.artistId);
	return artist ? artist.name : 'Sans titre';
}

/**
 * @param {import('./store.js').Venue[]} venues
 * @param {string} venueId
 */
export function findVenue(venues, venueId) {
	return venues.find((venue) => venue.id === venueId) ?? null;
}
