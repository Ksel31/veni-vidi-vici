<script>
	import { data } from '#lib/store.js';
	import {
		eventDisplayTitle,
		formatEventDates,
		formatVenue,
		eventRefDate
	} from '#lib/helpers.js';

	let store = $derived($data);

	let pastEvents = $derived(
		store.events
			.filter((e) => e.status === 'attended' || e.status === 'missed')
			.sort((a, b) => eventRefDate(b).localeCompare(eventRefDate(a)))
	);

	let years = $derived(
		[...new Set(pastEvents.map((e) => eventRefDate(e).slice(0, 4)))].sort((a, b) =>
			b.localeCompare(a)
		)
	);

	let yearFilter = $state('all');

	let filtered = $derived(
		yearFilter === 'all'
			? pastEvents
			: pastEvents.filter((e) => eventRefDate(e).startsWith(yearFilter))
	);

	function title(event) {
		return eventDisplayTitle(event, store.performances, store.artists);
	}

	function venue(event) {
		return formatVenue(store.venues.find((v) => v.id === event.venueId));
	}

	function statusLabel(status) {
		return status === 'attended' ? 'Vu' : 'Raté';
	}
</script>

<main>
	<div class="topbar">
		<h1 class="page-title">Vidi</h1>
		<a href="/">Accueil</a>
	</div>

	<div class="field">
		<label for="year">Année</label>
		<select id="year" bind:value={yearFilter}>
			<option value="all">Toutes</option>
			{#each years as y}
				<option value={y}>{y}</option>
			{/each}
		</select>
	</div>

	{#if filtered.length === 0}
		<p class="empty">Aucun event dans l’historique.</p>
	{:else}
		<ul class="list">
			{#each filtered as event}
				<li>
					<a class="list-item" href="/event/{event.id}">
						<div class="title">{title(event)}</div>
						<div class="meta">
							{formatEventDates(event)} · {venue(event)} · {statusLabel(event.status)}
							{#if event.thumb === 'up'}
								· +
							{:else if event.thumb === 'down'}
								· −
							{/if}
						</div>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>
