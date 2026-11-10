<script>
	import { onMount } from 'svelte';
	import favicon from '#lib/assets/favicon.svg';
	import { isLoggedIn } from '#lib/auth.js';
	import '../app.css';

	/** @type {{children: import('svelte').Snippet}} */
	let { children } = $props();

	// Si pas connecté et pas sur /login → envoie vers la connexion
	// (pas de redirection inverse ici, pour éviter les boucles)
	onMount(() => {
		const path = window.location.pathname;
		const onLogin = path === '/login' || path === '/login/';
		if (!onLogin && !isLoggedIn()) {
			window.location.replace('/login');
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,WONK@1,9..144,700,1&family=Archivo:wght@400;700&display=swap"
		rel="stylesheet"
	/>
	<title>Veni Vidi Vici</title>
</svelte:head>

<div class="app-shell">
	{@render children()}
</div>
