<script>
	import { goto } from '$app/navigation';
	import { data, historyEvents, logout, toConfirmEvents, upcomingEvents } from '#lib/store.js';
	import { untilHeading, daysUntil } from '#lib/present.js';
	import ProfileHeader from '#lib/components/ProfileHeader.svelte';
	import NextTicket from '#lib/components/NextTicket.svelte';
	import EventRow from '#lib/components/EventRow.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import TabBar from '#lib/components/TabBar.svelte';

	const upcoming = $derived(upcomingEvents($data));
	const next = $derived(upcoming[0] ?? null);
	const later = $derived(upcoming.slice(1));
	const confirmList = $derived(toConfirmEvents($data));
	const seenEvents = $derived(historyEvents($data).filter((event) => event.status === 'attended').length);
	const seenBands = $derived($data.performances.filter((performance) => performance.status === 'seen').length);
	const heading = $derived(next ? untilHeading(daysUntil(next.startDate)) : '');

	function signOut() {
		logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Accueil — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-home">
	{#if $data.userId}
		<ProfileHeader
			name={$data.userId}
			upcoming={upcoming.length}
			{seenEvents}
			{seenBands}
			onLogout={signOut}
		/>
	{/if}

	{#if next}
		<h1 class="section-title">{heading}</h1>
		<NextTicket event={next} performances={$data.performances} artists={$data.artists} venues={$data.venues} />
	{/if}

	<div class="upcoming-block">
		{#if next}
			<h2 class="section-title">Events à venir</h2>
		{:else}
			<h1 class="section-title">Events à venir</h1>
		{/if}
		{#if confirmList.length > 0}
			<a class="confirm-pill" href="/to-confirm">
				{confirmList.length === 1 ? '1 event à confirmer' : `${confirmList.length} events à confirmer`}
				<Icon name="chevron-right" size={16} />
			</a>
		{/if}

		{#if upcoming.length === 0}
			<!-- L'accueil vide n'est pas dessiné dans les maquettes. -->
			<p class="empty-title">Aucun event à venir.</p>
			<p class="hint">Cet écran vide n'est pas encore dessiné.</p>
		{:else}
			{#each later as event (event.id)}
				<EventRow {event} performances={$data.performances} artists={$data.artists} venues={$data.venues} />
			{/each}
		{/if}
	</div>
</section>

<TabBar />
