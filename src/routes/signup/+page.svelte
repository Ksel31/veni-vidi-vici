<script>
	import { goto } from '$app/navigation';
	import { authErrorText } from '#lib/accounts.js';
	import { inscriptionsOuvertes } from '#lib/config.js';
	import { needsOnboarding, signUp } from '#lib/store.js';
	import TextField from '#lib/components/TextField.svelte';
	import FieldMessage from '#lib/components/FieldMessage.svelte';
	import Icon from '#lib/components/Icon.svelte';

	// PocketBase : inscriptions fermées par défaut, on le dit au lieu de laisser le formulaire échouer.
	const ouvertes = inscriptionsOuvertes();

	let username = $state('');
	let firstName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmation = $state('');

	/** « Créer mon compte » touché : les erreurs s'affichent sous les champs, le bouton reste actif. */
	let tried = $state(false);
	/** Le nom a été refusé parce qu'il existe déjà. */
	let usernameTaken = $state(false);
	/** Autre refus du serveur (mot de passe trop court, serveur injoignable…), sinon ''. */
	let problem = $state('');
	let busy = $state(false);

	const usernameEmpty = $derived(tried && !username.trim());
	const passwordEmpty = $derived(tried && !password);
	const mismatch = $derived(tried && password !== confirmation);

	// Dès que le nom change, l'ancienne erreur « déjà pris » ne le concerne plus.
	$effect(() => {
		username;
		usernameTaken = false;
	});
	$effect(() => {
		password;
		email;
		problem = '';
	});

	/** @param {SubmitEvent} event */
	async function submit(event) {
		event.preventDefault();
		tried = true;
		if (busy || !username.trim() || !password || password !== confirmation) return;

		busy = true;
		// Le compte est neuf et vide : il s'ouvre tout de suite et l'onboarding commence.
		const result = await signUp({ username, firstName, email, password });
		busy = false;
		if (!result.ok) {
			// Le nom pris a son message sous le champ ; les autres refus sont dits sous le bouton.
			if (result.error === 'username-taken') usernameTaken = true;
			else problem = authErrorText(result.error);
			return;
		}
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

	{#if !ouvertes}
		<div class="glass-card">
			<p id="signup-closed">{authErrorText('signups-closed')}</p>
		</div>
		<a class="text-link" href="/login">Déjà un compte ? Se connecter</a>
	{:else}
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
				<p class="hint field-hint" id="email-hint">Facultatif. Sans e-mail, c'est l'admin qui réinitialise ton mot de passe.</p>
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

		{#if problem}<FieldMessage id="signup-error" text={problem} />{/if}

		<button class="btn btn-primary" type="submit" disabled={busy}>
			<Icon name="chevron-right" size={22} />
			Créer mon compte
		</button>

		<a class="text-link" href="/login">Déjà un compte ? Se connecter</a>
	</form>
	{/if}
</section>
