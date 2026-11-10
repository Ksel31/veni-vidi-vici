<script>
	import { goto } from '$app/navigation';
	import { data } from '#lib/store.js';
	import { addEvent } from '#lib/actions.js';
	import { today } from '#lib/helpers.js';

	let store = $derived($data);

	/** @type {'planned'|'past'} */
	let when = $state('planned');
	let startDate = $state(today());
	let venueName = $state('');
	let venueCity = $state('');
	let ticketBought = $state(false);
	/** @type {{ name: string, billing: 'headliner'|'support'|'' }[]} */
	let lineup = $state([
		{ name: '', billing: 'headliner' },
		{ name: '', billing: 'support' }
	]);

	function addRow() {
		lineup = [...lineup, { name: '', billing: '' }];
	}

	function removeRow(index) {
		lineup = lineup.filter((_, i) => i !== index);
	}

	function submit(e) {
		e.preventDefault();
		if (!venueName.trim() || !startDate) return;
		if (!lineup.some((r) => r.name.trim())) return;

		const id = addEvent({
			type: 'concert',
			title: null,
			startDate,
			endDate: null,
			venueName,
			venueCity,
			ticketBought,
			when,
			lineup: lineup.map((r) => ({
				name: r.name,
				billing: r.billing || null,
				day: null
			}))
		});
		goto(`/event/${id}`);
	}
</script>

<main>
	<div class="topbar">
		<h1 class="page-title">Concert</h1>
		<a href="/add">Retour</a>
	</div>

	<form onsubmit={submit}>
		<div class="field">
			<span class="field-label">Moment <span class="req">*</span></span>
			<div class="choice-row">
				<label>
					<input type="radio" name="when" value="planned" bind:group={when} />
					Prévu (à venir)
				</label>
				<label>
					<input type="radio" name="when" value="past" bind:group={when} />
					Déjà passé
				</label>
			</div>
		</div>

		<div class="field">
			<label for="date">Date <span class="req">*</span></label>
			<input id="date" type="date" bind:value={startDate} required />
		</div>

		<div class="field">
			<label for="venue">Lieu <span class="req">*</span></label>
			<input
				id="venue"
				list="venues"
				bind:value={venueName}
				placeholder="Ancienne Belgique"
				required
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
			<h2>Groupes <span class="req">*</span></h2>
			{#each lineup as row, i}
				<div class="lineup-row">
					<input
						list="artists"
						bind:value={row.name}
						placeholder="Nom du groupe"
						required={i === 0}
					/>
					<select bind:value={row.billing}>
						<option value="headliner">Tête d’affiche</option>
						<option value="support">1ère partie</option>
						<option value="">—</option>
					</select>
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

<style>
	.field-label {
		display: block;
		font-size: 0.85rem;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 0.35rem;
	}

	.lineup-row {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 0.4rem;
		margin-bottom: 0.5rem;
	}

	.lineup-row input,
	.lineup-row select {
		background: transparent;
		border: 1px solid var(--border);
		padding: 0.5rem 0.6rem;
		color: inherit;
	}
</style>
