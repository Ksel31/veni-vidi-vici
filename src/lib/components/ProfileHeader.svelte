<script>
	import Icon from './Icon.svelte';
	import Avatar from './Avatar.svelte';

	/** @type {{ initial: string, avatar: string | null, upcoming: number, seenEvents: number, seenBands: number, hideStats?: boolean }} */
	let { initial, avatar, upcoming, seenEvents, seenBands, hideStats = false } = $props();
</script>

<header class="profile" class:profile-compact={hideStats}>
	<div class="profile-row">
		<div class="who">
			<!-- Ni prénom ni pseudo ici : l'avatar (ou l'initiale) ouvre le profil. -->
			<a class="avatar-link" href="/profile" aria-label="Profil">
				<Avatar {initial} {avatar} size={52} />
			</a>
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
