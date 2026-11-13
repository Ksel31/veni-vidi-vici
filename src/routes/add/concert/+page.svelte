<script>
	import { newId } from '#lib/ids.js';
	import { goto } from '$app/navigation';
	import { data, addArtist, addEvent, addVenue } from '#lib/store.js';
	import { showInfoToast } from '#lib/toast.js';
	import { daysUntil } from '#lib/present.js';
	import AddStep from '#lib/components/AddStep.svelte';
	import ExitConfirm from '#lib/components/ExitConfirm.svelte';
	import FieldMessage from '#lib/components/FieldMessage.svelte';
	import TicketFields from '#lib/components/TicketFields.svelte';
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

	/** Étape affichée (1 : quand et où, 2 : qui joue, 3 : billet). */
	let step = $state(1);
	/** « Suivant » touché sans la date : l'erreur s'affiche sous le champ. */
	let triedNext = $state(false);
	let confirmingExit = $state(false);

	/** @type {{ key: string, name: string, billing: 'headliner' | 'support' }[]} */
	let bands = $state([]);

	/** @type {{ key: string, pointerId: number, originY: number, dy: number } | null} */
	let drag = $state(null);

	const headliners = $derived(bands.filter((band) => band.billing === 'headliner'));
	const supports = $derived(bands.filter((band) => band.billing === 'support'));
	const dateMissing = $derived(triedNext && !date);
	/** Quelque chose a été saisi : fermer demande alors confirmation. */
	const dirty = $derived(
		Boolean(date || title.trim() || venueCity.trim() || venueName.trim() || bands.length || ticketBought || priceText.trim())
	);

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
		bands = [...bands, { key: newId(), name: trimmed, billing }];
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

	/** @param {number} next */
	function goToStep(next) {
		step = next;
		triedNext = false;
		window.scrollTo(0, 0);
	}

	function next() {
		if (step === 1 && !date) {
			triedNext = true;
			return;
		}
		if (step < 3) goToStep(step + 1);
		else save();
	}

	function close() {
		if (dirty) confirmingExit = true;
		else goto('/');
	}

	function save() {
		if (!date) return;
		const id = venueForSave();
		if (venueName.trim() && !id) return;
		const past = daysUntil(date) < 0;
		const isFirstEvent = $data.events.length === 0;
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
		if (!eventId) return;
		// Tout premier event à venir : retour à l'accueil avec le toast « Event ajouté » (screens/home-first-event.elyx).
		if (isFirstEvent && !past) {
			showInfoToast('Event ajouté');
			goto('/');
		} else {
			goto(`/event/${eventId}`);
		}
	}
</script>

<svelte:head>
	<title>Nouveau concert — Veni Vidi Vici</title>
</svelte:head>

{#if step === 1}
	<AddStep
		title="Nouveau concert"
		{step}
		stepTitle="Quand et où ?"
		help="La date est obligatoire. Le reste peut venir plus tard."
		nextLabel="Suivant"
		onNext={next}
		onClose={close}
	>
		<DateRangeField
			mode="single"
			label="Date"
			inputId="concert-date"
			placeholder="Choisir la date"
			invalid={dateMissing}
			describedBy={dateMissing ? 'date-error' : undefined}
			bind:start={date}
		/>
		{#if dateMissing}<FieldMessage id="date-error" text="Choisis la date du concert pour continuer." />{/if}
		<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
		<div class="field">
			<label for="concert-title">Titre (optionnel)</label>
			<div class="field-box">
				<Icon name="music" size={20} />
				<input id="concert-title" bind:value={title} placeholder="Ex. tournée Wild God" autocomplete="off" />
			</div>
		</div>
	</AddStep>
{:else if step === 2}
	<AddStep
		title="Nouveau concert"
		{step}
		stepTitle="Qui joue ?"
		help="Ajoute la tête d'affiche et, si tu veux, les premières parties."
		nextLabel={bands.length ? 'Suivant' : 'Passer'}
		onNext={next}
		onBack={() => goToStep(1)}
		onClose={close}
	>
		<div class="zone" data-zone="headliner">
			<p class="zone-label">Tête d'affiche</p>
			{#each headliners as band (band.key)}
				{@render row(band)}
			{/each}
			<ArtistField
				artists={$data.artists}
				taken={bands.map((band) => band.name)}
				placeholder="Ajouter un groupe"
				inputId="artist-headliner"
				onAdd={(name) => addBand(name, 'headliner')}
			/>
		</div>
		<div class="zone" data-zone="support">
			<p class="zone-label">Première partie</p>
			{#each supports as band (band.key)}
				{@render row(band)}
			{/each}
			<ArtistField
				artists={$data.artists}
				taken={bands.map((band) => band.name)}
				placeholder="Ajouter un groupe"
				inputId="artist-support"
				onAdd={(name) => addBand(name, 'support')}
			/>
		</div>
	</AddStep>
{:else}
	<AddStep
		title="Nouveau concert"
		{step}
		stepTitle="Et le billet ?"
		help="Tout est facultatif, tu pourras le compléter depuis la fiche."
		nextLabel="Ajouter le concert"
		nextIcon="plus"
		onNext={next}
		onBack={() => goToStep(2)}
		onClose={close}
	>
		<TicketFields
			bind:bought={ticketBought}
			bind:priceText
			boughtHint="Affiche la pastille sur la liste et le billet."
			pricePlaceholder="65,00"
			priceId="concert-price"
		/>
	</AddStep>
{/if}

{#if confirmingExit}
	<ExitConfirm photo="concert" onLeave={() => goto('/')} onContinue={() => (confirmingExit = false)} />
{/if}

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
