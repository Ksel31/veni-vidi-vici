<script>
	import Icon from './Icon.svelte';

	/** @type {{ name: string, upcoming: number, seenEvents: number, seenBands: number, onLogout: () => void, hideStats?: boolean }} */
	let { name, upcoming, seenEvents, seenBands, onLogout, hideStats = false } = $props();

	const initial = $derived(name.trim().charAt(0).toUpperCase() || '?');
</script>

<header class="profile" class:profile-compact={hideStats}>
	<div class="profile-row">
		<div class="who">
			<span class="avatar" aria-hidden="true">{initial}</span>
			<span class="profile-name">{name}</span>
			<button class="logout" type="button" onclick={onLogout}>Se déconnecter</button>
		</div>
		<!-- La loupe est sur la maquette. Aucun écran de recherche pour cette étape : le bouton ne mène nulle part. -->
		<button class="search-button" type="button" aria-label="Recherche">
			<Icon name="search" />
		</button>
	</div>
	{#if !hideStats}
		<div class="stats">
			<p>
				<span class="stat-value">{upcoming}</span>
				<span class="stat-label">À venir</span>
			</p>
			<p>
				<span class="stat-value">{seenEvents}</span>
				<span class="stat-label">Events vus</span>
			</p>
			<p>
				<span class="stat-value">{seenBands}</span>
				<span class="stat-label">Groupes vus</span>
			</p>
		</div>
	{/if}
</header>
