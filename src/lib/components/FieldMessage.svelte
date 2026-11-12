<script>
	import Icon from './Icon.svelte';

	/** @type {{ id: string, text: string }} */
	let { id, text } = $props();
</script>

<!-- ui.fieldMessage : icône + phrase sous le champ en erreur (jamais la couleur seule). -->
<p class="field-message" {id} role="alert">
	<Icon name="x" size={16} />
	<span>{text}</span>
</p>
