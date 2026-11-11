<script>
	import { goto } from '$app/navigation';
	import { data, addArtist, addEvent, addVenue } from '#lib/store.js';
	import { daysUntil } from '#lib/present.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import VenueField from '#lib/components/VenueField.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let date = $state('');
	let title = $state('');
	let venueName = $state('');
	let venueCity = $state('');
	let venueId = $state(/** @type {string | null} */ (null));
	let ticketBought = $state(false);
	let priceText = $state('');
	let artistQuery = $state('');

	/** @type {{ key: string, name: string, billing: 'headliner' | 'support' }[]} */
	let bands = $state([]);

	/** @type {{ key: string, pointerId: number, originY: number, dy: number } | null} */
	let drag = $state(null);

	const headliners = $derived(bands.filter((band) => band.billing === 'headliner'));
	const supports = $derived(bands.filter((band) => band.billing === 'support'));
	const artistMatches = $derived(artistSuggestions(artistQuery));
	const canSave = $derived(Boolean(date) && venueReady() && bands.length > 0);

	/** @param {string} query */
	function artistSuggestions(query) {
		const text = query.trim().toLowerCase();
		if (!text) return [];
		const taken = new Set(bands.map((band) => band.name.toLowerCase()));
		return $data.artists
			.filter((artist) => artist.name.toLowerCase().includes(text) && !taken.has(artist.name.toLowerCase()))
			.slice(0, 6);
	}

	function venueReady() {
		if (venueId) return true;
		return Boolean(venueName.trim() && venueCity.trim());
	}

	/** @param {string} name */
	function addBand(name) {
		const trimmed = name.trim();
		if (!trimmed) return;
		if (bands.some((band) => band.name.toLowerCase() === trimmed.toLowerCase())) return;
		bands = [...bands, { key: crypto.randomUUID(), name: trimmed, billing: 'headliner' }];
		artistQuery = '';
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
		const id =
			venueId ??
			addVenue({ name: venueName.trim(), city: venueCity.trim(), country: 'Belgique' });
		if (!id) return;
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
			bands.map((band) => ({
				artistId: addArtist(band.name) ?? '',
				billing: band.billing,
				day: null,
				status: past ? 'seen' : 'to_see'
			}))
		);
		if (eventId) goto(`/event/${eventId}`);
	}

	/** @param {KeyboardEvent} event */
	function onArtistKey(event) {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		addBand(artistQuery);
	}
</script>

<svelte:head>
	<title>Nouveau concert — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-pad add-form">
	<ScreenHeader title="Nouveau concert" backHref="/add" />

	<div class="glass-card">
		<p class="card-title">Quand et où</p>
		<div class="field">
			<label for="concert-date">Date</label>
			<div class="field-box">
				<Icon name="calendar" size={20} />
				<input id="concert-date" type="date" bind:value={date} />
			</div>
		</div>
		<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
		<div class="field">
			<label for="concert-title">Titre (optionnel)</label>
			<div class="field-box">
				<Icon name="music" size={20} />
				<input id="concert-title" bind:value={title} placeholder="Ex. soirée anniversaire" autocomplete="off" />
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

		<div class="field">
			<label class="visually-hidden" for="concert-artist">Ajouter un groupe</label>
			<div class="field-box">
				<Icon name="plus" size={20} />
				<input
					id="concert-artist"
					bind:value={artistQuery}
					placeholder="Ajouter un groupe"
					autocomplete="off"
					onkeydown={onArtistKey}
				/>
			</div>
			{#if artistMatches.length > 0}
				<ul class="suggestions">
					{#each artistMatches as artist (artist.id)}
						<li><button type="button" onclick={() => addBand(artist.name)}>{artist.name}</button></li>
					{/each}
				</ul>
			{/if}
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
		<button class="role-pill" class:role-support={band.billing === 'support'} type="button" onclick={() => toggleBilling(band.key)}>
			{band.billing === 'headliner' ? "Tête d'affiche" : 'Première partie'}
		</button>
		<button class="icon-button band-remove" type="button" aria-label="Retirer {band.name}" onclick={() => removeBand(band.key)}>
			<Icon name="x" size={20} />
		</button>
	</div>
{/snippet}
