<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import { data, needsOnboarding, restoreSession } from '#lib/store.js';
	import { shellTone } from '#lib/shell.js';
	import { dismissToast, toast } from '#lib/toast.js';
	import '../app.css';

	/** @type {{ children: import('svelte').Snippet }} */
	let { children } = $props();

	let ready = $state(false);
	const path = $derived(page.url.pathname);
	const loggedIn = $derived(Boolean($data.userId));
	// Connexion et inscription : les deux seuls écrans sans compte ouvert.
	const onPublicPage = $derived(path === '/login' || path === '/signup');
	const show = $derived(ready && ((onPublicPage && !loggedIn) || (!onPublicPage && loggedIn)));

	const background = $derived($shellTone || backgroundFor(path));

	/** @param {string} current */
	function backgroundFor(current) {
		if (current === '/login' || current === '/signup') return 'bg-login';
		if (current === '/') return 'bg-home';
		if (current === '/to-confirm') return 'bg-confirm';
		if (current === '/history' || current === '/profile') return 'bg-history';
		if (current === '/add') return 'bg-add-type';
		if (current.startsWith('/add/concert')) return 'bg-add-concert';
		if (current.startsWith('/add/festival')) return 'bg-add-festival';
		if (current.includes('/edit')) return 'bg-event-edit';
		if (current.startsWith('/event/')) return 'bg-event-upcoming';
		return 'bg-plain';
	}

	onMount(() => {
		restoreSession();
		ready = true;
	});

	$effect(() => {
		if (!ready) return;
		const showOnboarding = needsOnboarding($data);
		if (!loggedIn && !onPublicPage) {
			goto('/login');
			return;
		}
		// Compte vide jamais onboardé : on reste sur /onboarding, y compris au rechargement.
		if (loggedIn && showOnboarding && path !== '/onboarding') {
			goto('/onboarding');
			return;
		}
		if (loggedIn && !showOnboarding && onPublicPage) goto('/');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell {background}">
	{#if show}
		{@render children()}
	{/if}
	{#if $toast}
		<div class="toast" class:toast-above-dock={path === '/'} role="status">
			<p>{$toast.text}</p>
			{#if $toast.onUndo}
				<button
					type="button"
					onclick={() => {
						$toast?.onUndo?.();
						dismissToast();
					}}
				>
					Annuler
				</button>
			{/if}
		</div>
	{/if}
</div>
