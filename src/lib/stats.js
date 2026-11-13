// Calculs de l'écran Statistiques (« Vici »). Tout vient du store : rien n'est écrit en dur.
// Une règle par fonction, expliquée juste au-dessus.

import { upcomingEvents } from './store.js';
import { dayCount, eventTitle, findVenue, venueLine } from './present.js';

/** Nombre de lignes d'un classement.
 * TODO : la maquette montre 3 lignes ; limite à confirmer. */
const RANK_LIMIT = 5;

/** Nombre d'events « derniers aimés » affichés (maquette : 3). */
const LIKED_LIMIT = 3;

/**
 * Events vus. Seul `attended` compte : « raté » et « à venir » sont comptés à part.
 * @param {import('./store.js').AppData} state
 */
function seenEvents(state) {
	return state.events.filter((event) => event.status === 'attended');
}

/** L'année d'un event est celle de sa date de début (comme l'historique).
 * @param {import('./store.js').Event} event
 */
function yearOf(event) {
	return event.startDate.slice(0, 4);
}

/** Années où il y a au moins un event vu, les plus récentes d'abord.
 * @param {import('./store.js').AppData} state
 */
export function statsYears(state) {
	return [...new Set(seenEvents(state).map(yearOf))].sort((a, b) => b.localeCompare(a));
}

/** Groupes différents vus (un groupe vu à deux events compte une fois).
 * Un passage compte s'il est `seen`, dans un event vu. Sert aussi au profil.
 * @param {import('./store.js').AppData} state
 */
export function seenBandCount(state) {
	const seenIds = new Set(seenEvents(state).map((event) => event.id));
	const artists = state.performances
		.filter((performance) => performance.status === 'seen' && seenIds.has(performance.eventId))
		.map((performance) => performance.artistId);
	return new Set(artists).size;
}

/**
 * Compte les valeurs, du plus fréquent au moins fréquent (égalité : ordre alphabétique).
 * @param {string[]} labels
 * @returns {Array<{ label: string, count: number }>}
 */
function countBy(labels) {
	const counts = new Map();
	for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
	return [...counts.entries()]
		.map(([label, count]) => ({ label, count }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}

/** Ajoute la part du premier du classement (100 % = le premier).
 * @param {Array<{ label: string, count: number }>} ranking
 */
function withShare(ranking) {
	const top = ranking[0]?.count ?? 1;
	return ranking.slice(0, RANK_LIMIT).map((row, index) => ({
		...row,
		rank: index + 1,
		share: Math.round((row.count / top) * 100)
	}));
}

/**
 * Toutes les stats pour une année (`''` = toutes années cumulées).
 * @param {import('./store.js').AppData} state
 * @param {string} year
 */
export function computeStats(state, year) {
	const inScope = (/** @type {import('./store.js').Event} */ event) => !year || yearOf(event) === year;
	const seen = seenEvents(state).filter(inScope);
	const seenIds = new Set(seen.map((event) => event.id));

	// Chiffres clés ---------------------------------------------------------
	const concerts = seen.filter((event) => event.type === 'concert').length;
	const festivals = seen.filter((event) => event.type === 'festival').length;

	// Jours de festival : les jours cochés sur la fiche (`daysAttended`).
	// Festival marqué « Vu » sans jours cochés : on compte toute sa plage de dates.
	const festivalDays = seen
		.filter((event) => event.type === 'festival')
		.reduce(
			(total, event) =>
				total + (event.daysAttended.length > 0 ? event.daysAttended.length : dayCount(event.startDate, event.endDate)),
			0
		);

	// Groupes vus : groupes différents, passages `seen` des events vus.
	const seenPerformances = state.performances.filter(
		(performance) => performance.status === 'seen' && seenIds.has(performance.eventId)
	);
	const bands = new Set(seenPerformances.map((performance) => performance.artistId)).size;

	// Lieux différents : lieux distincts des events vus (sans lieu = non compté).
	const venueIds = seen.map((event) => event.venueId).filter((id) => id !== null);
	const venues = new Set(venueIds).size;

	// Légende : events ratés et à venir de la même année.
	const missed = state.events.filter((event) => event.status === 'missed' && inScope(event)).length;
	const upcoming = upcomingEvents(state).filter(inScope).length;

	// Histogramme : events vus par mois (mois de la date de début) ---------
	const perMonth = Array.from({ length: 12 }, () => 0);
	for (const event of seen) perMonth[Number(event.startDate.slice(5, 7)) - 1] += 1;
	const maxPerMonth = Math.max(...perMonth);
	// Pic : le plus haut ; à égalité, le premier mois de l'année.
	const peakMonth = maxPerMonth > 0 ? perMonth.indexOf(maxPerMonth) : -1;

	// Groupes les plus vus : au moins 2 passages vus (chaque event compte une fois par groupe).
	const artistName = new Map(state.artists.map((artist) => [artist.id, artist.name]));
	const oncePerEvent = new Map(seenPerformances.map((p) => [`${p.eventId}|${p.artistId}`, p.artistId]));
	const bandNames = [...oncePerEvent.values()].map((id) => artistName.get(id) ?? '');
	const topBands = withShare(countBy(bandNames.filter(Boolean)).filter((row) => row.count >= 2));

	// Lieux les plus fréquentés : nombre d'events vus par lieu, « Salle, Ville ».
	const venueLabels = seen
		.map((event) => venueLine(findVenue(state.venues, event.venueId)))
		.filter((label) => label !== null);
	const topVenues = withShare(countBy(venueLabels));

	// Avec qui : prénoms des comptes rendus, comptés une fois par event vu.
	// « léa » et « Léa » sont le même prénom ; on garde la première écriture rencontrée.
	/** @type {Map<string, string>} */
	const spelling = new Map();
	const names = seen.flatMap((event) => {
		const unique = new Set();
		for (const raw of event.companions) {
			const name = raw.trim();
			if (!name) continue;
			const key = name.toLowerCase();
			if (!spelling.has(key)) spelling.set(key, name);
			unique.add(key);
		}
		return [...unique];
	});
	const topCompanions = withShare(
		countBy(names).map((row) => ({ ...row, label: spelling.get(row.label) ?? row.label }))
	);

	// Ressenti : pouce de l'event (pas ceux des groupes) --------------------
	const liked = seen.filter((event) => event.thumb === 'up');
	const disliked = seen.filter((event) => event.thumb === 'down').length;
	const rated = liked.length + disliked;
	// Derniers aimés : du plus récent au plus ancien (date de fin, sinon de début).
	const lastLiked = [...liked]
		.sort((a, b) => (b.endDate || b.startDate).localeCompare(a.endDate || a.startDate))
		.slice(0, LIKED_LIMIT)
		.map((event) => ({
			id: event.id,
			title: eventTitle(event, state.performances, state.artists),
			type: event.type,
			date: event.startDate
		}));

	return {
		seenCount: seen.length,
		concerts,
		festivals,
		festivalDays,
		bands,
		venues,
		missed,
		upcoming,
		perMonth,
		peakMonth,
		peakCount: maxPerMonth,
		topBands,
		topVenues,
		topCompanions,
		likedCount: liked.length,
		dislikedCount: disliked,
		ratedCount: rated,
		likedShare: rated > 0 ? Math.round((liked.length / rated) * 100) : 0,
		lastLiked
	};
}
