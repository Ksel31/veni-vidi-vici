/**
 * Helpers métier partagés (dates, libellés).
 */

/** Aujourd'hui en YYYY-MM-DD (midi local pour éviter les décalages) */
export function today() {
	const d = new Date();
	d.setHours(12, 0, 0, 0);
	return d.toISOString().slice(0, 10);
}

/**
 * Date de référence d'un event : fin si festival multi-jours, sinon début.
 * @param {{ startDate: string, endDate: string | null }} event
 */
export function eventRefDate(event) {
	return event.endDate || event.startDate;
}

/** Event encore à venir (date de référence >= aujourd'hui) */
export function isUpcoming(event) {
	return eventRefDate(event) >= today();
}

/**
 * « À confirmer » = planned dont la date de référence est passée.
 * @param {import('./types.js').Event} event
 */
export function needsConfirmation(event) {
	return event.status === 'planned' && eventRefDate(event) < today();
}

/**
 * Affiche une date YYYY-MM-DD en français court.
 * @param {string} iso
 */
export function formatDate(iso) {
	if (!iso) return '';
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
}

const WEEKDAYS_FR = [
	'Dimanche',
	'Lundi',
	'Mardi',
	'Mercredi',
	'Jeudi',
	'Vendredi',
	'Samedi'
];

/**
 * Jour en toutes lettres + date : « Samedi (20/12/2026) ».
 * @param {string} iso
 */
export function formatDayLabel(iso) {
	if (!iso) return '';
	const d = new Date(iso + 'T12:00:00');
	return `${WEEKDAYS_FR[d.getDay()]} (${formatDate(iso)})`;
}

/**
 * Plage de dates affichée.
 * @param {import('./types.js').Event} event
 */
export function formatEventDates(event) {
	if (event.endDate && event.endDate !== event.startDate) {
		return `${formatDate(event.startDate)} → ${formatDate(event.endDate)}`;
	}
	return formatDate(event.startDate);
}

/**
 * Titre affiché d'un event (festival = title, concert = artiste tête d'affiche).
 * @param {import('./types.js').Event} event
 * @param {import('./types.js').Performance[]} performances
 * @param {import('./types.js').Artist[]} artists
 */
export function eventDisplayTitle(event, performances, artists) {
	if (event.title) return event.title;

	const lineup = performances.filter((p) => p.eventId === event.id);
	const headliner = lineup.find((p) => p.billing === 'headliner') || lineup[0];
	if (!headliner) return 'Concert';

	const artist = artists.find((a) => a.id === headliner.artistId);
	return artist ? artist.name : 'Concert';
}

/**
 * @param {import('./types.js').Venue | undefined | null} venue
 */
export function formatVenue(venue) {
	if (!venue || (!venue.name && !venue.city)) return 'Lieu non précisé';
	if (venue.name && venue.city && venue.name !== venue.city) {
		return `${venue.name} · ${venue.city}`;
	}
	return venue.name || venue.city;
}

/**
 * Jours inclus entre deux dates ISO (inclusif).
 * @param {string} start
 * @param {string} end
 * @returns {string[]}
 */
export function daysBetween(start, end) {
	const out = [];
	const cur = new Date(start + 'T12:00:00');
	const last = new Date((end || start) + 'T12:00:00');
	while (cur <= last) {
		out.push(cur.toISOString().slice(0, 10));
		cur.setDate(cur.getDate() + 1);
	}
	return out;
}

/**
 * Compte à rebours simple en jours.
 * @param {string} iso
 */
export function daysUntil(iso) {
	const target = new Date(iso + 'T12:00:00');
	const now = new Date();
	now.setHours(12, 0, 0, 0);
	return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/**
 * Tous les prénoms déjà utilisés (autocomplétion accompagnants).
 * @param {import('./types.js').Event[]} events
 */
export function allCompanions(events) {
	const set = new Set();
	for (const e of events) {
		for (const c of e.companions || []) set.add(c);
	}
	return [...set].sort();
}
