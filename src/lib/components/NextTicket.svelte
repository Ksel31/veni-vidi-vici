<script>
	import { dateParts, eventTitle, findVenue, venueLine } from '#lib/present.js';

	/** @type {{ event: import('#lib/store.js').Event, performances: import('#lib/store.js').Performance[], artists: import('#lib/store.js').Artist[], venues: import('#lib/store.js').Venue[] }} */
	let { event, performances, artists, venues } = $props();

	const title = $derived(eventTitle(event, performances, artists));
	const venue = $derived(findVenue(venues, event.venueId));
	const date = $derived(dateParts(event.startDate));
	const place = $derived(venueLine(venue) ?? 'Lieu à venir');
</script>

<a class="ticket" href="/event/{event.id}">
	<img class="ticket-bg" src="/images/ticket-holo.png" alt="" />
	<span class="ticket-body">
		<span class="ticket-type">{event.type === 'festival' ? 'FESTIVAL' : 'CONCERT'}</span>
		<span class="ticket-title">{title}</span>
		<span class="ticket-place">{place}</span>
		{#if event.ticketBought}
			<span class="ticket-pill ticket-pill-on-green">
				<span class="mini-icon" style:--icon="url('/icons/ticket.svg')"></span>
				Billet acheté
			</span>
		{/if}
	</span>
	<span class="ticket-stub">
		<span class="ticket-day">{date.day}</span>
		<span class="ticket-month">{date.monthLabel}</span>
	</span>
</a>
