<script>
	import { goto } from '$app/navigation';
	import { data, logout, upcomingEvents } from '#lib/store.js';
	import { account, displayName, initialOf, resizeAvatar, saveAvatar } from '#lib/accounts.js';
	import ScreenHeader from '#lib/components/ScreenHeader.svelte';
	import Avatar from '#lib/components/Avatar.svelte';
	import SettingRow from '#lib/components/SettingRow.svelte';
	import Icon from '#lib/components/Icon.svelte';

	// Version lue dans package.json au build (voir vite.config.js).
	const version = __APP_VERSION__;

	const isEmpty = $derived($data.events.length === 0);
	const attended = $derived($data.events.filter((event) => event.status === 'attended'));
	const seenBands = $derived($data.performances.filter((performance) => performance.status === 'seen').length);
	const festivals = $derived(attended.filter((event) => event.type === 'festival').length);
	const upcoming = $derived(upcomingEvents($data).length);

	/** @type {HTMLInputElement | null} */
	let fileInput = $state(null);

	/** Photo choisie : réduite en carré, gardée dans le navigateur. */
	async function onAvatarPicked() {
		const file = fileInput?.files?.[0];
		if (!file || !$account) return;
		try {
			saveAvatar($account, await resizeAvatar(file));
		} catch {
			// Fichier illisible ou stockage plein : l'avatar reste ce qu'il était.
		}
		if (fileInput) fileInput.value = '';
	}

	function signOut() {
		logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Profil — Veni Vidi Vici</title>
</svelte:head>

{#if $account}
	<section class="screen screen-pad screen-profile">
		<ScreenHeader title="Profil" />

		<div class="profile-identity">
			<div class="avatar-large">
				<Avatar initial={initialOf($account)} avatar={$account.avatar} size={88} />
				<button class="avatar-edit" type="button" aria-label="Modifier l'avatar" onclick={() => fileInput?.click()}>
					<Icon name="pencil" size={16} />
				</button>
				<input
					class="visually-hidden"
					type="file"
					accept="image/*"
					tabindex="-1"
					aria-hidden="true"
					bind:this={fileInput}
					onchange={onAvatarPicked}
				/>
			</div>
			<div class="profile-names">
				<p class="profile-first-name">{displayName($account)}</p>
				<p class="profile-username">@{$account.username}</p>
			</div>
		</div>

		{#if isEmpty}
			<div class="glass-card profile-card profile-encourage">
				<h2 class="card-title">Pas encore d'event</h2>
				<p class="hint">Tes chiffres apparaîtront ici dès ton premier event. Ajoute le prochain concert que tu prévois.</p>
				<a class="add-first" href="/add">
					<Icon name="plus" size={26} />
					Ajouter mon 1er concert
				</a>
			</div>
		{:else}
			<div class="glass-card profile-card profile-stats">
				<p>
					<span class="stat-value">{attended.length}</span>
					<span class="stat-label">Events vus</span>
				</p>
				<p>
					<span class="stat-value">{seenBands}</span>
					<span class="stat-label">Groupes vus</span>
				</p>
				<p>
					<span class="stat-value">{festivals}</span>
					<span class="stat-label">Festivals</span>
				</p>
				<p>
					<span class="stat-value">{upcoming}</span>
					<span class="stat-label">À venir</span>
				</p>
			</div>
		{/if}

		<div class="glass-card profile-card setting-card">
			<h2 class="card-title">Compte</h2>
			<SettingRow label="Prénom" value={$account.firstName || 'Ajouter'} />
			<SettingRow label="Mot de passe" value="Modifier" />
			<SettingRow label="E-mail" value={$account.email || 'Ajouter'} />
		</div>

		<div class="glass-card profile-card setting-card">
			<h2 class="card-title">Réglages</h2>
			<SettingRow label="À propos" value="Version {version}" />
		</div>

		<!-- Discret : simple texte grisé, pas un appel à l'action. -->
		<button class="logout-link" type="button" onclick={signOut}>Se déconnecter</button>
	</section>
{/if}
