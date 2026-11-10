/**
 * Données de démo au premier lancement.
 * Les dates sont calculées par rapport à aujourd'hui pour rester utiles.
 */

function daysFromNow(offset) {
	const d = new Date();
	d.setHours(12, 0, 0, 0);
	d.setDate(d.getDate() + offset);
	return d.toISOString().slice(0, 10);
}

/** @returns {{ venues: import('./types.js').Venue[], artists: import('./types.js').Artist[], events: import('./types.js').Event[], performances: import('./types.js').Performance[] }} */
export function createDemoData() {
	const venues = [
		{ id: 'v1', name: 'Ancienne Belgique', city: 'Bruxelles', country: 'Belgique' },
		{ id: 'v2', name: 'Vooruit', city: 'Gand', country: 'Belgique' },
		{ id: 'v3', name: 'Dour Festival', city: 'Dour', country: 'Belgique' }
	];

	const artists = [
		{ id: 'a1', name: 'IDLES' },
		{ id: 'a2', name: 'Fontaines D.C.' },
		{ id: 'a3', name: 'Black Country, New Road' },
		{ id: 'a4', name: 'Wet Leg' },
		{ id: 'a5', name: 'Shame' },
		{ id: 'a6', name: 'Yard Act' },
		{ id: 'a7', name: 'Squid' },
		{ id: 'a8', name: 'Dry Cleaning' },
		{ id: 'a9', name: 'The Murder Capital' },
		{ id: 'a10', name: 'Kneecap' }
	];

	// Concert passé vu
	const pastSeen = daysFromNow(-30);
	// Concert passé encore planned → « à confirmer »
	const pastToConfirm = daysFromNow(-7);
	// Concert à venir
	const upcomingConcert = daysFromNow(14);
	// Festival à venir (3 jours)
	const festStart = daysFromNow(40);
	const festDay2 = daysFromNow(41);
	const festEnd = daysFromNow(42);
	// Festival passé planned (2 jours) → sélection jours/groupes
	const pastFestStart = daysFromNow(-14);
	const pastFestEnd = daysFromNow(-13);

	const events = [
		{
			id: 'e1',
			type: 'concert',
			title: null,
			startDate: pastSeen,
			endDate: null,
			venueId: 'v1',
			status: 'attended',
			ticketBought: true,
			daysAttended: [],
			thumb: 'up',
			comment: 'Énorme énergie, AB en feu.',
			companions: ['Léa']
		},
		{
			id: 'e2',
			type: 'concert',
			title: null,
			startDate: pastToConfirm,
			endDate: null,
			venueId: 'v2',
			status: 'planned',
			ticketBought: true,
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		},
		{
			id: 'e3',
			type: 'concert',
			title: null,
			startDate: upcomingConcert,
			endDate: null,
			venueId: 'v1',
			status: 'planned',
			ticketBought: true,
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		},
		{
			id: 'e4',
			type: 'festival',
			title: 'Dour 2026',
			startDate: festStart,
			endDate: festEnd,
			venueId: 'v3',
			status: 'planned',
			ticketBought: true,
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		},
		{
			id: 'e5',
			type: 'festival',
			title: 'Weekend Vooruit',
			startDate: pastFestStart,
			endDate: pastFestEnd,
			venueId: 'v2',
			status: 'planned',
			ticketBought: false,
			daysAttended: [],
			thumb: null,
			comment: '',
			companions: []
		}
	];

	const performances = [
		// e1 — concert vu
		{
			id: 'p1',
			eventId: 'e1',
			artistId: 'a1',
			billing: 'headliner',
			day: null,
			status: 'seen',
			thumb: 'up',
			setlist: 'Colossus\nMr. Motivator\nDanny Nedelko'
		},
		{
			id: 'p2',
			eventId: 'e1',
			artistId: 'a5',
			billing: 'support',
			day: null,
			status: 'seen',
			thumb: null,
			setlist: ''
		},
		// e2 — à confirmer
		{
			id: 'p3',
			eventId: 'e2',
			artistId: 'a2',
			billing: 'headliner',
			day: null,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p4',
			eventId: 'e2',
			artistId: 'a4',
			billing: 'support',
			day: null,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		// e3 — à venir
		{
			id: 'p5',
			eventId: 'e3',
			artistId: 'a3',
			billing: 'headliner',
			day: null,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		// e4 — festival à venir, 8 groupes sur 3 jours
		{
			id: 'p6',
			eventId: 'e4',
			artistId: 'a1',
			billing: 'headliner',
			day: festStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p7',
			eventId: 'e4',
			artistId: 'a2',
			billing: 'headliner',
			day: festStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p8',
			eventId: 'e4',
			artistId: 'a5',
			billing: 'support',
			day: festStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p9',
			eventId: 'e4',
			artistId: 'a4',
			billing: 'headliner',
			day: festDay2,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p10',
			eventId: 'e4',
			artistId: 'a6',
			billing: 'support',
			day: festDay2,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p11',
			eventId: 'e4',
			artistId: 'a7',
			billing: 'support',
			day: festDay2,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p12',
			eventId: 'e4',
			artistId: 'a10',
			billing: 'headliner',
			day: festEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p13',
			eventId: 'e4',
			artistId: 'a9',
			billing: 'support',
			day: festEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		// e5 — festival passé à confirmer
		{
			id: 'p14',
			eventId: 'e5',
			artistId: 'a8',
			billing: 'headliner',
			day: pastFestStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p15',
			eventId: 'e5',
			artistId: 'a6',
			billing: 'support',
			day: pastFestStart,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p16',
			eventId: 'e5',
			artistId: 'a7',
			billing: 'headliner',
			day: pastFestEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		},
		{
			id: 'p17',
			eventId: 'e5',
			artistId: 'a3',
			billing: 'support',
			day: pastFestEnd,
			status: 'to_see',
			thumb: null,
			setlist: ''
		}
	];

	return { venues, artists, events, performances };
}
