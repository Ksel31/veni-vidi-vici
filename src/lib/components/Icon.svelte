<script>
	/** @type {{ name: string, size?: number }} */
	let { name, size = 24 } = $props();
</script>

<!-- Les SVG Lucide sont copiés tels quels (trait noir). La couleur vient du texte du parent. -->
<span
	class="icon"
	style:width="{size}px"
	style:height="{size}px"
	style:--icon="url('/icons/{name}.svg')"
></span>
