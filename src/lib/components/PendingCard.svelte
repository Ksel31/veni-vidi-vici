<script>
	import Icon from './Icon.svelte';
	import { missEvent, undoMiss } from '#lib/store.js';
	import { showUndoToast } from '#lib/toast.js';
	import { dateParts, dayCount, eventTitle, findVenue, venueLine } from '#lib/present.js';

	/** @type {{ event: import('#lib/store.js').Event, performances: import('#lib/store.js').Performance[], artists: import('#lib/store.js').Artist[], venues: import('#lib/store.js').Venue[] }} */
	let { event, performances, artists, venues } = $props();

	const title = $derived(eventTitle(event, performances, artists));
	const venue = $derived(findVenue(venues, event.venueId));
	const date = $derived(dateParts(event.startDate));
	const href = $derived(`/event/${event.id}`);

	function markMissed() {
		const snapshot = missEvent(event.id);
		if (!snapshot) return;
		showUndoToast('Event marqué comme raté', () => undoMiss(event.id, snapshot));
	}

	const meta = $derived.by(() => {
		if (event.type === 'festival') {
			const count = dayCount(event.startDate, event.endDate);
			const word = count > 1 ? 'jours' : 'jour';
			const where = venue?.city || venue?.name || 'Lieu à venir';
			return `Festival, ${count} ${word}, ${where}`;
		}
		const place = venueLine(venue);
		return place ? `Concert, ${place}` : 'Lieu à venir';
	});
</script>

<!-- La carte ouvre la fiche. Raté marque tout de suite, sans quitter la liste. -->
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
		<button class="btn btn-secondary" type="button" onclick={markMissed}>
			<Icon name="x" size={22} />
			Raté
		</button>
		<a class="btn btn-primary" {href}>
			<Icon name="check" size={22} />
			Vu
		</a>
	</div>
</article>
