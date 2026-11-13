<script>
	import { goto } from '$app/navigation';
	import { data, addArtist, addEvent, addVenue } from '#lib/store.js';
	import { showInfoToast } from '#lib/toast.js';
	import { festivalDatesValid } from '#lib/rules.js';
	import { dayChipLabel, daysFrom, daysUntil } from '#lib/present.js';
	import AddStep from '#lib/components/AddStep.svelte';
	import ExitConfirm from '#lib/components/ExitConfirm.svelte';
	import FieldMessage from '#lib/components/FieldMessage.svelte';
	import TicketFields from '#lib/components/TicketFields.svelte';
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

	/** Étape affichée (1 : le festival, 2 : les groupes, 3 : billet). */
	let step = $state(1);
	/** « Suivant » touché alors qu'il manque quelque chose : les erreurs s'affichent sous les champs. */
	let triedNext = $state(false);
	let confirmingExit = $state(false);

	/** @type {{ key: string, name: string, day: string | null, picking: boolean }[]} */
	let bands = $state([]);

	const festivalDays = $derived(daysFrom(startDate, endDate));
	const titleEmpty = $derived(!title.trim());
	const datesInvalid = $derived(!festivalDatesValid(startDate, endDate));
	// Les erreurs ne s'affichent qu'après un « Suivant » refusé.
	const titleMissing = $derived(triedNext && titleEmpty);
	const datesMissing = $derived(triedNext && datesInvalid);
	const dayMissing = $derived(triedNext && bands.some((band) => !chosenDay(band)));
	/** Quelque chose a été saisi : fermer demande alors confirmation. */
	const dirty = $derived(
		Boolean(title.trim() || startDate || venueCity.trim() || venueName.trim() || bands.length || ticketBought || priceText.trim())
	);

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

	/** @param {number} next */
	function goToStep(next) {
		step = next;
		triedNext = false;
		window.scrollTo(0, 0);
	}

	/** L'étape courante a tout ce qu'il lui faut pour passer à la suivante. */
	function stepIsValid() {
		if (step === 1) return !titleEmpty && !datesInvalid;
		if (step === 2) return bands.every((band) => chosenDay(band));
		return true;
	}

	function next() {
		if (!stepIsValid()) {
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
		const id = venueForSave();
		if (venueName.trim() && !id) return;
		const past = daysUntil(endDate) < 0;
		const isFirstEvent = $data.events.length === 0;
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
	<title>Nouveau festival — Veni Vidi Vici</title>
</svelte:head>

{#if step === 1}
	<AddStep
		title="Nouveau festival"
		{step}
		stepTitle="Quel festival ?"
		help="Le titre et les dates sont obligatoires ; le lieu peut venir plus tard."
		nextLabel="Suivant"
		onNext={next}
		onClose={close}
	>
		<div class="field" class:field-invalid={titleMissing}>
			<label for="festival-title">Titre</label>
			<div class="field-box">
				<Icon name="tent" size={20} />
				<input
					id="festival-title"
					bind:value={title}
					placeholder="Ex. Rock Werchter"
					autocomplete="off"
					aria-invalid={titleMissing}
					aria-describedby={titleMissing ? 'title-error' : undefined}
				/>
			</div>
		</div>
		{#if titleMissing}<FieldMessage id="title-error" text="Ajoute un titre pour enregistrer le festival." />{/if}
		<DateRangeField
			bind:start={startDate}
			bind:end={endDate}
			invalid={datesMissing}
			describedBy={datesMissing ? 'dates-error' : undefined}
		/>
		{#if datesMissing}<FieldMessage id="dates-error" text="Choisis le premier et le dernier jour du festival." />{/if}
		<VenueField venues={$data.venues} bind:name={venueName} bind:city={venueCity} bind:venueId />
	</AddStep>
{:else if step === 2}
	<AddStep
		title="Nouveau festival"
		{step}
		stepTitle="Quels groupes ?"
		help="Ajoute les groupes que tu veux voir, avec leur jour."
		nextLabel={bands.length ? 'Suivant' : 'Passer'}
		onNext={next}
		onBack={() => goToStep(1)}
		onClose={close}
	>
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
				<button class="icon-button band-remove" type="button" aria-label="Retirer {band.name}" onclick={() => (bands = bands.filter((item) => item.key !== band.key))}>
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
		{#if dayMissing}<FieldMessage id="day-error" text="Choisis un jour pour chaque groupe." />{/if}
	</AddStep>
{:else}
	<AddStep
		title="Nouveau festival"
		{step}
		stepTitle="Et le billet ?"
		help="Tout est facultatif, tu pourras le compléter depuis la fiche."
		nextLabel="Ajouter le festival"
		nextIcon="plus"
		onNext={next}
		onBack={() => goToStep(2)}
		onClose={close}
	>
		<TicketFields
			bind:bought={ticketBought}
			bind:priceText
			boughtHint="Pas encore ? Décoche, tu pourras le cocher plus tard."
			pricePlaceholder="289,00"
			priceId="festival-price"
		/>
	</AddStep>
{/if}

{#if confirmingExit}
	<ExitConfirm photo="festival" onLeave={() => goto('/')} onContinue={() => (confirmingExit = false)} />
{/if}
