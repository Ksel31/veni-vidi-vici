<script>
	import Icon from './Icon.svelte';
	import { dateParts, dayCount, eventTitle, findVenue } from '#lib/present.js';

	/** @type {{ event: import('#lib/store.js').Event, performances: import('#lib/store.js').Performance[], artists: import('#lib/store.js').Artist[], venues: import('#lib/store.js').Venue[] }} */
	let { event, performances, artists, venues } = $props();

	const title = $derived(eventTitle(event, performances, artists));
	const venue = $derived(findVenue(venues, event.venueId));
	const date = $derived(dateParts(event.startDate));
	const href = $derived(`/event/${event.id}`);

	const meta = $derived.by(() => {
		if (!venue) return event.type === 'festival' ? 'Festival' : 'Concert';
		if (event.type === 'festival') {
			const count = dayCount(event.startDate, event.endDate);
			const word = count > 1 ? 'jours' : 'jour';
			return `Festival, ${count} ${word}, ${venue.city}`;
		}
		return `Concert, ${venue.name}, ${venue.city}`;
	});
</script>

<!-- La maquette envoie la carte vers la fiche : Vu et Raté ne changent pas le statut ici. -->
<article class="pending-card">
	<a class="pending-head" {href}>
		<span class="date-block">
			<span class="date-day">{date.day}</span>
			<span class="date-month">{date.monthLabel}</span>
		</span>
		<span class="event-info">
			<span class="event-row-title">{title}</span>
			<span class="event-row-meta">{meta}</span>
		</span>
	</a>
	<div class="pending-actions">
		<a class="btn btn-secondary" {href}>
			<Icon name="x" size={22} />
			Raté
		</a>
		<a class="btn btn-primary" {href}>
			<Icon name="check" size={22} />
			Vu
		</a>
	</div>
</article>
