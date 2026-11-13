<script>
	import Icon from './Icon.svelte';

	/** Ligne de réglage (profile.elyx : settingRow) : libellé, valeur grisée, chevron. */
	/** @type {{ label: string, value: string, onclick?: () => void }} */
	let { label, value, onclick } = $props();
</script>

<!-- Seule la ligne E-mail fait quelque chose pour l'instant (elle ouvre la saisie) ; les autres n'ont pas encore d'écran. -->
<button class="setting-row" type="button" {onclick}>
	<span class="setting-label">{label}</span>
	<span class="setting-value">{value}</span>
	<Icon name="chevron-right" size={20} />
</button>
