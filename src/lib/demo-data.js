// Compte `demo`. Les dates sont calculées à partir d'aujourd'hui
// pour que les trois events restent dans le passé.

/** @param {number} offset @returns {string} AAAA-MM-JJ, calendrier local. */
function daysFromToday(offset) {
	const date = new Date();
	date.setDate(date.getDate() + offset);
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${date.getFullYear()}-${month}-${day}`;
}

export function createDemoData() {
	const seenConcert = daysFromToday(-40);
	const plannedConcert = daysFromToday(-8);
	const festivalStart = daysFromToday(-18);
	const festivalEnd = daysFromToday(-17);

	/** @type {import('./store.js').Venue[]} */
	const venues = [
		{ id: 'venue-ab', name: 'Ancienne Belgique', city: 'Bruxelles', country: 'Belgique' },
		{ id: 'venue-botanique', name: 'Botanique', city: 'Bruxelles', country: 'Belgique' },
		{ id: 'venue-werchter', name: 'Rock Werchter', city: 'Werchter', country: 'Belgique' }
	];

	/** @type {import('./store.js').Artist[]} */
	const artists = [
		{ id: 'artist-nick-cave', name: 'Nick Cave' },
		{ id: 'artist-dry-cleaning', name: 'Dry Cleaning' },
		{ id: 'artist-ghost', name: 'Ghost' },
		{ id: 'artist-fontaines', name: 'Fontaines D.C.' },
		{ id: 'artist-wet-leg', name: 'Wet Leg' },
		{ id: 'artist-idles', name: 'Idles' },
		{ id: 'artist-slowdive', name: 'Slowdive' }
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
			startDate: plannedConcert,
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
			id: 'event-werchter',
			type: 'festival',
			title: 'Rock Werchter',
			startDate: festivalStart,
			endDate: festivalEnd,
			venueId: 'venue-werchter',
			status: 'planned',
			ticketBought: false,
			ticketPrice: null,
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
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-dry-cleaning',
			eventId: 'event-nick-cave',
			artistId: 'artist-dry-cleaning',
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
			id: 'perf-fontaines',
			eventId: 'event-werchter',
			artistId: 'artist-fontaines',
			billing: 'headliner',
			day: festivalStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-wet-leg',
			eventId: 'event-werchter',
			artistId: 'artist-wet-leg',
			billing: 'support',
			day: festivalStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-idles',
			eventId: 'event-werchter',
			artistId: 'artist-idles',
			billing: 'headliner',
			day: festivalEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'perf-slowdive',
			eventId: 'event-werchter',
			artistId: 'artist-slowdive',
			billing: 'support',
			day: festivalEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		}
	];

	return { venues, artists, events, performances };
}
