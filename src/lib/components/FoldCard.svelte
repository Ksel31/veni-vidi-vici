<script>
	import Icon from './Icon.svelte';

	/** @type {{ title: string, open?: boolean, children: import('svelte').Snippet }} */
	let { title, open = $bindable(true), children } = $props();
</script>

<!-- components/ui.elyx : foldCard. Dépliée = flèche vers le haut. Repliée = seul le titre reste, flèche vers le bas.
     Le contenu est caché, pas retiré : ce qui est saisi dans les champs reste en place. -->
<div class="glass-card fold-card">
	<p class="card-title">{title}</p>
	<button
		class="fold-toggle"
		type="button"
		aria-expanded={open}
		aria-label="{open ? 'Replier' : 'Déplier'} {title}"
		onclick={() => (open = !open)}
	>
		<Icon name={open ? 'chevron-up' : 'chevron-down'} size={20} />
	</button>
	<div class="fold-body" hidden={!open}>
		{@render children()}
	</div>
</div>
