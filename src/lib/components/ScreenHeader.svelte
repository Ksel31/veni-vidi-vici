<script>
	import Icon from './Icon.svelte';

	/** @type {{ title: string, backHref?: string, close?: boolean, onClose?: () => void }} */
	let { title, backHref = '/', close = false, onClose } = $props();

	const label = $derived(close ? 'Fermer' : backHref === '/' ? "Retour à l'accueil" : 'Retour');
</script>

<header class="page-header">
	{#if onClose}
		<button class="icon-button" type="button" aria-label={label} onclick={onClose}>
			<Icon name={close ? 'x' : 'arrow-left'} />
		</button>
	{:else}
		<a class="icon-button" href={backHref} aria-label={label}>
			<Icon name={close ? 'x' : 'arrow-left'} />
		</a>
	{/if}
	<h1>{title}</h1>
</header>
