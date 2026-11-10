<script>
	import { page } from '$app/state';
	import { data } from '#lib/store.js';
	import { goto } from '$app/navigation';
	import {
		confirmPresence,
		saveFestivalAttendance,
		updateEventReport,
		updatePerformance,
		deleteEvent
	} from '#lib/actions.js';
	import {
		eventDisplayTitle,
		formatEventDates,
		formatVenue,
		formatDate,
		formatDayLabel,
		isUpcoming,
		needsConfirmation,
		daysUntil,
		daysBetween,
		allCompanions
	} from '#lib/helpers.js';

	let store = $derived($data);
	let id = $derived(page.params.id);

	let event = $derived(store.events.find((e) => e.id === id));
	let venue = $derived(event ? store.venues.find((v) => v.id === event.venueId) : null);
	let performances = $derived(
		store.performances
			.filter((p) => p.eventId === id)
			.sort((a, b) => {
				const dayCmp = (a.day || '').localeCompare(b.day || '');
				if (dayCmp !== 0) return dayCmp;
				if (a.billing === 'headliner' && b.billing !== 'headliner') return -1;
				if (b.billing === 'headliner' && a.billing !== 'headliner') return 1;
				return 0;
			})
	);

	let title = $derived(
		event ? eventDisplayTitle(event, store.performances, store.artists) : ''
	);

	let upcoming = $derived(event ? isUpcoming(event) : false);
	let toConfirm = $derived(event ? needsConfirmation(event) : false);

	// Festival : sélection jours / groupes (état local avant save)
	let draftDays = $state(/** @type {string[]} */ ([]));
	let draftSeen = $state(/** @type {string[]} */ ([]));

	let festivalDays = $derived(
		event?.type === 'festival' ? daysBetween(event.startDate, event.endDate || event.startDate) : []
	);

	// Après « Vu », le festival demande les jours/groupes tant que rien n'est validé
	let festivalNeedsDays = $derived(
		!!event &&
			event.type === 'festival' &&
			event.status === 'attended' &&
			event.daysAttended.length === 0
	);

	let showReport = $derived(event?.status === 'attended' && !festivalNeedsDays);

	let companionInput = $state('');
	let companionOptions = $derived(allCompanions(store.events));

	function artistName(artistId) {
		return store.artists.find((a) => a.id === artistId)?.name || '?';
	}

	function billingLabel(billing) {
		if (billing === 'headliner') return 'tête d’affiche';
		if (billing === 'support') return '1ère partie';
		return '';
	}

	function toggleDay(day) {
		draftDays = draftDays.includes(day)
			? draftDays.filter((d) => d !== day)
			: [...draftDays, day];
		// Retire les groupes des jours décochés
		draftSeen = draftSeen.filter((pid) => {
			const p = performances.find((x) => x.id === pid);
			return p && (!p.day || draftDays.includes(p.day));
		});
	}

	function toggleSeen(pid) {
		draftSeen = draftSeen.includes(pid)
			? draftSeen.filter((x) => x !== pid)
			: [...draftSeen, pid];
	}

	function saveFest() {
		if (!event) return;
		saveFestivalAttendance(event.id, draftDays, draftSeen);
	}

	function setThumb(value) {
		if (!event) return;
		updateEventReport(event.id, {
			thumb: event.thumb === value ? null : value,
			comment: event.comment,
			companions: event.companions
		});
	}

	function setComment(value) {
		if (!event) return;
		updateEventReport(event.id, {
			thumb: event.thumb,
			comment: value.slice(0, 120),
			companions: event.companions
		});
	}

	function addCompanion() {
		if (!event || !companionInput.trim()) return;
		const name = companionInput.trim();
		if (event.companions.includes(name)) {
			companionInput = '';
			return;
		}
		updateEventReport(event.id, {
			thumb: event.thumb,
			comment: event.comment,
			companions: [...event.companions, name]
		});
		companionInput = '';
	}

	function removeCompanion(name) {
		if (!event) return;
		updateEventReport(event.id, {
			thumb: event.thumb,
			comment: event.comment,
			companions: event.companions.filter((c) => c !== name)
		});
	}

	function setPerfThumb(perfId, value) {
		const p = performances.find((x) => x.id === perfId);
		if (!p) return;
		updatePerformance(perfId, { thumb: p.thumb === value ? null : value });
	}

	function handleDelete() {
		if (!event) return;
		if (!confirm('Supprimer cet event ?')) return;
		deleteEvent(event.id);
		goto('/');
	}
