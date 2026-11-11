<script>
	/** @type {{ venues: import('#lib/store.js').Venue[], name?: string, city?: string, venueId?: string | null }} */
	let { venues, name = $bindable(''), city = $bindable(''), venueId = $bindable(null) } = $props();

	const query = $derived(name.trim().toLowerCase());
	const matches = $derived(
		query
			? venues.filter((venue) => venue.name.toLowerCase().includes(query)).slice(0, 6)
			: []
	);
	const known = $derived(venues.some((venue) => venue.name.toLowerCase() === query));

	/** @param {string} value */
	function onName(value) {
		name = value;
		const exact = venues.find((venue) => venue.name.toLowerCase() === value.trim().toLowerCase());
		venueId = exact ? exact.id : null;
	}

	/** @param {import('#lib/store.js').Venue} venue */
	function pick(venue) {
		name = venue.name;
		city = venue.city;
		venueId = venue.id;
	}
</script>

<div class="field">
	<label for="venue-name">Lieu *</label>
	<div class="field-box">
		<span class="icon" style:width="20px" style:height="20px" style:--icon="url('/icons/map-pin.svg')"></span>
		<input id="venue-name" value={name} autocomplete="off" oninput={(event) => onName(event.currentTarget.value)} />
	</div>
	{#if matches.length > 0 && !known}
		<ul class="suggestions">
			{#each matches as venue (venue.id)}
				<li>
					<button type="button" onclick={() => pick(venue)}>{venue.name}, {venue.city}</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

{#if name.trim() && !venueId}
	<div class="field">
		<label for="venue-city">Ville *</label>
		<div class="field-box">
			<span class="icon" style:width="20px" style:height="20px" style:--icon="url('/icons/map-pin.svg')"></span>
			<input id="venue-city" bind:value={city} autocomplete="off" />
		</div>
	</div>
{/if}
