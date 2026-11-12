<script>
	import { goto } from '$app/navigation';
	import { data, addArtist, addEvent, addVenue } from '#lib/store.js';
	import { daysUntil } from '#lib/present.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import VenueField from '#lib/components/VenueField.svelte';
	import ArtistField from '#lib/components/ArtistField.svelte';
	import DateRangeField from '#lib/components/DateRangeField.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let date = $state('');
	let title = $state('');
	let venueName = $state('');
	let venueCity = $state('');
	let venueId = $state(/** @type {string | null} */ (null));
	let ticketBought = $state(false);
	let priceText = $state('');

	/** @type {{ key: string, name: string, billing: 'headliner' | 'support' }[]} */
	let bands = $state([]);

	/** @type {{ key: string, pointerId: number, originY: number, dy: number } | null} */
	let drag = $state(null);

	const headliners = $derived(bands.filter((band) => band.billing === 'headliner'));
	const supports = $derived(bands.filter((band) => band.billing === 'support'));
	const canSave = $derived(Boolean(date));

	/** Lieu connu, lieu nouveau (ville facultative), ou rien. */
	function venueForSave() {
		if (venueId) return venueId;
		if (!venueName.trim()) return null;
		return addVenue({ name: venueName.trim(), city: venueCity.trim(), country: 'Belgique' });
	}

	/** @param {string} name @param {'headliner' | 'support'} billing */
	function addBand(name, billing) {
		const trimmed = name.trim();
		if (!trimmed) return;
		if (bands.some((band) => band.name.toLowerCase() === trimmed.toLowerCase())) return;
		bands = [...bands, { key: crypto.randomUUID(), name: trimmed, billing }];
	}

	/** @param {string} key */
	function removeBand(key) {
		bands = bands.filter((band) => band.key !== key);
	}

	/** @param {string} key */
	function toggleBilling(key) {
		bands = bands.map((band) =>
			band.key === key
				? { ...band, billing: band.billing === 'headliner' ? 'support' : 'headliner' }
				: band
		);
	}

	/** @param {PointerEvent} event @param {string} key */
	function startDrag(event, key) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		const handle = event.currentTarget;
		if (!(handle instanceof HTMLElement)) return;
		event.preventDefault();
		handle.setPointerCapture(event.pointerId);
		drag = { key, pointerId: event.pointerId, originY: event.clientY, dy: 0 };
	}

	/** @param {PointerEvent} event */
	function moveDrag(event) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		drag.dy = event.clientY - drag.originY;
	}

	/** @param {PointerEvent} event */
	function endDrag(event) {
		if (!drag || event.pointerId !== drag.pointerId) return;
		const handle = event.currentTarget;
		const row = handle instanceof HTMLElement ? handle.closest('.band-row') : null;
		if (row instanceof HTMLElement) row.style.pointerEvents = 'none';
		const hit = document.elementFromPoint(event.clientX, event.clientY);
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
		if (!canSave) return;
		const id = venueForSave();
		if (venueName.trim() && !id) return;
		const past = daysUntil(date) < 0;
		const eventId = addEvent(
			{
				type: 'concert',
				title: title.trim() || null,
				startDate: date,
				endDate: null,
				venueId: id,
				status: past ? 'attended' : 'planned',
				ticketBought,
				ticketPrice: parsePrice()
			},
			bands.flatMap((band) => {
				const artistId = addArtist(band.name);
				if (!artistId) return [];
				return [{ artistId, billing: band.billing, day: null, status: past ? 'seen' : 'to_see' }];
			})
		);
		if (eventId) goto(`/event/${eventId}`);
	}
</script>

<svelte:head>
	<title>Nouveau concert — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-pad add-form">
	<ScreenHeader title="Nouveau concert" backHref="/add" />
	<p class="hint">* Obligatoire</p>

	<div class="glass-card">
		<p class="card-title">Quand et où</p>
			<DateRangeField mode="single" label="Date *" inputId="concert-date" placeholder="Choisir la date" bind:start={date} />
		<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
		<div class="field">
			<label for="concert-title">Titre (optionnel)</label>
			<div class="field-box">
				<Icon name="music" size={20} />
				<input id="concert-title" bind:value={title} placeholder="Ex. tournée Wild God" autocomplete="off" />
			</div>
		</div>
	</div>

	<div class="glass-card">
		<p class="card-title">Groupes</p>
		<div class="zone" data-zone="headliner">
			<p class="zone-label">Tête d'affiche</p>
			<ArtistField
				artists={$data.artists}
				taken={bands.map((band) => band.name)}
				placeholder="Ajouter un groupe"
				inputId="artist-headliner"
				onAdd={(name) => addBand(name, 'headliner')}
			/>
			{#each headliners as band (band.key)}
				{@render row(band)}
			{/each}
		</div>
		<div class="zone" data-zone="support">
			<p class="zone-label">Première partie</p>
			<ArtistField
				artists={$data.artists}
				taken={bands.map((band) => band.name)}
				placeholder="Ajouter un groupe"
				inputId="artist-support"
				onAdd={(name) => addBand(name, 'support')}
			/>
			{#each supports as band (band.key)}
				{@render row(band)}
			{/each}
		</div>
	</div>

	<div class="glass-card">
		<p class="card-title">Billet</p>
		<button class="check-row" type="button" aria-pressed={ticketBought} onclick={() => (ticketBought = !ticketBought)}>
			<span class="check-box" class:check-on={ticketBought}>
				{#if ticketBought}<Icon name="check" size={18} />{/if}
			</span>
			<span>
				<span class="check-title">Billet acheté</span>
				<span class="check-meta">Affiche la pastille sur la liste et le billet.</span>
			</span>
		</button>
		<div class="field">
			<label for="concert-price">Prix du billet</label>
			<div class="field-box">
				<Icon name="euro" size={20} />
				<input id="concert-price" inputmode="decimal" bind:value={priceText} placeholder="65,00" autocomplete="off" />
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
		Ajouter le concert
	</button>
</section>

{#snippet row(/** @type {{ key: string, name: string, billing: 'headliner' | 'support' }} */ band)}
	<div
		class="band-row"
		class:band-dragging={drag?.key === band.key}
		style:transform={drag?.key === band.key ? `translateY(${drag.dy}px)` : null}
	>
		<button
			class="drag-handle"
			type="button"
			aria-label="Déplacer {band.name}"
			onpointerdown={(event) => startDrag(event, band.key)}
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
