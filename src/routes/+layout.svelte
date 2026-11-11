<script>
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import { data, restoreSession } from '#lib/store.js';
	import '../app.css';

	/** @type {{ children: import('svelte').Snippet }} */
	let { children } = $props();

	let ready = $state(false);
	const path = $derived(page.url.pathname);
	const loggedIn = $derived(Boolean($data.userId));
	const show = $derived(ready && ((path === '/login' && !loggedIn) || (path !== '/login' && loggedIn)));

	const background = $derived(backgroundFor(path));

	/** @param {string} current */
	function backgroundFor(current) {
		if (current === '/login') return 'bg-login';
		if (current === '/') return 'bg-home';
		if (current === '/to-confirm') return 'bg-confirm';
		if (current === '/history') return 'bg-history';
		if (current === '/add') return 'bg-add-type';
		if (current.startsWith('/add/concert')) return 'bg-add-concert';
		if (current.startsWith('/add/festival')) return 'bg-add-festival';
		return 'bg-plain';
	}

	onMount(() => {
		restoreSession();
		ready = true;
	});

	$effect(() => {
		if (!ready) return;
		if (!loggedIn && path !== '/login') goto('/login');
		if (loggedIn && path === '/login') goto('/');
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell {background}">
	{#if show}
		{@render children()}
	{/if}
</div>
