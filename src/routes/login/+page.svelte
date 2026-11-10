<script>
	import { login, isLoggedIn } from '#lib/auth.js';
	import { onMount } from 'svelte';

	let username = $state('');
	let password = $state('');

	// Déjà connecté → accueil
	onMount(() => {
		if (isLoggedIn()) window.location.replace('/');
	});

	function enter() {
		login();
		window.location.replace('/');
	}
</script>

<main>
	<p class="brand">Veni Vidi Vici</p>
	<p class="muted">Connexion — n'importe quel identifiant fonctionne</p>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			enter();
		}}
	>
		<div class="field">
			<label for="username">Identifiant</label>
			<input id="username" type="text" bind:value={username} autocomplete="username" />
		</div>
		<div class="field">
			<label for="password">Mot de passe</label>
			<input id="password" type="password" bind:value={password} autocomplete="current-password" />
		</div>
		<button type="submit" class="btn btn-primary">Entrer</button>
	</form>
</main>

<style>
	.brand {
		font-family: var(--font-display);
	font-style: italic;
	font-weight: 700;
		font-size: 2.4rem;
		margin: 2rem 0 0.25rem;
	}

	form {
		margin-top: 2rem;
	}

	.btn {
		width: 100%;
		margin-top: 0.5rem;
	}
</style>
