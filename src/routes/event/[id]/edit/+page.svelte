<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { data, addArtist, addVenue, deleteEvent, saveEditedEvent } from '#lib/store.js';
	import { dayChipLabel, daysFrom, findVenue } from '#lib/present.js';
	import { shellTone } from '#lib/shell.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import VenueField from '#lib/components/VenueField.svelte';
	import ArtistField from '#lib/components/ArtistField.svelte';
	import DateRangeField from '#lib/components/DateRangeField.svelte';
	import Icon from '#lib/components/Icon.svelte';

	const eventId = $derived(page.params.id ?? '');
	const event = $derived($data.events.find((item) => item.id === eventId) ?? null);

	let loadedId = $state('');
	let title = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let venueName = $state('');
	let venueCity = $state('');
	let venueId = $state(/** @type {string | null} */ (null));
	let ticketBought = $state(false);
	let priceText = $state('');
	let confirmingDelete = $state(false);

	/** @type {{ key: string, performanceId: string | null, name: string, billing: 'headliner' | 'support', day: string | null, picking: boolean }[]} */
	let bands = $state([]);

	/** @type {{ key: string, pointerId: number, originY: number, dy: number } | null} */
	let drag = $state(null);

	const festivalDays = $derived(daysFrom(startDate, endDate || startDate));
	const headliners = $derived(bands.filter((band) => band.billing === 'headliner'));
	const supports = $derived(bands.filter((band) => band.billing === 'support'));
	const canSave = $derived.by(() => {
		if (!event) return false;
		if (event.type === 'festival') {
			return Boolean(title.trim() && startDate && endDate && endDate >= startDate) && bands.every((band) => chosenDay(band));
		}
		return Boolean(startDate);
	});

	$effect(() => {
		shellTone.set('bg-event-edit');
		return () => shellTone.set('');
	});

	// Une seule fois : un enregistrement ne doit pas réécraser ce qui est en cours de saisie.
	$effect(() => {
		if (!event || loadedId === event.id) return;
		loadedId = event.id;
		const venue = findVenue($data.venues, event.venueId);
		title = event.title ?? '';
		startDate = event.startDate;
		endDate = event.endDate ?? '';
		venueName = venue?.name ?? '';
		venueCity = venue?.city ?? '';
		venueId = event.venueId;
		ticketBought = event.ticketBought;
		priceText = event.ticketPrice == null ? '' : String(event.ticketPrice).replace('.', ',');
		bands = $data.performances
			.filter((performance) => performance.eventId === event.id)
			.map((performance) => ({
				key: performance.id,
				performanceId: performance.id,
				name: $data.artists.find((artist) => artist.id === performance.artistId)?.name ?? 'Groupe',
				billing: performance.billing === 'support' ? 'support' : 'headliner',
				day: performance.day,
				picking: false
			}));
	});

	/** Lieu connu, lieu nouveau (ville facultative), ou rien. */
	function venueForSave() {
		if (venueId) return venueId;
		if (!venueName.trim()) return null;
		return addVenue({ name: venueName.trim(), city: venueCity.trim(), country: 'Belgique' });
	}

	/** @param {{ day: string | null }} band */
	function chosenDay(band) {
		return band.day && festivalDays.includes(band.day) ? band.day : null;
	}

	/** @param {string} name */
	function addBand(name) {
		const trimmed = name.trim();
		if (!trimmed) return;
		if (bands.some((band) => band.name.toLowerCase() === trimmed.toLowerCase())) return;
		bands = [...bands, {
			key: crypto.randomUUID(),
			performanceId: null,
			name: trimmed,
			billing: 'headliner',
			day: null,
			picking: false
		}];
	}

	/** @param {string} key */
	function removeBand(key) {
		bands = bands.filter((band) => band.key !== key);
	}

	/** @param {string} key */
	function toggleBilling(key) {
		bands = bands.map((band) =>
			band.key === key ? { ...band, billing: band.billing === 'headliner' ? 'support' : 'headliner' } : band
		);
	}

	/** @param {string} key @param {string} day */
	function chooseDay(key, day) {
		bands = bands.map((band) => (band.key === key ? { ...band, day, picking: false } : band));
	}

	/** @param {string} key */
	function reopenDay(key) {
		bands = bands.map((band) => (band.key === key ? { ...band, picking: true } : band));
	}

	/** @param {PointerEvent} pointer @param {string} key */
	function startDrag(pointer, key) {
		if (pointer.pointerType === 'mouse' && pointer.button !== 0) return;
		const handle = pointer.currentTarget;
		if (!(handle instanceof HTMLElement)) return;
		pointer.preventDefault();
		handle.setPointerCapture(pointer.pointerId);
		drag = { key, pointerId: pointer.pointerId, originY: pointer.clientY, dy: 0 };
	}

	/** @param {PointerEvent} pointer */
	function moveDrag(pointer) {
		if (!drag || pointer.pointerId !== drag.pointerId) return;
		drag.dy = pointer.clientY - drag.originY;
	}

	/** @param {PointerEvent} pointer */
	function endDrag(pointer) {
		if (!drag || pointer.pointerId !== drag.pointerId) return;
		const handle = pointer.currentTarget;
		const row = handle instanceof HTMLElement ? handle.closest('.band-row') : null;
		if (row instanceof HTMLElement) row.style.pointerEvents = 'none';
		const hit = document.elementFromPoint(pointer.clientX, pointer.clientY);
		if (row instanceof HTMLElement) row.style.pointerEvents = '';
		const zone = hit?.closest('[data-zone]')?.getAttribute('data-zone');
		if (zone === 'headliner' || zone === 'support') {
			const key = drag.key;
			bands = bands.map((band) => (band.key === key ? { ...band, billing: zone } : band));
		}
		drag = null;
	}

	function parsePrice() {
		const cleaned = priceText.trim().replace(',', '.').replace(/[^\d.]/g, '');
		if (!cleaned) return null;
		const value = Number(cleaned);
		return Number.isFinite(value) ? value : null;
	}

	function save() {
		if (!event || !canSave) return;
		const id = venueForSave();
		if (venueName.trim() && !id) return;
		const bandList = bands.flatMap((band) => {
			const artistId = addArtist(band.name);
			if (!artistId) return [];
			return [{
				performanceId: band.performanceId,
				artistId,
				billing: event.type === 'concert' ? band.billing : null,
				day: event.type === 'festival' ? band.day : null
			}];
		});
		saveEditedEvent(
			event.id,
			{
				title: event.type === 'festival' ? title.trim() : title.trim() || null,
				startDate,
				endDate: event.type === 'festival' ? endDate : null,
				venueId: id,
				ticketBought,
				ticketPrice: parsePrice()
			},
			bandList
		);
		goto(`/event/${event.id}`);
	}

	function removeEvent() {
		if (!event) return;
		deleteEvent(event.id);
		goto('/');
	}
