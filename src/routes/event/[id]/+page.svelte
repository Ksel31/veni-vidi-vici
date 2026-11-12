<script>
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { data, deleteEvent, setFestivalAttendance, setPresence, updateEvent, updatePerformance } from '#lib/store.js';
	import {
		dayHeading,
		daysFrom,
		daysUntil,
		eventIsPast,
		eventSummary,
		eventTitle,
		findVenue,
		priceLabel,
		rangePhrase,
		spokenDate,
		untilHeading,
		venueLine,
		weekdayName
	} from '#lib/present.js';
	import { shellTone } from '#lib/shell.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import NextTicket from '#lib/components/NextTicket.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import DeleteConfirm from '#lib/components/DeleteConfirm.svelte';

	const eventId = $derived(page.params.id ?? '');
	const event = $derived($data.events.find((item) => item.id === eventId) ?? null);
	const performances = $derived($data.performances.filter((item) => item.eventId === eventId));
	const venue = $derived(event ? findVenue($data.venues, event.venueId) : null);
	const past = $derived(event ? eventIsPast(event) : false);
	const title = $derived(event ? eventTitle(event, $data.performances, $data.artists) : 'Event');
	const place = $derived(venueLine(venue) ?? 'Lieu à venir');
	const festivalDays = $derived(event ? daysFrom(event.startDate, event.endDate || event.startDate) : []);
	const lineup = $derived(
		[...performances].sort((a, b) => rank(a.billing) - rank(b.billing))
	);

	const tone = $derived.by(() => {
		if (!event) return '';
		if (event.status === 'attended') return 'bg-event-report';
		if (past && event.type === 'festival') return 'bg-event-festival';
		if (past) return 'bg-event-confirm';
		return 'bg-event-upcoming';
	});

	const header = $derived(
		!event ? 'Event' : event.status === 'attended' ? 'Compte rendu' : past ? "Fiche de l'event" : title
	);
	const when = $derived(
		event
			? event.type === 'festival'
				? rangePhrase(event.startDate, event.endDate)
				: spokenDate(event.startDate)
			: ''
	);

	let draftFor = $state('');
	let dirty = $state(false);
	/** @type {string[]} */
	let pickDays = $state([]);
	/** @type {string[]} */
	let pickSeen = $state([]);
	let comment = $state('');
	let commentFor = $state('');
	let addingName = $state(false);
	let confirmingDelete = $state(false);
	let nameDraft = $state('');
	/** @type {Record<string, string>} */
	let setlists = $state({});
	/** @type {Record<string, boolean>} */
	let openSetlists = $state({});

	// Brouillon local tant que le festival n'est pas confirmé.
	$effect(() => {
		if (!event) return;
		if (draftFor !== event.id) {
			draftFor = event.id;
			dirty = false;
			pickDays = [];
			pickSeen = [];
			addingName = false;
			nameDraft = '';
			setlists = {};
			openSetlists = {};
		}
		if (commentFor !== event.id) {
			commentFor = event.id;
			comment = event.comment ?? '';
		}
	});

	const activeDays = $derived(dirty ? pickDays : (event?.daysAttended ?? []));
	const activeSeen = $derived(
		dirty ? pickSeen : performances.filter((item) => item.status === 'seen').map((item) => item.id)
	);
	const openDays = $derived(festivalDays.filter((day) => activeDays.includes(day)));

	const knownNames = $derived.by(() => {
		const text = nameDraft.trim().toLowerCase();
		if (!text || !event) return [];
		const used = new Set(event.companions.map((name) => name.toLowerCase()));
		const all = $data.events.flatMap((item) => item.companions);
		return [...new Set(all)]
			.filter((name) => !used.has(name.toLowerCase()) && name.toLowerCase().includes(text))
			.slice(0, 6);
	});

	$effect(() => {
		shellTone.set(tone);
		return () => shellTone.set('');
	});

	/** @param {import('#lib/store.js').Billing} billing */
	function rank(billing) {
		if (billing === 'headliner') return 0;
		if (billing === 'support') return 1;
		return 2;
	}

	/** @param {string} id */
	function artistName(id) {
		return $data.artists.find((artist) => artist.id === id)?.name ?? 'Groupe';
	}

	/** @param {string} iso */
	function bandsOn(iso) {
		return performances.filter((item) => item.day === iso);
	}

	/** @param {number} count */
	function voirLabel(count) {
		if (count === 0) return 'Aucun groupe à voir';
		if (count === 1) return '1 groupe à voir';
		return `${count} groupes à voir`;
	}

	/** @param {number} count */
	function missedLabel(count) {
		if (count === 0) return 'Aucun groupe ce jour-là.';
		if (count === 1) return 'Son groupe passera en « raté ».';
		return `Ses ${count} groupes passeront en « raté ».`;
	}

	function currentDays() {
		return dirty ? [...pickDays] : [...(event?.daysAttended ?? [])];
	}

	function currentSeen() {
		return dirty ? [...pickSeen] : performances.filter((item) => item.status === 'seen').map((item) => item.id);
	}

	/** @param {string[]} days @param {string[]} seen */
	function keepDraft(days, seen) {
		pickDays = days;
		pickSeen = seen;
		dirty = true;
	}

	/** @param {string} iso */
	function toggleDay(iso) {
		if (!event) return;
		const days = currentDays();
		const nextDays = days.includes(iso) ? days.filter((day) => day !== iso) : [...days, iso];
		const nextSeen = currentSeen().filter((id) => {
			const band = performances.find((item) => item.id === id);
			return !band?.day || band.day !== iso || nextDays.includes(iso);
		});
		if (event.status === 'attended') {
			setFestivalAttendance(event.id, nextDays, nextSeen);
			dirty = false;
			return;
		}
		keepDraft(nextDays, nextSeen);
	}

	/** @param {string} id */
	function toggleGroup(id) {
		if (!event) return;
		const seen = currentSeen();
		const nextSeen = seen.includes(id) ? seen.filter((item) => item !== id) : [...seen, id];
		if (event.status === 'attended') {
			setFestivalAttendance(event.id, currentDays(), nextSeen);
			dirty = false;
			return;
		}
		keepDraft(currentDays(), nextSeen);
	}

	function confirmFestival() {
		if (!event) return;
		setFestivalAttendance(event.id, currentDays(), currentSeen());
		dirty = false;
	}

	function markMissed() {
		if (!event) return;
		setPresence(event.id, 'missed');
		dirty = false;
	}

	function markAttended() {
		if (!event) return;
		setPresence(event.id, 'attended');
	}

	/** @param {'up' | 'down'} value */
	function setEventThumb(value) {
		if (!event) return;
		updateEvent(event.id, { thumb: event.thumb === value ? null : value });
	}

	/** @param {string} id @param {'up' | 'down'} value */
	function setBandThumb(id, value) {
		const band = performances.find((item) => item.id === id);
		if (!band) return;
		updatePerformance(id, { thumb: band.thumb === value ? null : value });
	}

	/** @param {string} value */
	function onComment(value) {
		const one = value.replace(/[\r\n]/g, '');
		comment = one;
		if (event) updateEvent(event.id, { comment: one });
	}

	/** @param {import('#lib/store.js').Performance} band */
	function setlistValue(band) {
		return setlists[band.id] ?? band.setlist;
	}

	/** @param {import('#lib/store.js').Performance} band @param {string} value */
	function onSetlist(band, value) {
		setlists = { ...setlists, [band.id]: value };
		updatePerformance(band.id, { setlist: value });
	}

	/** @param {string} id */
	function toggleSetlist(id) {
		openSetlists = { ...openSetlists, [id]: !openSetlists[id] };
	}

	function finishReport() {
		openSetlists = {};
		window.scrollTo(0, 0);
	}

	function removeThisEvent() {
		if (!event) return;
		const back = past ? '/history' : '/';
		deleteEvent(event.id);
		confirmingDelete = false;
		goto(back);
	}

	/** @param {string} name */
	function addCompanion(name) {
		if (!event) return;
		const trimmed = name.trim();
		if (!trimmed) return;
		if (event.companions.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return;
		updateEvent(event.id, { companions: [...event.companions, trimmed] });
		nameDraft = '';
		addingName = false;
	}

	/** @param {string} name */
	function removeCompanion(name) {
		if (!event) return;
		updateEvent(event.id, { companions: event.companions.filter((item) => item !== name) });
	}

	/** @param {SubmitEvent} submit */
	function onCompanion(submit) {
		submit.preventDefault();
		addCompanion(nameDraft);
	}
</script>

<svelte:head>
	<title>{title} — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-detail">
	<ScreenHeader title={header} />

	{#if !event}
		<p class="empty-title">Cet event n'existe pas.</p>
	{:else}
		{#if !past}
			<h2 class="detail-heading">{untilHeading(daysUntil(event.startDate))}</h2>
			<NextTicket {event} {performances} artists={$data.artists} venues={$data.venues} plain />
		{:else}
			<div class="name-line">
				<h2 class="detail-heading">{title}</h2>
				{#if event.status === 'planned'}
					<a class="badge-link" href="/to-confirm">
						<Icon name="chevron-right" size={16} />
						À confirmer
					</a>
				{:else if event.status === 'attended'}
					<span class="status-badge">
						<Icon name="check" size={16} />
						Vu
					</span>
				{:else if event.status === 'missed'}
					<span class="status-badge status-missed">
						<Icon name="x" size={16} />
						Raté
					</span>
				{/if}
			</div>
			{#if event.type === 'festival' || event.status === 'attended'}
				<p class="detail-meta">{eventSummary(event, venue)}</p>
			{/if}
		{/if}

		{#if !past || (event.type === 'concert' && event.status !== 'attended')}
			<div class="glass-card">
				{#if !past}<p class="card-title">Infos</p>{/if}
				<div class="field">
					<span class="field-caption">Date</span>
					<div class="field-box field-box-text">
						<Icon name="calendar" size={20} />
						<span class="field-value">{when}</span>
					</div>
				</div>
				<div class="field">
					<span class="field-caption">Lieu</span>
					<div class="field-box field-box-text">
						<Icon name="map-pin" size={20} />
						<span class="field-value">{place}</span>
					</div>
				</div>
			</div>
		{/if}

		{#if !past}
			<div class="glass-card">
				<p class="card-title">Billet</p>
				{#if event.ticketPrice != null}
					<div class="field">
						<span class="field-caption">Prix du billet</span>
						<div class="field-box">
							<Icon name="euro" size={20} />
							<span class="field-value">{priceLabel(event.ticketPrice)}</span>
						</div>
					</div>
				{/if}
				{#if event.ticketBought}
					<p class="hint">Billet acheté</p>
				{/if}
				<div class="upload-box">
					<Icon name="upload" size={26} />
					<p>Ajouter le billet</p>
					<p class="hint">PDF ou image. L'envoi n'est pas encore branché.</p>
				</div>
			</div>
		{/if}

		{#if event.type === 'concert' && lineup.length > 0 && event.status !== 'attended'}
			<div class="glass-card">
				<p class="card-title">Line-up</p>
				{#each lineup as band (band.id)}
					<div class="lineup-row">
						<span class="band-name">{artistName(band.artistId)}</span>
						{#if band.billing === 'headliner' || band.billing === 'support'}
							<span class="role-pill" class:role-support={band.billing === 'support'} role="img" aria-label={band.billing === 'headliner' ? "Tête d'affiche" : 'Première partie'} title={band.billing === 'headliner' ? "Tête d'affiche" : 'Première partie'}>
								<Icon name={band.billing === 'headliner' ? 'crown' : 'mic-vocal'} size={18} />
							</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if !past && event.type === 'festival' && lineup.length > 0}
			<div class="glass-card">
				<p class="card-title">Line-up</p>
				{#each lineup as band (band.id)}
					<div class="lineup-row">
						<span class="band-name">{artistName(band.artistId)}</span>
						{#if band.day}
							<span class="hint">{dayHeading(band.day)}</span>
						{/if}
					</div>
				{/each}
			</div>
		{/if}

		{#if past && event.type === 'concert' && event.status !== 'attended'}
			<div class="glass-card">
				<p class="card-title">Tu y étais ?</p>
				<div class="choice-row">
					<button class="btn btn-secondary" type="button" aria-pressed={event.status === 'missed'} onclick={markMissed}>
						<Icon name="x" size={22} />
						Raté
					</button>
					<button class="btn btn-primary" type="button" onclick={markAttended}>
						<Icon name="check" size={22} />
						Vu
					</button>
				</div>
			</div>
		{/if}

		{#if past && event.type === 'festival'}
			<div class="glass-card">
				<p class="card-title">1. Quels jours ?</p>
				{#each festivalDays as day (day)}
					{@const count = bandsOn(day).length}
					<button class="check-row" type="button" aria-pressed={activeDays.includes(day)} onclick={() => toggleDay(day)}>
						<span class="check-box" class:check-on={activeDays.includes(day)}>
							{#if activeDays.includes(day)}<Icon name="check" size={18} />{/if}
						</span>
						<span>
							<span class="check-title">{dayHeading(day)}</span>
							<span class="check-meta">{voirLabel(count)}</span>
						</span>
					</button>
				{/each}
			</div>

			{#each openDays as day, index (day)}
				<div class="glass-card">
					<p class="card-title">{index + 2}. {weekdayName(day)} : groupes vus</p>
					{#if bandsOn(day).length === 0}
						<p class="hint">Aucun groupe ce jour-là.</p>
					{/if}
					{#each bandsOn(day) as band (band.id)}
						<button class="check-row" type="button" aria-pressed={activeSeen.includes(band.id)} onclick={() => toggleGroup(band.id)}>
							<span class="check-box" class:check-on={activeSeen.includes(band.id)}>
								{#if activeSeen.includes(band.id)}<Icon name="check" size={18} />{/if}
							</span>
							<span>
								<span class="check-title">{artistName(band.artistId)}</span>
							</span>
						</button>
					{/each}
				</div>
			{/each}

			{#each festivalDays.filter((day) => !activeDays.includes(day)) as day (day)}
				<div class="glass-card">
					<p class="card-title">{weekdayName(day)} : jour non fait</p>
					<p class="hint">{missedLabel(bandsOn(day).length)}</p>
				</div>
			{/each}

			{#if event.status !== 'attended'}
				<div class="choice-row">
					<button class="btn btn-secondary" type="button" aria-pressed={event.status === 'missed'} onclick={markMissed}>
						<Icon name="x" size={22} />
						Raté
					</button>
					<button class="btn btn-primary" type="button" onclick={confirmFestival}>
						<Icon name="check" size={22} />
						Confirmer
					</button>
				</div>
			{/if}
		{/if}

		{#if event.status === 'attended'}
			<div class="glass-card">
				<p class="card-title">Ton avis</p>
				<div class="thumb-row">
					<button class="thumb-btn" class:thumb-btn-on={event.thumb === 'up'} type="button" aria-pressed={event.thumb === 'up'} onclick={() => setEventThumb('up')}>
						<Icon name="thumbs-up" size={20} />
						J'ai aimé
					</button>
					<button class="thumb-btn" class:thumb-btn-on={event.thumb === 'down'} type="button" aria-pressed={event.thumb === 'down'} onclick={() => setEventThumb('down')}>
						<Icon name="thumbs-down" size={20} />
						Bof
					</button>
				</div>
				<div class="field">
					<label for="event-comment">En une ligne</label>
					<div class="field-box">
						<input id="event-comment" value={comment} maxlength="140" oninput={(input) => onComment(input.currentTarget.value)} />
					</div>
				</div>
			</div>

			<div class="glass-card">
				<p class="card-title">Avec qui ?</p>
				<div class="companion-row">
					{#each event.companions as name (name)}
						<button class="chip chip-person" type="button" aria-label="Retirer {name}" onclick={() => removeCompanion(name)}>
							<Icon name="x" size={16} />
							{name}
						</button>
					{/each}
					{#if !addingName}
						<button class="chip chip-person" type="button" onclick={() => (addingName = true)}>
							<Icon name="plus" size={16} />
							Prénom
						</button>
					{/if}
				</div>
				{#if addingName}
					<form class="field" onsubmit={onCompanion}>
						<label class="visually-hidden" for="companion-name">Prénom</label>
						<div class="field-box">
							<input id="companion-name" bind:value={nameDraft} placeholder="Prénom" autocomplete="off" />
						</div>
						{#if knownNames.length > 0}
							<ul class="suggestions">
								{#each knownNames as name (name)}
									<li>
										<button type="button" onclick={() => addCompanion(name)}>{name}</button>
									</li>
								{/each}
							</ul>
						{/if}
					</form>
				{/if}
			</div>

			{#if lineup.length > 0}
				<div class="glass-card">
					<p class="card-title">Groupes</p>
					{#each lineup as band (band.id)}
						<div class="lineup-row">
							<span class="band-name">{artistName(band.artistId)}</span>
							{#if band.billing === 'headliner' || band.billing === 'support'}
								<span class="role-pill" class:role-support={band.billing === 'support'} role="img" aria-label={band.billing === 'headliner' ? "Tête d'affiche" : 'Première partie'} title={band.billing === 'headliner' ? "Tête d'affiche" : 'Première partie'}>
									<Icon name={band.billing === 'headliner' ? 'crown' : 'mic-vocal'} size={18} />
								</span>
							{/if}
							<button class="thumb-btn" class:thumb-btn-on={band.thumb === 'up'} type="button" aria-label="J'ai aimé {artistName(band.artistId)}" aria-pressed={band.thumb === 'up'} onclick={() => setBandThumb(band.id, 'up')}>
								<Icon name="thumbs-up" size={20} />
							</button>
							<button class="thumb-btn" class:thumb-btn-on={band.thumb === 'down'} type="button" aria-label="Bof {artistName(band.artistId)}" aria-pressed={band.thumb === 'down'} onclick={() => setBandThumb(band.id, 'down')}>
								<Icon name="thumbs-down" size={20} />
							</button>
						</div>
					{/each}
				</div>

				{#each lineup as band (band.id)}
					{@const open = Boolean(openSetlists[band.id])}
					<div class="glass-card setlist-card">
						<button class="setlist-head" type="button" aria-expanded={open} onclick={() => toggleSetlist(band.id)}>
							<span>
								<span class="setlist-title">Setlist de {artistName(band.artistId)}</span>
								{#if !open && setlistValue(band).trim()}
									<span class="hint">Déjà remplie</span>
								{/if}
							</span>
							<Icon name={open ? 'chevron-down' : 'chevron-right'} size={20} />
						</button>
						<div class="day-panel" class:day-panel-open={open}>
							<div class="day-panel-inner">
								<label class="visually-hidden" for="setlist-{band.id}">Setlist, un titre par ligne</label>
								<textarea
									id="setlist-{band.id}"
									class="setlist-box"
									rows="5"
									placeholder="Un titre par ligne"
									value={setlistValue(band)}
									oninput={(input) => onSetlist(band, input.currentTarget.value)}
								></textarea>
							</div>
						</div>
					</div>
				{/each}
			{/if}

			<div class="glass-card">
				<p class="card-title">Photos souvenirs</p>
				<div class="photo-grid">
					<div class="photo-add">
						<Icon name="plus" size={28} />
					</div>
				</div>
				<p class="hint">L'envoi n'est pas encore branché.</p>
			</div>

			<div class="glass-card">
				<p class="card-title">Billet</p>
				{#if event.ticketPrice != null}
					<div class="field">
						<span class="field-caption">Prix du billet</span>
						<div class="field-box">
							<Icon name="euro" size={20} />
							<span class="field-value">{priceLabel(event.ticketPrice)}</span>
						</div>
					</div>
				{/if}
				{#if event.ticketBought}
					<p class="hint">Billet acheté</p>
				{/if}
				<div class="upload-box">
					<Icon name="upload" size={26} />
					<p>Ajouter le billet</p>
					<p class="hint">PDF ou image. L'envoi n'est pas encore branché.</p>
				</div>
			</div>

			<button class="btn btn-secondary" type="button" onclick={markMissed}>
				<Icon name="x" size={22} />
				Marquer comme raté
			</button>
		{/if}

		<a class="btn btn-secondary" href="/event/{event.id}/edit">
			<Icon name="pencil" size={22} />
			Modifier l'event
		</a>
		<button class="btn btn-danger" type="button" onclick={() => (confirmingDelete = true)}>
			<Icon name="trash" size={22} />
			Supprimer l'event
		</button>
		{#if event.status === 'attended'}
			<button class="btn btn-primary" type="button" onclick={finishReport}>
				<Icon name="check" size={22} />
				Terminer
			</button>
		{/if}
		{#if confirmingDelete}
			<div class="modal-layer">
				<DeleteConfirm onCancel={() => (confirmingDelete = false)} onConfirm={removeThisEvent} />
			</div>
		{/if}
	{/if}
</section>
