<script>
	import favicon from '#lib/assets/favicon.svg';
	import '../app.css';

	/** @type {{ children: import('svelte').Snippet }} */
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Veni Vidi Vici</title>
</svelte:head>

<!-- Colonne ~390 px, centrée sur grand écran. Photo et dégradé : app.css. -->
<div class="app-shell">
	{@render children()}
</div>
