<script>
	import { data, resetDemoData } from '#lib/store.js';
	import { logout } from '#lib/auth.js';
	import {
		needsConfirmation,
		isUpcoming,
		eventDisplayTitle,
		formatEventDates,
		formatVenue
	} from '#lib/helpers.js';

	let store = $derived($data);

	let toConfirm = $derived(
		store.events
			.filter(needsConfirmation)
			.sort((a, b) => b.startDate.localeCompare(a.startDate))
	);

	// Prévus = planned + date future (les « à confirmer » sont hors liste principale)
	let planned = $derived(
		store.events
			.filter((e) => e.status === 'planned' && isUpcoming(e))
			.sort((a, b) => a.startDate.localeCompare(b.startDate))
	);

	function title(event) {
		return eventDisplayTitle(event, store.performances, store.artists);
	}

	function venue(event) {
		return formatVenue(store.venues.find((v) => v.id === event.venueId));
	}

	function handleLogout() {
		logout();
		window.location.replace('/login');
	}
</script>

<main>
	<div class="topbar">
		<h1 class="page-title">Veni</h1>
		<a href="/history">Historique</a>
	</div>

	{#if toConfirm.length > 0}
		<a class="banner" href="/event/{toConfirm[0].id}">
			{toConfirm.length} event{toConfirm.length > 1 ? 's' : ''} à confirmer
		</a>
	{/if}

	<section class="section">
		<h2>Events prévus</h2>
		{#if planned.length === 0}
			<p class="empty">Rien de prévu pour l’instant.</p>
		{:else}
			<ul class="list">
				{#each planned as event}
					<li>
						<a class="list-item" href="/event/{event.id}">
							<div class="title">{title(event)}</div>
							<div class="meta">
								{formatEventDates(event)} · {venue(event)}
								{#if event.ticketBought}
									· billet OK
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<a class="btn btn-primary btn-block btn-big" href="/add">+ Ajouter</a>

	<div class="footer-tools">
		<button type="button" class="btn" onclick={resetDemoData}>
			Réinitialiser les données de démo
		</button>
		<button type="button" class="btn" onclick={handleLogout}>Se déconnecter</button>
	</div>
</main>
