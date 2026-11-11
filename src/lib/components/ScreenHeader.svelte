<script>
	import Icon from './Icon.svelte';

	/** @type {{ title: string, backHref?: string }} */
	let { title, backHref = '/' } = $props();
</script>

<header class="page-header">
	<a class="icon-button" href={backHref} aria-label="Retour à l'accueil">
		<Icon name="arrow-left" />
	</a>
	<h1>{title}</h1>
</header>
