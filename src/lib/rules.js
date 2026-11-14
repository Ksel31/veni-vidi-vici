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
 * Sélection de dates dans le calendrier. Un toucher = un jour déjà valide (début = fin).
 * Un second toucher sur une autre date forme la plage, dans n'importe quel ordre.
 * Un toucher après une plage complète recommence. `fin` vide ou égale au début = un seul jour choisi.
 * @param {{ debut: string, fin: string }} choix
 * @param {string} iso
 * @param {'single' | 'range'} [mode] `single` : un concert, une seule date.
 * @returns {{ debut: string, fin: string }}
 */
export function choisirDate(choix, iso, mode = 'range') {
	const unSeulJour = Boolean(choix.debut) && (!choix.fin || choix.fin === choix.debut);
	if (mode === 'single' || !unSeulJour) return { debut: iso, fin: mode === 'single' ? '' : iso };
	return iso < choix.debut ? { debut: iso, fin: choix.debut } : { debut: choix.debut, fin: iso };
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

/** Ce nom de groupe est-il déjà dans le line-up ? Sans tenir compte des majuscules ni des espaces autour.
 * Sert à dire « Déjà dans le line-up » au lieu d'ignorer l'ajout en silence (le « + » semblait ne rien faire).
 * @param {string[]} noms
 * @param {string} nom
 */
export function nomDejaPris(noms, nom) {
	const voulu = nom.trim().toLowerCase();
	return noms.some((item) => item.trim().toLowerCase() === voulu);
}
