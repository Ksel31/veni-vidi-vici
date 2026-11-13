<script>
	import Icon from './Icon.svelte';

	/** Ligne de réglage (profile.elyx : settingRow) : libellé, valeur grisée, chevron. */
	/** @type {{ label: string, value: string }} */
	let { label, value } = $props();
</script>

<!-- Pas encore d'écran derrière les lignes dans les maquettes : elles ne mènent nulle part pour l'instant. -->
<button class="setting-row" type="button">
	<span class="setting-label">{label}</span>
	<span class="setting-value">{value}</span>
	<Icon name="chevron-right" size={20} />
</button>
