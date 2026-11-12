<script>
	import { data, toConfirmEvents } from '#lib/store.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import PendingCard from '#lib/components/PendingCard.svelte';

	const events = $derived(toConfirmEvents($data));
	const intro = $derived(
		events.length === 1
			? '1 event est passé. Dis-nous si tu y étais.'
			: `${events.length} events sont passés. Dis-nous si tu y étais.`
	);
</script>

<svelte:head>
	<title>À confirmer — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-pad">
	<ScreenHeader title="À confirmer" />
	{#if events.length === 0}
		<p class="empty-title">Aucun event à confirmer.</p>
		<p class="hint">Les events passés encore prévus apparaîtront ici.</p>
	{:else}
		<p class="hint">{intro}</p>
		<div class="card-list">
			{#each events as event (event.id)}
				<PendingCard {event} performances={$data.performances} artists={$data.artists} venues={$data.venues} />
			{/each}
		</div>
	{/if}
</section>
