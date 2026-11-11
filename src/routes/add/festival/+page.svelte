<script>
	import { goto } from '$app/navigation';
	import { data, addArtist, addEvent, addVenue } from '#lib/store.js';
	import { dayChipLabel, daysFrom, daysUntil } from '#lib/present.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import VenueField from '#lib/components/VenueField.svelte';
	import ArtistField from '#lib/components/ArtistField.svelte';
	import DateRangeField from '#lib/components/DateRangeField.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let title = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let venueName = $state('');
	let venueCity = $state('');
	let venueId = $state(/** @type {string | null} */ (null));
	let ticketBought = $state(false);
	let priceText = $state('');

	/** @type {{ key: string, name: string, day: string | null }[]} */
	let bands = $state([]);

	const festivalDays = $derived(daysFrom(startDate, endDate));
	const canSave = $derived(
		Boolean(title.trim() && startDate && endDate && endDate >= startDate && venueReady() && bands.length > 0) &&
			bands.every((band) => band.day && festivalDays.includes(band.day))
	);

	function venueReady() {
		if (venueId) return true;
		return Boolean(venueName.trim() && venueCity.trim());
	}

	/** @param {string} name */
	function addBand(name) {
		const trimmed = name.trim();
		if (!trimmed) return;
		if (bands.some((band) => band.name.toLowerCase() === trimmed.toLowerCase())) return;
		bands = [...bands, { key: crypto.randomUUID(), name: trimmed, day: null }];
	}

	/** @param {string} key @param {string} day */
	function chooseDay(key, day) {
		bands = bands.map((band) => (band.key === key ? { ...band, day } : band));
	}

	// Un jour qui sort de la plage n'est plus valable.
	$effect(() => {
		const allowed = new Set(festivalDays);
		if (bands.some((band) => band.day && !allowed.has(band.day))) {
			bands = bands.map((band) => (band.day && allowed.has(band.day) ? band : { ...band, day: null }));
		}
	});

	function parsePrice() {
		const cleaned = priceText.trim().replace(',', '.').replace(/[^\d.]/g, '');
		if (!cleaned) return null;
		const value = Number(cleaned);
		return Number.isFinite(value) ? value : null;
	}

	function save() {
		if (!canSave) return;
		const id =
			venueId ??
			addVenue({ name: venueName.trim(), city: venueCity.trim(), country: 'Belgique' });
		if (!id) return;
		const past = daysUntil(endDate) < 0;
		const eventId = addEvent(
			{
				type: 'festival',
				title: title.trim(),
				startDate,
				endDate,
				venueId: id,
				status: past ? 'attended' : 'planned',
				ticketBought,
				ticketPrice: parsePrice()
			},
			bands.map((band) => ({
				artistId: addArtist(band.name) ?? '',
				billing: null,
				day: band.day,
				status: 'to_see'
			}))
		);
		if (eventId) goto(`/event/${eventId}`);
	}
</script>

<svelte:head>
	<title>Nouveau festival — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-pad add-form">
	<ScreenHeader title="Nouveau festival" backHref="/add" />
	<p class="hint">* Obligatoire</p>

	<div class="glass-card">
		<p class="card-title">Le festival</p>
		<div class="field">
			<label for="festival-title">Titre *</label>
			<div class="field-box">
				<Icon name="tent" size={20} />
				<input id="festival-title" bind:value={title} placeholder="Ex. Desertfest" autocomplete="off" />
			</div>
		</div>
		<DateRangeField bind:start={startDate} bind:end={endDate} />
		<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
	</div>

	<div class="glass-card">
		<p class="card-title">Line-up à voir *</p>
		{#each bands as band (band.key)}
			<div class="band-row festival-band">
				<span class="band-name">{band.name}</span>
				<button class="icon-button band-remove" type="button" aria-label="Retirer {band.name}" onclick={() => (bands = bands.filter((item) => item.key !== band.key))}>
					<Icon name="x" size={20} />
				</button>
				{#if festivalDays.length === 0}
					<p class="hint">Indique d'abord le début et la fin.</p>
				{:else}
					<p class="day-label">Jour *</p>
				<div class="day-chips" role="group" aria-label="Jour de {band.name}">
						{#each festivalDays as day (day)}
							<button
								class="chip"
								class:chip-on={band.day === day}
								type="button"
								aria-pressed={band.day === day}
								onclick={() => chooseDay(band.key, day)}
							>
								{dayChipLabel(day)}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		<ArtistField
			artists={$data.artists}
			taken={bands.map((band) => band.name)}
			placeholder="Ajouter un groupe et son jour"
			onAdd={addBand}
		/>
	</div>

	<div class="glass-card">
		<p class="card-title">Billet</p>
		<button class="check-row" type="button" aria-pressed={ticketBought} onclick={() => (ticketBought = !ticketBought)}>
			<span class="check-box" class:check-on={ticketBought}>
				{#if ticketBought}<Icon name="check" size={18} />{/if}
			</span>
			<span>
				<span class="check-title">Billet acheté</span>
				<span class="check-meta">Pas encore ? Décoche, tu pourras le cocher plus tard.</span>
			</span>
		</button>
		<div class="field">
			<label for="festival-price">Prix du billet</label>
			<div class="field-box">
				<Icon name="euro" size={20} />
				<input id="festival-price" inputmode="decimal" bind:value={priceText} placeholder="289,00" autocomplete="off" />
			</div>
		</div>
		<div class="upload-box">
			<Icon name="upload" size={26} />
			<p>Ajouter le billet</p>
			<p class="hint">PDF ou image. L'envoi n'est pas encore branché.</p>
		</div>
	</div>

	<button class="btn btn-primary" type="button" disabled={!canSave} onclick={save}>
		<Icon name="plus" size={22} />
		Ajouter le festival
	</button>
</section>
