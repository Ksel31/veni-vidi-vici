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

/** Pastille de compte à rebours. Le jour même : « Aujourd'hui », jamais « J-0 ».
 * @param {number} days
 */
export function countdownText(days) {
	if (days <= 0) return "Aujourd'hui";
	return `J-${days}`;
}

/** @param {string} start @param {string | null} end */
export function dayCount(start, end) {
	if (!end || end === start) return 1;
	return daysUntil(end) - daysUntil(start) + 1;
}

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const WEEKDAYS_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS_LONG = [
	'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
	'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

/** @param {string} iso */
function calendarDate(iso) {
	const { year, month, day } = dateParts(iso);
	return new Date(year, month - 1, day);
}

/** Passé = la date de fin (ou de début) est avant aujourd'hui. Le jour même reste à venir.
 * @param {Pick<import('./store.js').Event, 'startDate' | 'endDate'>} event
 */
export function eventIsPast(event) {
	return daysUntil(event.endDate || event.startDate) < 0;
}

/** « Sam 14 novembre 2026 ». @param {string} iso */
export function spokenDate(iso) {
	const { year, month, day } = dateParts(iso);
	return `${WEEKDAYS[calendarDate(iso).getDay()]} ${day} ${MONTHS_LONG[month - 1]} ${year}`;
}

/** « Samedi 17 octobre ». @param {string} iso */
export function dayHeading(iso) {
	const { month, day } = dateParts(iso);
	const name = WEEKDAYS_LONG[calendarDate(iso).getDay()];
	return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${day} ${MONTHS_LONG[month - 1]}`;
}

/** « Samedi ». @param {string} iso */
export function weekdayName(iso) {
	const name = WEEKDAYS_LONG[calendarDate(iso).getDay()];
	return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

/** « 17 et 18 octobre 2026 ». @param {string} start @param {string | null} end */
export function rangePhrase(start, end) {
	const a = dateParts(start);
	if (!end || end === start) return `${a.day} ${MONTHS_LONG[a.month - 1]} ${a.year}`;
	const b = dateParts(end);
	if (a.year === b.year && a.month === b.month) {
		return `${a.day} et ${b.day} ${MONTHS_LONG[a.month - 1]} ${a.year}`;
	}
	if (a.year === b.year) {
		return `${a.day} ${MONTHS_LONG[a.month - 1]} et ${b.day} ${MONTHS_LONG[b.month - 1]} ${a.year}`;
	}
	return `${a.day} ${MONTHS_LONG[a.month - 1]} ${a.year} et ${b.day} ${MONTHS_LONG[b.month - 1]} ${b.year}`;
}

/** Ligne sous le titre. Sans lieu : « Lieu à venir ».
 * @param {import('./store.js').Event} event
 * @param {import('./store.js').Venue | null} venue
 */
export function eventSummary(event, venue) {
	const place = venue?.city || venue?.name || 'Lieu à venir';
	if (event.type === 'festival') {
		return `Festival, ${rangePhrase(event.startDate, event.endDate)}, ${place}`;
	}
	return `Concert, ${spokenDate(event.startDate)}, ${venueLine(venue) ?? 'Lieu à venir'}`;
}

/** @param {number | null} value */
export function priceLabel(value) {
	if (value == null) return '';
	const formatted = new Intl.NumberFormat('fr-FR', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(value);
	return `${formatted} €`;
}

/** Libellé de puce, comme « Jeu 17 ». @param {string} iso */
export function dayChipLabel(iso) {
	const { year, month, day } = dateParts(iso);
	const date = new Date(year, month - 1, day);
	return `${WEEKDAYS[date.getDay()]} ${day}`;
}

/** Un jour ISO par date, du début à la fin inclus. @param {string} start @param {string} end */
export function daysFrom(start, end) {
	if (!start || !end || end < start) return [];
	const first = dateParts(start);
	const last = dateParts(end);
	const cursor = new Date(first.year, first.month - 1, first.day);
	const stop = new Date(last.year, last.month - 1, last.day);
	/** @type {string[]} */
	const list = [];
	while (cursor <= stop) {
		const month = String(cursor.getMonth() + 1).padStart(2, '0');
		const day = String(cursor.getDate()).padStart(2, '0');
		list.push(`${cursor.getFullYear()}-${month}-${day}`);
		cursor.setDate(cursor.getDate() + 1);
	}
	return list;
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
 * @param {string | null | undefined} venueId
 */
export function findVenue(venues, venueId) {
	if (!venueId) return null;
	return venues.find((venue) => venue.id === venueId) ?? null;
}

/** « Ancienne Belgique, Bruxelles », ou le nom seul si la ville est vide.
 * @param {import('./store.js').Venue | null} venue
 */
export function venueLine(venue) {
	if (!venue?.name) return null;
	return venue.city ? `${venue.name}, ${venue.city}` : venue.name;
}
