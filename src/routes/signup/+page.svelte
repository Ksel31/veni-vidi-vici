<script>
	import { goto } from '$app/navigation';
	import { createAccount, isUsernameTaken } from '#lib/accounts.js';
	import { login, needsOnboarding } from '#lib/store.js';
	import TextField from '#lib/components/TextField.svelte';
	import FieldMessage from '#lib/components/FieldMessage.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let username = $state('');
	let firstName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmation = $state('');

	/** « Créer mon compte » touché : les erreurs s'affichent sous les champs, le bouton reste actif. */
	let tried = $state(false);
	/** Le nom a été refusé parce qu'il existe déjà. */
	let usernameTaken = $state(false);

	const usernameEmpty = $derived(tried && !username.trim());
	const passwordEmpty = $derived(tried && !password);
	const mismatch = $derived(tried && password !== confirmation);

	// Dès que le nom change, l'ancienne erreur « déjà pris » ne le concerne plus.
	$effect(() => {
		username;
		usernameTaken = false;
	});

	/** @param {SubmitEvent} event */
	function submit(event) {
		event.preventDefault();
		tried = true;
		// Toutes les erreurs s'affichent ensemble : nom déjà pris et mots de passe différents peuvent coexister.
		usernameTaken = Boolean(username.trim()) && isUsernameTaken(username);
		if (usernameTaken || !username.trim() || !password || password !== confirmation) return;

		createAccount({ username, firstName, email, password });
		// Le compte est neuf et vide : on l'ouvre et l'onboarding commence.
		login(username);
		goto(needsOnboarding() ? '/onboarding' : '/');
	}
</script>

<svelte:head>
	<title>Créer un compte — Veni Vidi Vici</title>
</svelte:head>

<section class="screen screen-signup">
	<header class="page-header">
		<a class="icon-button" href="/login" aria-label="Retour à la connexion">
			<Icon name="arrow-left" />
		</a>
		<h1>Créer un compte</h1>
	</header>

	<form class="signup-form" onsubmit={submit} novalidate>
		<div class="glass-card">
			<div class="field-group">
				<TextField
					id="signup-username"
					label="Nom d'utilisateur"
					icon="at-sign"
					autocomplete="username"
					bind:value={username}
					invalid={usernameTaken || usernameEmpty}
					describedBy={usernameTaken || usernameEmpty ? 'username-error' : undefined}
				/>
				{#if usernameTaken}
					<FieldMessage id="username-error" text="Ce nom d'utilisateur est déjà pris. Essaie-en un autre." />
				{:else if usernameEmpty}
					<FieldMessage id="username-error" text="Choisis un nom d'utilisateur." />
				{/if}
			</div>

			<TextField
				id="signup-first-name"
				label="Prénom (facultatif)"
				icon="user"
				autocomplete="given-name"
				bind:value={firstName}
			/>

			<div class="field-group">
				<TextField
					id="signup-email"
					label="E-mail (facultatif)"
					icon="mail"
					type="email"
					autocomplete="email"
					placeholder="nom@exemple.com"
					bind:value={email}
					describedBy="email-hint"
				/>
				<p class="hint field-hint" id="email-hint">Pour récupérer ton mot de passe</p>
			</div>

			<div class="field-group">
				<TextField
					id="signup-password"
					label="Mot de passe"
					icon="lock"
					type="password"
					autocomplete="new-password"
					bind:value={password}
					invalid={passwordEmpty}
					describedBy={passwordEmpty ? 'password-error' : undefined}
				/>
				{#if passwordEmpty}<FieldMessage id="password-error" text="Choisis un mot de passe." />{/if}
			</div>

			<div class="field-group">
				<TextField
					id="signup-confirmation"
					label="Confirmer le mot de passe"
					icon="lock"
					type="password"
					autocomplete="new-password"
					bind:value={confirmation}
					invalid={mismatch}
					describedBy={mismatch ? 'confirmation-error' : undefined}
				/>
				{#if mismatch}<FieldMessage id="confirmation-error" text="Les mots de passe ne sont pas identiques." />{/if}
			</div>
		</div>

		<button class="btn btn-primary" type="submit">
			<Icon name="chevron-right" size={22} />
			Créer mon compte
		</button>

		<a class="text-link" href="/login">Déjà un compte ? Se connecter</a>
	</form>
</section>
