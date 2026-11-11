<script>
	import Icon from './Icon.svelte';

	/** @type {{ title: string, backHref?: string }} */
	let { title, backHref = '/' } = $props();
</script>

<header class="page-header">
	<a class="icon-button" href={backHref} aria-label={backHref === '/' ? "Retour à l'accueil" : 'Retour'}>
		<Icon name="arrow-left" />
	</a>
	<h1>{title}</h1>
</header>
