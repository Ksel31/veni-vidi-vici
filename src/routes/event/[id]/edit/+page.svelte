<script>
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { data } from '#lib/store.js';
	import { updateEvent } from '#lib/actions.js';
	import { daysBetween, formatDayLabel } from '#lib/helpers.js';

	let store = $derived($data);
	let id = $derived(page.params.id);
	let event = $derived(store.events.find((e) => e.id === id));

	let ready = $state(false);
	let type = $state(/** @type {'concert'|'festival'} */ ('concert'));
	let title = $state('');
	let startDate = $state('');
	let endDate = $state('');
	let venueName = $state('');
	let venueCity = $state('');
	let ticketBought = $state(false);
	/** @type {{ name: string, billing: 'headliner'|'support'|'', day: string|null }[]} */
	let lineup = $state([]);

	$effect(() => {
		if (!event || ready) return;
		const venue = event.venueId
			? store.venues.find((v) => v.id === event.venueId)
			: null;
		type = event.type;
		title = event.title || '';
		startDate = event.startDate;
		endDate = event.endDate || event.startDate;
		venueName = venue?.name || '';
		venueCity = venue?.city || '';
		ticketBought = event.ticketBought;
		lineup = store.performances
			.filter((p) => p.eventId === event.id)
			.map((p) => ({
				name: store.artists.find((a) => a.id === p.artistId)?.name || '',
				billing: /** @type {'headliner'|'support'|''} */ (p.billing || ''),
				day: p.day
			}));
		if (lineup.length === 0) {
			lineup = [
				{
					name: '',
					billing: type === 'concert' ? 'headliner' : '',
					day: type === 'festival' ? startDate : null
				}
			];
		}
		ready = true;
	});

	let festivalDays = $derived(daysBetween(startDate, endDate || startDate));

	function addRow() {
		lineup = [
			...lineup,
			{
				name: '',
				billing: type === 'concert' ? '' : '',
				day: type === 'festival' ? festivalDays[0] || startDate : null
			}
		];
	}

	function removeRow(index) {
		lineup = lineup.filter((_, i) => i !== index);
	}

	function submit(e) {
		e.preventDefault();
		if (!event || !startDate) return;
		if (type === 'concert' && !venueName.trim()) return;
		if (type === 'festival' && !title.trim()) return;

		updateEvent(event.id, {
			type,
			title: type === 'festival' ? title.trim() : null,
			startDate,
			endDate: type === 'festival' ? endDate || startDate : null,
			venueName,
			venueCity,
			ticketBought,
			lineup: lineup.map((r) => ({
				name: r.name,
				billing: type === 'festival' ? null : r.billing || null,
				day: type === 'festival' ? r.day : null
			}))
		});
		goto(`/event/${event.id}`);
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
			<h1 class="page-title">Modifier</h1>
			<a href="/event/{event.id}">Retour</a>
		</div>

		<form onsubmit={submit}>
			{#if type === 'festival'}
				<div class="field">
					<label for="title">Titre <span class="req">*</span></label>
					<input id="title" bind:value={title} required />
				</div>
			{/if}

			<div class="field">
				<label for="start"
					>Date{type === 'festival' ? ' de début' : ''} <span class="req">*</span></label
				>
				<input id="start" type="date" bind:value={startDate} required />
			</div>

			{#if type === 'festival'}
				<div class="field">
					<label for="end">Date de fin <span class="req">*</span></label>
					<input id="end" type="date" bind:value={endDate} required />
				</div>
			{/if}

			<div class="field">
				<label for="venue">
					Lieu{#if type === 'concert'} <span class="req">*</span>{/if}
				</label>
				<input
					id="venue"
					list="venues"
					bind:value={venueName}
					required={type === 'concert'}
					placeholder="Ancienne Belgique"
				/>
				<datalist id="venues">
					{#each store.venues as v}
						<option value={v.name}>{v.city}</option>
					{/each}
				</datalist>
			</div>

			<div class="field">
				<label for="city">Ville</label>
				<input id="city" bind:value={venueCity} placeholder="Bruxelles" />
			</div>

			<section class="section">
				<h2>
					{#if type === 'festival'}Groupes à voir{:else}Groupes <span class="req">*</span>{/if}
				</h2>
				{#each lineup as row, i}
					<div class="lineup-row">
						<input
							list="artists"
							bind:value={row.name}
							required={type === 'concert' && i === 0}
							placeholder="Nom du groupe"
						/>
						{#if type === 'festival'}
							<select bind:value={row.day}>
								{#each festivalDays as d}
									<option value={d}>{formatDayLabel(d)}</option>
								{/each}
							</select>
						{:else}
							<select bind:value={row.billing}>
								<option value="headliner">Tête d’affiche</option>
								<option value="support">1ère partie</option>
								<option value="">—</option>
							</select>
						{/if}
						{#if lineup.length > 1}
							<button type="button" class="btn" onclick={() => removeRow(i)}>×</button>
						{/if}
					</div>
				{/each}
				<datalist id="artists">
					{#each store.artists as a}
						<option value={a.name}></option>
					{/each}
				</datalist>
				<button type="button" class="btn" onclick={addRow}>+ Groupe</button>
			</section>

			<label class="check-row">
				<input type="checkbox" bind:checked={ticketBought} />
				Billet acheté
			</label>

			<button type="submit" class="btn btn-primary btn-block" style="margin-top: 1.25rem;">
				Enregistrer
			</button>
		</form>
	</main>
{/if}

<style>
	.lineup-row {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.35rem;
		margin-bottom: 0.75rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid rgba(43, 17, 24, 0.15);
	}

	.lineup-row input,
	.lineup-row select {
		background: transparent;
		border: 1px solid var(--border);
		padding: 0.5rem 0.6rem;
		color: inherit;
	}
</style>
