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
	const isEmpty = $derived($data.events.length === 0);

	function signOut() {
		logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Accueil — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-home" class:screen-home-empty={isEmpty}>
	{#if $data.userId}
		<ProfileHeader
			name={$data.userId}
			upcoming={upcoming.length}
			{seenEvents}
			{seenBands}
			onLogout={signOut}
			hideStats={isEmpty}
		/>
	{/if}

	{#if isEmpty}
		<div class="empty-home">
			<div class="empty-home-block">
				<div class="empty-home-texts">
					<h1 class="section-title">Events à venir</h1>
					<p class="empty-lead">Aucun event pour l'instant. Ajoute le prochain concert ou festival que tu prévois.</p>
				</div>
				<a class="add-first" href="/add">
					<Icon name="plus" size={26} />
					Ajouter mon 1er event
				</a>
			</div>
		</div>
	{:else}
		{#snippet confirmPill()}
			<a class="confirm-pill" href="/to-confirm">
				{confirmList.length === 1 ? '1 event à confirmer' : `${confirmList.length} events à confirmer`}
				<Icon name="chevron-right" size={16} />
			</a>
		{/snippet}

		{#if next}
			<!-- Prochain event : la pastille « à confirmer » est au-dessus du titre (screens/home.elyx : nextBlock) -->
			<div class="next-block">
				{#if confirmList.length > 0}{@render confirmPill()}{/if}
				<h1 class="section-title">{heading}</h1>
				<NextTicket event={next} performances={$data.performances} artists={$data.artists} venues={$data.venues} />
			</div>
		{/if}

		<!-- La liste « Events à venir » n'apparaît que s'il y en a (screens/home-first-event.elyx) -->
		{#if !next || later.length > 0}
			<div class="upcoming-block">
				{#if next}
					<h2 class="section-title">Events à venir</h2>
				{:else}
					<h1 class="section-title">Events à venir</h1>
				{/if}

				{#if !next && confirmList.length > 0}{@render confirmPill()}{/if}

				{#if upcoming.length === 0}
					<p class="empty-title">Aucun event à venir.</p>
				{:else}
					{#each later as event (event.id)}
						<EventRow {event} performances={$data.performances} artists={$data.artists} venues={$data.venues} />
					{/each}
				{/if}
			</div>
		{/if}
	{/if}
</section>

{#if !isEmpty}
	<TabBar />
{/if}
