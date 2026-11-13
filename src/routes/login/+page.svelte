<script>
	import { goto } from '$app/navigation';
	import { login, needsOnboarding } from '#lib/store.js';
	import { authErrorText } from '#lib/accounts.js';
	import { storeMode } from '#lib/config.js';
	import TextField from '#lib/components/TextField.svelte';
	import FieldMessage from '#lib/components/FieldMessage.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let identifier = $state('');
	let password = $state('');
	/** Pourquoi la connexion a échoué (mauvais mot de passe, serveur injoignable…), sinon ''. */
	let problem = $state('');
	let busy = $state(false);

	// Le compte démo et le texte « prototype » n'existent qu'en mode local (la démo en ligne).
	const isLocal = storeMode() === 'local';

	// Dès qu'on retape, l'ancienne erreur ne concerne plus la saisie.
	$effect(() => {
		identifier;
		password;
		problem = '';
	});

	/** @param {SubmitEvent} event */
	async function submit(event) {
		event.preventDefault();
		const name = identifier.trim();
		if (!name || busy) return;
		busy = true;
		const result = await login(name, password);
		busy = false;
		if (!result.ok) {
			problem = authErrorText(result.error);
			return;
		}
		goto(needsOnboarding() ? '/onboarding' : '/');
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
			<!-- Mode local (démo en ligne) uniquement : avec PocketBase, ce sont de vrais comptes. -->
			{#if isLocal}
				<p class="login-demo-hint">
					Pour tester : tape <strong>demo</strong> dans Identifiant pour un compte déjà rempli, ou un autre identifiant pour partir de zéro. Le mot de passe peut rester vide.
				</p>
			{/if}
		</div>

		<div class="glass-card">
			<TextField id="login-id" label="Identifiant" icon="at-sign" bind:value={identifier} />
			<div class="field-group">
				<TextField
					id="login-password"
					label="Mot de passe"
					icon="lock"
					type="password"
					bind:value={password}
					invalid={problem !== ''}
					describedBy={problem ? 'login-error' : undefined}
				/>
				{#if problem}<FieldMessage id="login-error" text={problem} />{/if}
			</div>
		</div>

		<button class="btn btn-primary" type="submit" disabled={identifier.trim() === '' || busy}>
			<Icon name="chevron-right" size={22} />
			Se connecter
		</button>
		<a class="text-link" href="/signup">Créer un compte</a>
		{#if isLocal}<p class="login-note">Phase 1 : prototype, aucun compte réel.</p>{/if}
	</form>
</section>
