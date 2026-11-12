<script>
	import { goto } from '$app/navigation';
	import { data, addArtist, addEvent, addVenue } from '#lib/store.js';
	import { daysUntil } from '#lib/present.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import StepActions from '#lib/components/StepActions.svelte';
	import ExitAddDialog from '#lib/components/ExitAddDialog.svelte';
	import VenueField from '#lib/components/VenueField.svelte';
	import ArtistField from '#lib/components/ArtistField.svelte';
	import DateRangeField from '#lib/components/DateRangeField.svelte';
	import Icon from '#lib/components/Icon.svelte';

	/** Étape courante du formulaire (1 : lieu, 2 : groupes, 3 : billet). */
	let step = $state(1);
	/** Le panneau « Quitter l'ajout ? » est ouvert. */
	let leaving = $state(false);
	/** La date manque : on l'a signalé après un clic sur « Suivant ». */
	let dateError = $state(false);

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

	const stepTitle = $derived(
		step === 1 ? 'Quand et où ?' : step === 2 ? 'Qui joue ?' : 'Et le billet ?'
	);
	const stepHelp = $derived(
		step === 1
			? 'La date est obligatoire. Le reste peut venir plus tard.'
			: step === 2
				? "Ajoute la tête d'affiche et, si tu veux, les premières parties."
				: 'Tout est facultatif, tu pourras le compléter depuis la fiche.'
	);
	/** À l'étape 2, le bouton dit « Passer » tant qu'aucun groupe n'est ajouté. */
	const nextLabel = $derived(
		step === 3 ? 'Ajouter le concert' : step === 2 && bands.length === 0 ? 'Passer' : 'Suivant'
	);

	/** Des champs ont été remplis : la croix demande confirmation. */
	const dirty = $derived(
		Boolean(
			date ||
				title.trim() ||
				venueName.trim() ||
				venueCity.trim() ||
				bands.length ||
				ticketBought ||
				priceText.trim()
		)
	);

	$effect(() => {
		if (date) dateError = false;
	});

	$effect(() => {
		step;
		if (typeof window !== 'undefined') window.scrollTo(0, 0);
	});

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
		if (!date) return;
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

	function goNext() {
		if (step === 1) {
			if (!date) {
				dateError = true;
				document.getElementById('concert-date')?.focus();
				return;
			}
			step = 2;
			return;
		}
		if (step === 2) {
			step = 3;
			return;
		}
		save();
	}

	function requestClose() {
		if (dirty) leaving = true;
		else goto('/add');
	}
</script>

<svelte:head>
	<title>Nouveau concert — Veni Vidi Vici</title>
</svelte:head>

{#if leaving}
	<section class="screen screen-exit">
		<ExitAddDialog onLeave={() => goto('/')} onStay={() => (leaving = false)} />
	</section>
{:else}
	<section class="screen add-stepper">
		<div class="add-step-top">
			<ScreenHeader title="Nouveau concert" close onClose={requestClose} />
			<StepHeader {step} title={stepTitle} help={stepHelp} />

			{#if step === 1}
				<div class="glass-card">
					<DateRangeField
						mode="single"
						label="Date"
						inputId="concert-date"
						placeholder="Choisir la date"
						bind:start={date}
						invalid={dateError}
						errorMessage="La date est obligatoire."
					/>
					<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
					<div class="field">
						<label for="concert-title">Titre (optionnel)</label>
						<div class="field-box">
							<Icon name="music" size={20} />
							<input
								id="concert-title"
								bind:value={title}
								placeholder="Ex. tournée Wild God"
								autocomplete="off"
							/>
						</div>
					</div>
				</div>
			{:else if step === 2}
				<div class="glass-card">
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
				</div>
			{:else}
				<div class="glass-card">
					<button
						class="check-row"
						type="button"
						aria-pressed={ticketBought}
						onclick={() => (ticketBought = !ticketBought)}
					>
						<span class="check-box" class:check-on={ticketBought}>
							{#if ticketBought}<Icon name="check" size={18} />{/if}
						</span>
						<span>
							<span class="check-title">Billet acheté</span>
							<span class="check-meta">Affiche la pastille sur la liste et le billet.</span>
						</span>
					</button>
					<div class="field">
						<label for="concert-price">Prix du billet (optionnel)</label>
						<div class="field-box">
							<Icon name="euro" size={20} />
							<input
								id="concert-price"
								inputmode="decimal"
								bind:value={priceText}
								placeholder="65,00"
								autocomplete="off"
							/>
						</div>
					</div>
					<div class="upload-box">
						<Icon name="upload" size={26} />
						<p>Ajouter le billet</p>
						<p class="hint">PDF ou image.</p>
					</div>
				</div>
			{/if}
		</div>

		<StepActions
			showBack={step > 1}
			{nextLabel}
			nextIcon={step === 3 ? 'plus' : undefined}
			onBack={() => (step -= 1)}
			onNext={goNext}
		/>
	</section>
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