</script>

{#if !event}
	<main>
		<p class="empty">Event introuvable.</p>
		<a href="/">← Accueil</a>
	</main>
{:else}
	<main>
		<div class="topbar">
			<a href="/">Accueil</a>
			<a href="/event/{event.id}/edit">Modifier</a>
		</div>

		<p class="chip">{event.type}</p>
		{#if event.status === 'attended'}
			<span class="chip chip-on">Vu</span>
		{:else if event.status === 'missed'}
			<span class="chip">Raté</span>
		{:else if toConfirm}
			<span class="chip chip-on">À confirmer</span>
		{:else}
			<span class="chip">Prévu</span>
		{/if}

		<h1 class="page-title" style="margin-top: 0.75rem;">{title}</h1>
		<p class="meta-block">
			{formatEventDates(event)}<br />
			{formatVenue(venue)}
			{#if event.ticketBought}
				<br />Billet acheté
			{/if}
		</p>

		<!-- AVANT L'EVENT -->
		{#if upcoming && event.status === 'planned'}
			<section class="section">
				<h2>Compte à rebours</h2>
				<p class="countdown">
					{#if daysUntil(event.startDate) === 0}
						C’est aujourd’hui
					{:else if daysUntil(event.startDate) === 1}
						Dans 1 jour
					{:else}
						Dans {daysUntil(event.startDate)} jours
					{/if}
				</p>
			</section>
		{/if}

		<!-- CONFIRMATION DE PRÉSENCE -->
		{#if toConfirm || (event.status === 'planned' && !upcoming)}
			<section class="section">
				<h2>Tu y étais ?</h2>
				<div class="row-actions">
					<button
						type="button"
						class="btn btn-primary"
						onclick={() => confirmPresence(event.id, 'attended')}
					>
						Vu
					</button>
					<button type="button" class="btn" onclick={() => confirmPresence(event.id, 'missed')}>
						Raté
					</button>
				</div>
			</section>
		{/if}

		<!-- FESTIVAL : jours et groupes -->
		{#if festivalNeedsDays}
			<section class="section">
				<h2>Jours faits</h2>
				{#each festivalDays as day}
					<label class="check-row">
						<input
							type="checkbox"
							checked={draftDays.includes(day)}
							onchange={() => toggleDay(day)}
						/>
						{formatDayLabel(day)}
					</label>
				{/each}

				{#if draftDays.length > 0}
					<h2 style="margin-top: 1.25rem;">Groupes vus</h2>
					{#each performances.filter((p) => !p.day || draftDays.includes(p.day)) as perf}
						<label class="check-row">
							<input
								type="checkbox"
								checked={draftSeen.includes(perf.id)}
								onchange={() => toggleSeen(perf.id)}
							/>
							{artistName(perf.artistId)}
							{#if perf.day}
								<span class="muted">· {formatDayLabel(perf.day)}</span>
							{/if}
						</label>
					{/each}
				{/if}

				<button type="button" class="btn btn-primary btn-block" style="margin-top: 1rem;" onclick={saveFest}>
					Valider jours & groupes
				</button>
			</section>
		{/if}

		<!-- GROUPES -->
		<section class="section">
			<h2>Groupes</h2>
			<ul class="list">
				{#each performances as perf}
					<li class="perf">
						<div class="title">{artistName(perf.artistId)}</div>
						<div class="meta">
							{#if event.type === 'concert' && billingLabel(perf.billing)}
								{billingLabel(perf.billing)}
							{/if}
							{#if perf.day}
								{event.type === 'concert' && billingLabel(perf.billing) ? '· ' : ''}{formatDayLabel(perf.day)}
							{/if}
							{#if perf.status === 'seen'}
								· vu
							{:else if perf.status === 'missed'}
								· raté
							{:else}
								· à voir
							{/if}
						</div>

						{#if showReport && perf.status === 'seen'}
							<div class="thumb-row">
								<button
									type="button"
									class:active={perf.thumb === 'up'}
									onclick={() => setPerfThumb(perf.id, 'up')}>Oui</button
								>
								<button
									type="button"
									class:active={perf.thumb === 'down'}
									onclick={() => setPerfThumb(perf.id, 'down')}>Non</button
								>
							</div>
							<div class="field">
								<label for="set-{perf.id}">Setlist (un titre par ligne)</label>
								<textarea
									id="set-{perf.id}"
									rows="3"
									value={perf.setlist}
									oninput={(e) =>
										updatePerformance(perf.id, { setlist: e.currentTarget.value })}
								></textarea>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		</section>

		<!-- COMPTE RENDU -->
		{#if showReport}
			<section class="section">
				<h2>Compte rendu</h2>

				<p class="muted">Avis global</p>
				<div class="thumb-row">
					<button type="button" class:active={event.thumb === 'up'} onclick={() => setThumb('up')}
						>Oui</button
					>
					<button
						type="button"
						class:active={event.thumb === 'down'}
						onclick={() => setThumb('down')}>Non</button
					>
				</div>

				<div class="field">
					<label for="comment">Avis (une ligne)</label>
					<input
						id="comment"
						maxlength="120"
						value={event.comment}
						oninput={(e) => setComment(e.currentTarget.value)}
					/>
				</div>

				<div class="field">
					<label for="companion">Accompagnants</label>
					<div class="companion-add">
						<input
							id="companion"
							list="companions"
							bind:value={companionInput}
							placeholder="Prénom"
						/>
						<button type="button" class="btn" onclick={addCompanion}>+</button>
					</div>
					<datalist id="companions">
						{#each companionOptions as c}
							<option value={c}></option>
						{/each}
					</datalist>
					{#if event.companions.length}
						<p class="companions">
							{#each event.companions as c}
								<button type="button" class="chip chip-on" onclick={() => removeCompanion(c)}
									>{c} ×</button
								>
							{/each}
						</p>
					{/if}
				</div>
			</section>
		{/if}

		{#if event.status === 'missed'}
			<p class="empty">Event raté — archivé sans détail.</p>
		{/if}

		<a class="btn btn-block" href="/" style="margin-top: 1.5rem;">← Retour à l’accueil</a>
		<button type="button" class="btn btn-block btn-danger" style="margin-top: 0.6rem;" onclick={handleDelete}>
			Supprimer l’event
		</button>
	</main>
{/if}

<style>
	.meta-block {
		color: var(--muted);
		margin: 0 0 0.5rem;
		line-height: 1.5;
	}

	.countdown {
		font-family: var(--font-display);
	font-style: italic;
	font-weight: 700;
		font-size: 1.8rem;
		margin: 0;
	}

	.perf {
		border-top: 1px solid var(--border);
		padding: 0.85rem 0;
	}

	.perf:last-child {
		border-bottom: 1px solid var(--border);
	}

	.perf .title {
		font-family: var(--font-display);
	font-style: italic;
	font-weight: 700;
		font-size: 1.1rem;
	}

	.perf .meta {
		color: var(--muted);
		font-size: 0.9rem;
	}

	.companion-add {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.4rem;
	}

	.companions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0.5rem 0 0;
	}
</style>
