// Règles métier pures (dates, présence, listes d'events) : aucune dépendance à Svelte ni au navigateur.
// Une seule définition de « passé » pour tout le code (store, stats, écrans).
// Les types (Event, Performance, AppData…) sont décrits en tête de store.js.

/** @returns {string} AAAA-MM-JJ, calendrier local. */
export function todayIso() {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, '0');
	const day = String(now.getDate()).padStart(2, '0');
	return `${now.getFullYear()}-${month}-${day}`;
}

/** Festival : la date de fin. Sinon le jour de début.
 * @param {Pick<import('./store.js').Event, 'startDate' | 'endDate'>} event
 */
export function effectiveDate(event) {
	return event.endDate || event.startDate;
}

/** Dates d'un festival valides : début et fin remplis, fin le même jour ou après (festival d'un jour permis).
 * @param {string} start @param {string} end
 */
export function festivalDatesValid(start, end) {
	return Boolean(start && end && end >= start);
}

/**
 * Passé = strictement avant aujourd'hui.
 * Le jour même reste « à venir » (pas encore à confirmer).
 * @param {Pick<import('./store.js').Event, 'startDate' | 'endDate'>} event
 * @param {string} [today]
 */
export function isPast(event, today = todayIso()) {
	return effectiveDate(event) < today;
}

/**
 * Aujourd'hui ou plus tard : l'event redevient `planned`.
 * @param {import('./store.js').Event} event
 * @returns {import('./store.js').Event}
 */
export function normalizeEvent(event) {
	if (!isPast(event) && event.status !== 'planned') {
		return { ...event, status: 'planned' };
	}
	return event;
}

/**
 * Aujourd'hui ou plus tard : les passages de cet event repassent en `to_see`.
 * Festival entier marqué « Raté » (date passée) : tous ses passages passent en `missed`.
 * @param {import('./store.js').Event} event
 * @param {import('./store.js').Performance[]} performances
 * @returns {import('./store.js').Performance[]}
 */
export function applyPerformanceRules(event, performances) {
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

/** Events `planned` dont la date n'est pas passée, du plus proche au plus lointain.
 * @param {import('./store.js').AppData} state
 */
export function upcomingEvents(state) {
	return state.events
		.filter((event) => event.status === 'planned' && !isPast(event))
		.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** `planned` et date passée. Ce n'est pas un statut enregistré.
 * @param {import('./store.js').AppData} state
 */
export function toConfirmEvents(state) {
	return state.events
		.filter((event) => event.status === 'planned' && isPast(event))
		.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/** Vus et ratés, du plus récent au plus ancien (date de fin, sinon de début).
 * @param {import('./store.js').AppData} state
 */
export function historyEvents(state) {
	return state.events
		.filter((event) => event.status === 'attended' || event.status === 'missed')
		.sort((a, b) => effectiveDate(b).localeCompare(effectiveDate(a)));
}
