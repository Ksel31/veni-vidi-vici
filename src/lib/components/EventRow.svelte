<script>
	import { dateParts, daysUntil, eventTitle, findVenue } from '#lib/present.js';

	/** @type {{ event: import('#lib/store.js').Event, performances: import('#lib/store.js').Performance[], artists: import('#lib/store.js').Artist[], venues: import('#lib/store.js').Venue[] }} */
	let { event, performances, artists, venues } = $props();

	const title = $derived(eventTitle(event, performances, artists));
	const venue = $derived(findVenue(venues, event.venueId));
	const date = $derived(dateParts(event.startDate));
	const days = $derived(daysUntil(event.startDate));
	const place = $derived(venue ? `${venue.name}, ${venue.city}` : '');
</script>

<a class="event-row" href="/event/{event.id}">
	<span class="date-block">
		<span class="date-day">{date.day}</span>
		<span class="date-month">{date.monthLabel}</span>
	</span>
	<span class="event-info">
		<span class="event-row-title">{title}</span>
		<span class="event-row-meta">{place}</span>
		{#if event.ticketBought}
			<span class="ticket-pill">
				<!-- icône via CSS mask dans le span, le texte porte l'état -->
				<span class="mini-icon" style:--icon="url('/icons/ticket.svg')"></span>
				Billet acheté
			</span>
		{/if}
	</span>
	<span class="countdown">J-{days}</span>
</a>
