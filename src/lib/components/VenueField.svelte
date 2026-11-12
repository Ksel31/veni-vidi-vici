<script>
	/** @type {{ venues: import('#lib/store.js').Venue[], name?: string, city?: string, venueId?: string | null }} */
	let { venues, name = $bindable(''), city = $bindable(''), venueId = $bindable(null) } = $props();

	const cityQuery = $derived(city.trim().toLowerCase());
	const nameQuery = $derived(name.trim().toLowerCase());

	const cityMatches = $derived.by(() => {
		if (!cityQuery) return [];
		const cities = [...new Set(venues.map((venue) => venue.city).filter(Boolean))];
		return cities
			.filter((item) => item.toLowerCase().includes(cityQuery) && item.toLowerCase() !== cityQuery)
			.slice(0, 6);
	});

	const roomMatches = $derived(
		cityQuery && nameQuery
			? venues
					.filter(
						(venue) =>
							venue.city.toLowerCase().includes(cityQuery) &&
							venue.name.toLowerCase().includes(nameQuery) &&
							venue.id !== venueId
					)
					.slice(0, 6)
			: []
	);

	/** Relie le nom saisi à un lieu de cette ville, ou laisse la création au moment d'enregistrer.
	 * @param {string} cityText
	 * @param {string} nameText
	 */
	function matchRoom(cityText, nameText) {
		const cityKey = cityText.trim().toLowerCase();
		const nameKey = nameText.trim().toLowerCase();
		const exact = venues.find(
			(venue) => venue.name.toLowerCase() === nameKey && venue.city.toLowerCase() === cityKey
		);
		venueId = exact ? exact.id : null;
	}

	/** @param {string} value */
	function onCity(value) {
		city = value;
		if (!value.trim()) {
			name = '';
			venueId = null;
			return;
		}
		matchRoom(value, name);
	}

	/** @param {string} value */
	function onName(value) {
		name = value;
		matchRoom(city, value);
	}

	/** @param {import('#lib/store.js').Venue} venue */
	function pickRoom(venue) {
		name = venue.name;
		city = venue.city;
		venueId = venue.id;
	}
</script>

<div class="field">
	<label for="venue-city">Ville</label>
	<div class="field-box">
		<span class="icon" style:width="20px" style:height="20px" style:--icon="url('/icons/map-pin.svg')"></span>
		<input id="venue-city" value={city} autocomplete="off" oninput={(event) => onCity(event.currentTarget.value)} />
	</div>
	{#if cityMatches.length > 0}
		<ul class="suggestions">
			{#each cityMatches as item (item)}
				<li>
					<button type="button" onclick={() => onCity(item)}>{item}</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<!-- Même repli que la ligne de festival : la salle n'existe qu'avec une ville. -->
<div class="day-panel venue-reveal" class:day-panel-open={Boolean(city.trim())} inert={!city.trim()}>
	<div class="day-panel-inner">
		<div class="field">
			<label for="venue-name">Lieu, salle</label>
			<div class="field-box">
				<span class="icon" style:width="20px" style:height="20px" style:--icon="url('/icons/map-pin.svg')"></span>
				<input id="venue-name" value={name} autocomplete="off" oninput={(event) => onName(event.currentTarget.value)} />
			</div>
			{#if roomMatches.length > 0}
				<ul class="suggestions">
					{#each roomMatches as venue (venue.id)}
						<li>
							<button type="button" onclick={() => pickRoom(venue)}>{venue.name}</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
</div>
