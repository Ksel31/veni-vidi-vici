<script>
	import { goto } from '$app/navigation';
	import { data, addArtist, addEvent, addVenue } from '#lib/store.js';
	import { dayChipLabel, daysFrom, daysUntil } from '#lib/present.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import StepHeader from '#lib/components/StepHeader.svelte';
	import StepActions from '#lib/components/StepActions.svelte';
	import ExitAddDialog from '#lib/components/ExitAddDialog.svelte';
	import VenueField from '#lib/components/VenueField.svelte';
	import ArtistField from '#lib/components/ArtistField.svelte';
	import DateRangeField from '#lib/components/DateRangeField.svelte';
	import Icon from '#lib/components/Icon.svelte';

	/** Étape courante du formulaire (1 : titre et dates, 2 : line-up, 3 : billet). */
	let step = $state(1);
	let leaving = $state(false);
	let titleError = $state(false);
	let datesError = $state(false);

	/** @type {HTMLInputElement | null} */
	let titleInput = $state(null);

	let title = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let venueName = $state('');
	let venueCity = $state('');
	let venueId = $state(/** @type {string | null} */ (null));
	let ticketBought = $state(false);
	let priceText = $state('');

	/** @type {{ key: string, name: string, day: string | null, picking: boolean }[]} */
	let bands = $state([]);

	const festivalDays = $derived(daysFrom(startDate, endDate));

	const stepTitle = $derived(
		step === 1 ? 'Quel festival ?' : step === 2 ? 'Quels groupes ?' : 'Et le billet ?'
	);
	const stepHelp = $derived(
		step === 1
			? 'Le titre et les dates sont obligatoires ; le lieu peut venir plus tard.'
			: step === 2
				? 'Ajoute les groupes que tu veux voir, avec leur jour.'
				: 'Tout est facultatif, tu pourras le compléter depuis la fiche.'
	);
	const nextLabel = $derived(
		step === 3 ? 'Ajouter le festival' : step === 2 && bands.length === 0 ? 'Passer' : 'Suivant'
	);

	const dirty = $derived(
		Boolean(
			title.trim() ||
				startDate ||
				endDate ||
				venueName.trim() ||
				venueCity.trim() ||
				bands.length ||
				ticketBought ||
				priceText.trim()
		)
	);

	$effect(() => {
		if (title.trim()) titleError = false;
	});

	$effect(() => {
		if (startDate && endDate && endDate >= startDate) datesError = false;
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

	/** @param {string} name */
	function addBand(name) {
		const trimmed = name.trim();
		if (!trimmed) return;
		if (bands.some((band) => band.name.toLowerCase() === trimmed.toLowerCase())) return;
		bands = [...bands, { key: crypto.randomUUID(), name: trimmed, day: null, picking: false }];
	}

	/** @param {{ day: string | null }} band */
	function chosenDay(band) {
		return band.day && festivalDays.includes(band.day) ? band.day : null;
	}

	/** @param {string} key @param {string} day */
	function chooseDay(key, day) {
		bands = bands.map((band) => (band.key === key ? { ...band, day, picking: false } : band));
	}

	/** @param {string} key */
	function reopenDay(key) {
		bands = bands.map((band) => (band.key === key ? { ...band, picking: true } : band));
	}

	function parsePrice() {
		const cleaned = priceText.trim().replace(',', '.').replace(/[^\d.]/g, '');
		if (!cleaned) return null;
		const value = Number(cleaned);
		return Number.isFinite(value) ? value : null;
	}

	function save() {
		if (!title.trim() || !startDate || !endDate || endDate < startDate) return;
		if (!bands.every((band) => chosenDay(band))) return;
		const id = venueForSave();
		if (venueName.trim() && !id) return;
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
			bands.flatMap((band) => {
				const artistId = addArtist(band.name);
				if (!artistId) return [];
				return [{ artistId, billing: null, day: band.day, status: 'to_see' }];
			})
		);
		if (eventId) goto(`/event/${eventId}`);
	}

	function goNext() {
		if (step === 1) {
			const missingTitle = !title.trim();
			const missingDates = !startDate || !endDate || endDate < startDate;
			titleError = missingTitle;
			datesError = missingDates;
			// « Suivant » n'est jamais grisé : on valide au clic, la première erreur reçoit le focus.
			if (missingTitle) {
				titleInput?.focus();
				return;
			}
			if (missingDates) {
				document.getElementById('festival-dates')?.focus();
				return;
			}
			step = 2;
			return;
		}
		if (step === 2) {
			// Un groupe ajouté doit avoir son jour avant de passer à la suite.
			if (!bands.every((band) => chosenDay(band))) return;
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
	<title>Nouveau festival — Veni Vidi Vici</title>
</svelte:head>

{#if leaving}
	<section class="screen screen-exit">
		<ExitAddDialog onLeave={() => goto('/')} onStay={() => (leaving = false)} />
	</section>
{:else}
	<section class="screen add-stepper">
		<div class="add-step-top">
			<ScreenHeader title="Nouveau festival" close onClose={requestClose} />
			<StepHeader {step} title={stepTitle} help={stepHelp} />

			{#if step === 1}
				<div class="glass-card">
					<div class="field" class:field-invalid={titleError}>
						<label for="festival-title">Titre</label>
						<div class="field-box">
							<Icon name="tent" size={20} />
							<input
								id="festival-title"
								bind:this={titleInput}
								bind:value={title}
								placeholder="Ex. Rock Werchter"
								autocomplete="off"
								aria-invalid={titleError}
								aria-describedby={titleError ? 'festival-title-error' : undefined}
							/>
						</div>
						{#if titleError}
							<p class="field-message" id="festival-title-error" role="alert">
								<Icon name="x" size={16} />
								Ajoute un titre pour enregistrer le festival.
							</p>
						{/if}
					</div>
					<DateRangeField
						bind:start={startDate}
						bind:end={endDate}
						label="Dates"
						inputId="festival-dates"
						invalid={datesError}
						errorMessage="Indique les dates du festival."
					/>
					<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
				</div>
			{:else if step === 2}
				<div class="glass-card">
					{#each bands as band (band.key)}
						{@const day = chosenDay(band)}
						{@const choosing = !day || band.picking}
						<div class="festival-band">
							<div class="band-line">
								<span class="band-name">{band.name}</span>
								{#if day && !band.picking}
									<button
										class="day-pill"
										type="button"
										aria-expanded="false"
										aria-label="Changer le jour de {band.name}"
										onclick={() => reopenDay(band.key)}
									>
										<span>{dayChipLabel(day)}</span>
									</button>
								{/if}
								<button
									class="icon-button band-remove"
									type="button"
									aria-label="Retirer {band.name}"
									onclick={() => (bands = bands.filter((item) => item.key !== band.key))}
								>
									<Icon name="x" size={16} />
								</button>
							</div>
							<div class="day-panel" class:day-panel-open={choosing} inert={!choosing}>
								<div class="day-panel-inner">
									{#if festivalDays.length === 0}
										<p class="hint">Indique d'abord les dates.</p>
									{:else}
										<p class="day-label">{day ? 'Jour' : 'Choisis un jour'}</p>
										<div class="day-chips" role="group" aria-label="Jour de {band.name}">
											{#each festivalDays as option (option)}
												<button
													class="chip"
													class:chip-on={day === option}
													type="button"
													aria-pressed={day === option}
													onclick={() => chooseDay(band.key, option)}
												>
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
							<span class="check-meta">Pas encore ? Décoche, tu pourras le cocher plus tard.</span>
						</span>
					</button>
					<div class="field">
						<label for="festival-price">Prix du billet (optionnel)</label>
						<div class="field-box">
							<Icon name="euro" size={20} />
							<input
								id="festival-price"
								inputmode="decimal"
								bind:value={priceText}
								placeholder="289,00"
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