</script>

<svelte:head>
	<title>Modifier l'event — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-detail add-form">
	<ScreenHeader title="Modifier l'event" backHref={event ? `/event/${event.id}` : '/'} />

	{#if !event}
		<p class="empty-title">Cet event n'existe pas.</p>
	{:else if event.type === 'concert'}
		<p class="hint">* Obligatoire</p>
		<div class="glass-card">
			<p class="card-title">Quand et où</p>
			<DateRangeField mode="single" label="Date *" inputId="concert-date" placeholder="Choisir la date" bind:start={startDate} />
			<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
			<div class="field">
				<label for="edit-title">Titre (optionnel)</label>
				<div class="field-box">
					<Icon name="music" size={20} />
					<input id="edit-title" bind:value={title} placeholder="Ex. tournée Wild God" autocomplete="off" />
				</div>
			</div>
		</div>

		<div class="glass-card">
			<p class="card-title">Groupes</p>
			<div class="zone" data-zone="headliner">
				<p class="zone-label">Tête d'affiche</p>
				{#each headliners as band (band.key)}
					{@render row(band)}
				{/each}
			</div>
			<div class="zone" data-zone="support">
				<p class="zone-label">Première partie</p>
				{#each supports as band (band.key)}
					{@render row(band)}
				{/each}
			</div>
			<ArtistField artists={$data.artists} taken={bands.map((band) => band.name)} placeholder="Ajouter un groupe" onAdd={addBand} />
		</div>

		{@render ticket('edit-price')}
		<p class="hint">Si la date repasse à aujourd'hui ou plus tard, l'event redevient prévu.</p>
		{@render actions()}
	{:else}
		<p class="hint">* Obligatoire</p>
		<div class="glass-card">
			<p class="card-title">Le festival</p>
			<div class="field">
				<label for="edit-festival-title">Titre *</label>
				<div class="field-box">
					<Icon name="tent" size={20} />
					<input id="edit-festival-title" bind:value={title} placeholder="Ex. Desertfest" autocomplete="off" />
				</div>
			</div>
			<DateRangeField bind:start={startDate} bind:end={endDate} />
			<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
		</div>

		<div class="glass-card">
			<p class="card-title">Line-up à voir</p>
			{#each bands as band (band.key)}
				{@const day = chosenDay(band)}
				{@const choosing = !day || band.picking}
				<div class="festival-band">
					<div class="band-line">
						<span class="band-name">{band.name}</span>
						{#if day && !band.picking}
							<button class="day-pill" type="button" aria-expanded="false" aria-label="Changer le jour de {band.name}" onclick={() => reopenDay(band.key)}>
								<span>{dayChipLabel(day)}</span>
							</button>
						{/if}
						<button class="icon-button band-remove" type="button" aria-label="Retirer {band.name}" onclick={() => removeBand(band.key)}>
							<Icon name="x" size={16} />
						</button>
					</div>
					<div class="day-panel" class:day-panel-open={choosing} inert={!choosing}>
						<div class="day-panel-inner">
							{#if festivalDays.length === 0}
								<p class="hint">Indique d'abord les dates.</p>
							{:else}
								<p class="day-label">{day ? 'Jour *' : 'Choisis un jour *'}</p>
								<div class="day-chips" role="group" aria-label="Jour de {band.name}">
									{#each festivalDays as option (option)}
										<button class="chip" class:chip-on={day === option} type="button" aria-pressed={day === option} onclick={() => chooseDay(band.key, option)}>
											{dayChipLabel(option)}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
			<ArtistField
				artists={$data.artists}
				taken={bands.map((band) => band.name)}
				placeholder="Ajouter un groupe et son jour"
				onAdd={addBand}
			/>
		</div>

		{@render ticket('edit-festival-price')}
		<p class="hint">Si la date repasse à aujourd'hui ou plus tard, l'event redevient prévu.</p>
		{@render actions()}
	{/if}
</section>

{#snippet ticket(/** @type {string} */ priceId)}
	<div class="glass-card">
		<p class="card-title">Billet</p>
		<button class="check-row" type="button" aria-pressed={ticketBought} onclick={() => (ticketBought = !ticketBought)}>
			<span class="check-box" class:check-on={ticketBought}>
				{#if ticketBought}<Icon name="check" size={18} />{/if}
			</span>
			<span>
				<span class="check-title">Billet acheté</span>
				<span class="check-meta">Coche quand tu l'as en poche.</span>
			</span>
		</button>
		<div class="field">
			<label for={priceId}>Prix du billet</label>
			<div class="field-box">
				<Icon name="euro" size={20} />
				<input id={priceId} inputmode="decimal" bind:value={priceText} placeholder="65,00" autocomplete="off" />
			</div>
		</div>
		<div class="upload-box">
			<Icon name="upload" size={26} />
			<p>Ajouter le billet</p>
			<p class="hint">PDF ou image. L'envoi n'est pas encore branché.</p>
		</div>
	</div>
{/snippet}

{#snippet actions()}
	<button class="btn btn-primary" type="button" disabled={!canSave} onclick={save}>
		<Icon name="check" size={22} />
		Enregistrer
	</button>
	{#if confirmingDelete}
		<div class="glass-card">
			<p class="card-title">Supprimer cet event ?</p>
			<p class="hint">L'event, ses groupes et son compte rendu seront effacés.</p>
			<div class="choice-row">
				<button class="btn btn-secondary" type="button" onclick={() => (confirmingDelete = false)}>Annuler</button>
				<button class="btn btn-primary" type="button" onclick={removeEvent}>
					<Icon name="trash" size={22} />
					Supprimer
				</button>
			</div>
		</div>
	{:else}
		<button class="btn btn-secondary" type="button" onclick={() => (confirmingDelete = true)}>Supprimer l'event</button>
	{/if}
{/snippet}

{#snippet row(/** @type {{ key: string, name: string, billing: 'headliner' | 'support' }} */ band)}
	<div class="band-row" class:band-dragging={drag?.key === band.key} style:transform={drag?.key === band.key ? `translateY(${drag.dy}px)` : null}>
		<button
			class="drag-handle"
			type="button"
			aria-label="Déplacer {band.name}"
			onpointerdown={(pointer) => startDrag(pointer, band.key)}
			onpointermove={moveDrag}
			onpointerup={endDrag}
			onpointercancel={endDrag}
		>
			<span></span><span></span><span></span>
		</button>
		<span class="band-name">{band.name}</span>
		<button
			class="role-pill"
			class:role-support={band.billing === 'support'}
			type="button"
			aria-label={band.billing === 'headliner' ? "Tête d'affiche" : 'Première partie'}
			title={band.billing === 'headliner' ? "Tête d'affiche" : 'Première partie'}
			onclick={() => toggleBilling(band.key)}
		>
			<Icon name={band.billing === 'headliner' ? 'crown' : 'mic-vocal'} size={18} />
		</button>
		<button class="icon-button band-remove" type="button" aria-label="Retirer {band.name}" onclick={() => removeBand(band.key)}>
			<Icon name="x" size={20} />
		</button>
	</div>
{/snippet}
