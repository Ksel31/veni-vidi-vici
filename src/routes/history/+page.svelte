<script>
	import { data, historyEvents } from '#lib/store.js';
	import { dateParts, dayCount, eventTitle, findVenue, venueLine } from '#lib/present.js';
	import Icon from '#lib/components/Icon.svelte';
	import TabBar from '#lib/components/TabBar.svelte';

	const history = $derived(historyEvents($data));
	const years = $derived(
		[...new Set(history.map((event) => event.startDate.slice(0, 4)))].sort((a, b) => b.localeCompare(a))
	);

	let picked = $state('');
	const year = $derived(years.includes(picked) ? picked : (years[0] ?? ''));
	const visible = $derived(history.filter((event) => event.startDate.startsWith(year)));

	/**
	 * @param {import('#lib/store.js').Event} event
	 * @param {import('#lib/store.js').Venue | null} venue
	 */
	function meta(event, venue) {
		if (event.type === 'festival') {
			const count = dayCount(event.startDate, event.endDate);
			const word = count > 1 ? 'jours' : 'jour';
			const where = venue?.city || venue?.name || 'Lieu à venir';
			return `Festival, ${count} ${word}, ${where}`;
		}
		return venueLine(venue) ?? 'Lieu à venir';
	}
</script>

<svelte:head>
	<title>Historique — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-history">
	<h1 class="history-title">Historique</h1>

	{#if years.length > 0}
		<div class="year-row" role="group" aria-label="Année">
			{#each years as item (item)}
				<button
					class="chip"
					class:chip-on={item === year}
					type="button"
					aria-pressed={item === year}
					onclick={() => (picked = item)}
				>
					{item}
				</button>
			{/each}
		</div>
	{/if}

	{#if history.length === 0}
		<p class="empty-title">Aucun event dans l'historique.</p>
		<p class="hint">Cet écran vide n'est pas encore dessiné.</p>
	{:else if visible.length === 0}
		<p class="empty-title">Aucun event en {year}.</p>
	{:else}
		<div class="card-list">
			{#each visible as event (event.id)}
				{@const venue = findVenue($data.venues, event.venueId)}
				{@const date = dateParts(event.startDate)}
				<a class="history-row" href="/event/{event.id}">
					<span class="date-block">
						<span class="date-day">{String(date.day).padStart(2, '0')}</span>
						<span class="date-month">{date.monthLabel}</span>
					</span>
					<span class="event-info">
						<span class="event-row-title">{eventTitle(event, $data.performances, $data.artists)}</span>
						<span class="event-row-meta">{meta(event, venue)}</span>
					</span>
					<span class="status-badge" class:status-missed={event.status === 'missed'}>
						<Icon name={event.status === 'missed' ? 'x' : 'check'} size={16} />
						{event.status === 'missed' ? 'Raté' : 'Vu'}
					</span>
				</a>
			{/each}
		</div>
	{/if}
</section>

<TabBar />
