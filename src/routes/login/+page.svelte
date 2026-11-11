<script>
	import { goto } from '$app/navigation';
	import { login } from '#lib/store.js';
	import TextField from '#lib/components/TextField.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let identifier = $state('');
	let password = $state('');

	/** @param {SubmitEvent} event */
	function submit(event) {
		event.preventDefault();
		const name = identifier.trim();
		if (!name) return;
		login(name);
		goto('/');
	}
</script>

<svelte:head>
	<title>Connexion — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-login">
	<img class="brand-logo" src="/images/logo-white.svg" alt="Veni Vidi Vici" />

	<form class="login-form" onsubmit={submit}>
		<div class="login-intro">
			<h1>Veni, vidi, vici.</h1>
			<p>Tes concerts et festivals, à venir et déjà vécus.</p>
		</div>

		<div class="glass-card">
			<TextField id="login-id" label="Identifiant" icon="user" bind:value={identifier} />
			<TextField id="login-password" label="Mot de passe" icon="lock" type="password" bind:value={password} />
		</div>

		<button class="btn btn-primary" type="submit" disabled={identifier.trim() === ''}>
			<Icon name="chevron-right" size={22} />
			Se connecter
		</button>
		<p class="login-note">Phase 1 : prototype, aucun compte réel.</p>
	</form>
</section>
