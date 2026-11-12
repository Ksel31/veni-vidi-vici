// Compte `demo`. Les dates sont calculées au chargement, à partir d'aujourd'hui.
// Répartition d'origine : un vu, deux à confirmer (concert + festival),
// un concert à venir avec billet, un festival à venir sur 3 jours.

/** Incrémenter pour réécrire le compte `demo` déjà enregistré dans le navigateur. */
export const DEMO_SEED_VERSION = 2;

/** @param {number} offset @returns {string} AAAA-MM-JJ, calendrier local. */
function daysFromToday(offset) {
	const date = new Date();
	date.setDate(date.getDate() + offset);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

export function createDemoData() {
	const seenConcert = daysFromToday(-60);
	const confirmConcert = daysFromToday(-6);
	const pastFestStart = daysFromToday(-20);
	const pastFestEnd = daysFromToday(-19);
	const nextConcert = daysFromToday(3);
	const festStart = daysFromToday(24);
	const festMid = daysFromToday(25);
	const festEnd = daysFromToday(26);

	/** @type {import('./store.js').Venue[]} */
	const venues = [
		{ id: 'venue-ab', name: 'Ancienne Belgique', city: 'Bruxelles', country: 'Belgique' },
		{ id: 'venue-botanique', name: 'Botanique', city: 'Bruxelles', country: 'Belgique' },
		{ id: 'venue-werchter', name: 'Rock Werchter', city: 'Werchter', country: 'Belgique' }
	];

	/** @type {import('./store.js').Artist[]} */
	const artists = [
		{ id: 'artist-nick-cave', name: 'Nick Cave' },
		{ id: 'artist-cat-power', name: 'Cat Power' },
		{ id: 'artist-ghost', name: 'Ghost' },
		{ id: 'artist-fontaines', name: 'Fontaines D.C.' },
		{ id: 'artist-gojira', name: 'Gojira' },
		{ id: 'artist-idles', name: 'Idles' },
		{ id: 'artist-wet-leg', name: 'Wet Leg' },
		{ id: 'artist-mastodon', name: 'Mastodon' },
		{ id: 'artist-turnstile', name: 'Turnstile' },
		{ id: 'artist-slowdive', name: 'Slowdive' },
		{ id: 'artist-dry-cleaning', name: 'Dry Cleaning' }
	];

	/** @type {import('./store.js').Event[]} */
	const events = [
		{
			id: 'event-nick-cave',
			type: 'concert',
			title: 'Nick Cave',
			startDate: seenConcert,
			endDate: null,
			venueId: 'venue-ab',
			status: 'attended',
			ticketBought: false,
			ticketPrice: null,
			ticketFile: null,
			photos: [],
			daysAttended: [],
			thumb: 'up',
			comment: 'La voix, le silence, tout y était.',
			companions: []
		},
		{
			id: 'event-ghost',
			type: 'concert',
			title: 'Ghost',
			startDate: confirmConcert,
			endDate: null,
			venueId: 'venue-botanique',
			status: 'planned',
			ticketBought: false,
			ticketPrice: null,
			ticketFile: null,
			photos: [],
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		},
		{
			id: 'event-nuits',
			type: 'festival',
			title: 'Les Nuits',
			startDate: pastFestStart,
			endDate: pastFestEnd,
			venueId: 'venue-botanique',
			status: 'planned',
			ticketBought: false,
			ticketPrice: null,
			ticketFile: null,
			photos: [],
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		},
		{
			id: 'event-fontaines',
			type: 'concert',
			title: 'Fontaines D.C.',
			startDate: nextConcert,
			endDate: null,
			venueId: 'venue-ab',
			status: 'planned',
			ticketBought: true,
			ticketPrice: 49,
			ticketFile: null,
			photos: [],
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		},
		{
			id: 'event-werchter',
			type: 'festival',
			title: 'Rock Werchter',
			startDate: festStart,
			endDate: festEnd,
			venueId: 'venue-werchter',
			status: 'planned',
			ticketBought: true,
			ticketPrice: 289,
			ticketFile: null,
			photos: [],
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		}
	];

	/** @type {import('./store.js').Performance[]} */
	const performances = [
		{
			id: 'perf-nick-cave',
			eventId: 'event-nick-cave',
			artistId: 'artist-nick-cave',
			billing: 'headliner',
			day: null,
			status: 'seen',
			thumb: 'up',
			setlist: ''
		},
		{
			id: 'perf-cat-power',
			eventId: 'event-nick-cave',
			artistId: 'artist-cat-power',
			billing: 'support',
			day: null,
			status: 'seen',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-ghost',
			eventId: 'event-ghost',
			artistId: 'artist-ghost',
			billing: 'headliner',
			day: null,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-nuits-dry',
			eventId: 'event-nuits',
			artistId: 'artist-dry-cleaning',
			billing: 'headliner',
			day: pastFestStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-nuits-wet',
			eventId: 'event-nuits',
			artistId: 'artist-wet-leg',
			billing: 'support',
			day: pastFestStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-nuits-slow',
			eventId: 'event-nuits',
			artistId: 'artist-slowdive',
			billing: 'headliner',
			day: pastFestEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-nuits-idles',
			eventId: 'event-nuits',
			artistId: 'artist-idles',
			billing: 'support',
			day: pastFestEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-fontaines-show',
			eventId: 'event-fontaines',
			artistId: 'artist-fontaines',
			billing: 'headliner',
			day: null,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-gojira',
			eventId: 'event-werchter',
			artistId: 'artist-gojira',
			billing: 'headliner',
			day: festStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-idles',
			eventId: 'event-werchter',
			artistId: 'artist-idles',
			billing: 'support',
			day: festStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-wet-leg',
			eventId: 'event-werchter',
			artistId: 'artist-wet-leg',
			billing: 'support',
			day: festStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-mastodon',
			eventId: 'event-werchter',
			artistId: 'artist-mastodon',
			billing: 'headliner',
			day: festMid,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-turnstile',
			eventId: 'event-werchter',
			artistId: 'artist-turnstile',
			billing: 'support',
			day: festMid,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-slowdive',
			eventId: 'event-werchter',
			artistId: 'artist-slowdive',
			billing: 'support',
			day: festMid,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-fontaines-fest',
			eventId: 'event-werchter',
			artistId: 'artist-fontaines',
			billing: 'headliner',
			day: festEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-dry-cleaning',
			eventId: 'event-werchter',
			artistId: 'artist-dry-cleaning',
			billing: 'support',
			day: festEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		}
	];

	return { venues, artists, events, performances };
}
